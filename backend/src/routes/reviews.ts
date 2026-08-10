import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/authMiddleware';
import { getObjectBuffer } from '../services/s3';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/reviews/queue
 * Returns candidate submissions queue ordered oldest AI_VERIFIED first (orderBy: { createdAt: 'asc' })
 * Protected by requireAuth & requireRole('REVIEWER')
 */
router.get('/queue', requireAuth, requireRole('REVIEWER'), async (req: AuthenticatedRequest, res) => {
  try {
    const submissions = await prisma.submission.findMany({
      where: {
        OR: [
          { status: 'AI_VERIFIED' },
          { status: 'completed' },
          { status: 'pending' },
          { status: 'EXPERT_VERIFIED' },
          { status: 'REJECTED' },
        ],
      },
      include: {
        problem: { select: { id: true, title: true, slug: true, tier: true, domain: true } },
        user: { select: { id: true, name: true, email: true, domain: true, isAnonymized: true } },
        reviews: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'asc' }, // Oldest AI_VERIFIED first
      take: 50,
    });

    const formattedQueue = await Promise.all(
      submissions.map(async (sub) => {
        let codeContent = sub.code;

        // If code is stored as S3 key, fetch object content
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
    console.error('[ReviewsRoute] Queue fetch error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/reviews/:id
 * Accepts { stars, comment, decision: 'APPROVE' | 'REJECT' }
 * Protected by requireAuth & requireRole('REVIEWER')
 */
router.post('/:id', requireAuth, requireRole('REVIEWER'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { stars = 5, score, comment = '', decision = 'APPROVE', reviewerName = 'Senior Expert Reviewer' } = req.body;
    const starRating = Number(stars || score || 5);

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: { problem: true, user: true },
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // 1. Create Review entry in DB
    const newReview = await prisma.review.create({
      data: {
        submissionId: id,
        reviewer: reviewerName,
        score: starRating,
        comment: String(comment),
      },
    });

    const isApproved = decision === 'APPROVE';
    const newSubmissionStatus = isApproved ? 'EXPERT_VERIFIED' : 'REJECTED';

    // 2. Update Submission status
    await prisma.submission.update({
      where: { id },
      data: { status: newSubmissionStatus },
    });

    // 3. Update Badge status (APPROVE -> EXPERT_VERIFIED; REJECT -> REVOKED)
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
    } else {
      await prisma.badge.updateMany({
        where: {
          userId: submission.userId,
          problemSlug: submission.problem.slug,
        },
        data: {
          status: 'REVOKED',
        },
      });
    }

    // 4. Create Notification record in Prisma Notification table
    const notifTitle = isApproved
      ? `Expert Verified! ⭐ ${starRating}/5 Stars`
      : `Submission Revoked / Rejected`;
    const notifMsg = isApproved
      ? `Your solution for "${submission.problem.title}" was approved by ${reviewerName}! Badge status flipped to Expert Verified.`
      : `Your submission for "${submission.problem.title}" was revoked/rejected. Feedback: ${comment || 'Requires revision.'}`;

    await prisma.notification.create({
      data: {
        userId: submission.userId,
        title: notifTitle,
        message: notifMsg,
        type: isApproved ? 'EXPERT_APPROVAL' : 'EXPERT_REJECTION',
        read: false,
      },
    });

    return res.json({
      ok: true,
      review: newReview,
      status: newSubmissionStatus,
      message: `Submission ${isApproved ? 'Approved & Expert Verified' : 'Rejected & Revoked'}. Student notified.`,
    });
  } catch (err) {
    console.error('[ReviewsRoute] Review submission error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
