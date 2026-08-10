import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { getObjectBuffer } from '../services/s3';

const router = Router();
const prisma = new PrismaClient();

// In-memory Notifications Store (keyed by userId)
export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'EXPERT_APPROVAL' | 'EXPERT_REJECTION' | 'INFO';
  read: boolean;
  createdAt: string;
}

export const userNotifications: NotificationItem[] = [
  {
    id: 'notif-sample-1',
    userId: 'sample-user-id',
    title: 'Expert Verification Approved! ⭐ 5/5',
    message: 'Your Two Sum solution was reviewed by Senior Architect. Status flipped to Expert Verified!',
    type: 'EXPERT_APPROVAL',
    read: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

/**
 * GET /api/reviewer/notifications
 * Returns reviewer/student notifications
 */
router.get('/notifications', async (req, res) => {
  try {
    return res.json({ notifications: userNotifications, unreadCount: userNotifications.filter(n => !n.read).length });
  } catch (err: any) {
    return res.json({ notifications: [], unreadCount: 0 });
  }
});

/**
 * GET /api/reviewer/queue
 * Returns candidate submissions queue for expert human evaluation
 */

router.get('/queue', async (req, res) => {
  try {
    const submissions = await prisma.submission.findMany({
      include: {
        problem: { select: { id: true, title: true, slug: true, tier: true, domain: true } },
        user: { select: { id: true, name: true, email: true, domain: true, isAnonymized: true } },
        reviews: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const formattedQueue = await Promise.all(
      submissions.map(async (sub) => {
        let codeContent = sub.code;

        // If code is stored as S3 key, fetch object content or fallback to readable code
        if (sub.code.startsWith('submissions/')) {
          try {
            const buf = await getObjectBuffer(sub.code);
            codeContent = buf.toString('utf-8');
          } catch (e) {
            codeContent = `// [S3 Code Artifact: ${sub.code}]\n// Solution submitted by ${sub.user.name}\n\ndef solve():\n    # Expert code inspection active\n    pass`;
          }
        }

        const latestReview = sub.reviews[0] || null;
        const candidateName = sub.user.isAnonymized
          ? `Anonymous Pioneer #${sub.user.id.slice(0, 4).toUpperCase()}`
          : sub.user.name;

        return {
          id: sub.id,
          userId: sub.userId,
          candidateName,
          candidateEmail: sub.user.email,
          problemTitle: sub.problem.title,
          problemSlug: sub.problem.slug,
          tier: sub.problem.tier,
          domain: sub.problem.domain,
          score: sub.score ?? 85,
          status: sub.status,
          code: codeContent,
          submittedAt: sub.createdAt,
          review: latestReview,
        };
      })
    );

    return res.json(formattedQueue);
  } catch (err) {
    console.error('[ReviewerRoute] Queue fetch error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/reviewer/review/:submissionId
 * Accepts expert review rating, comments, and decision ('APPROVE' | 'REJECT')
 */
router.post('/review/:submissionId', async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { score = 5, comment = '', decision = 'APPROVE', reviewerName = 'Senior Technical Reviewer' } = req.body;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { problem: true, user: true },
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // 1. Create Review row in DB
    const newReview = await prisma.review.create({
      data: {
        submissionId,
        reviewer: reviewerName,
        score: Number(score),
        comment: String(comment),
      },
    });

    const isApproved = decision === 'APPROVE';
    const newStatus = isApproved ? 'EXPERT_VERIFIED' : 'REJECTED';

    // 2. Update Submission status
    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: newStatus },
    });

    // 3. Flip candidate Badge status to EXPERT_VERIFIED if approved
    if (isApproved) {
      await prisma.badge.updateMany({
        where: {
          userId: submission.userId,
          problemSlug: submission.problem.slug,
        },
        data: {
          status: 'EXPERT_VERIFIED',
        },
      });
    }

    // 4. Create Notification for candidate student
    const notifItem: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: submission.userId,
      title: isApproved ? `Expert Verified! ⭐ ${score}/5 Stars` : 'Submission Feedback Updated',
      message: isApproved
        ? `Your solution for "${submission.problem.title}" was approved by ${reviewerName}! Badge flipped to Expert Verified.`
        : `Reviewer feedback added for "${submission.problem.title}": ${comment.slice(0, 80)}...`,
      type: isApproved ? 'EXPERT_APPROVAL' : 'EXPERT_REJECTION',
      read: false,
      createdAt: new Date().toISOString(),
    };

    userNotifications.unshift(notifItem);

    return res.json({
      ok: true,
      review: newReview,
      status: newStatus,
      message: `Submission ${isApproved ? 'Approved' : 'Rejected'} and student notified successfully.`,
    });
  } catch (err) {
    console.error('[ReviewerRoute] Review submit error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
