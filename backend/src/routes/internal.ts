import { Router } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import { checkAndAwardBadge } from '../services/badgeService';
import { getAIAdapter } from '../services/ai/aiAdapterFactory';
import { computeAndSaveAggregateScore } from '../services/aggregateScore';

const router = Router();
const prisma = new PrismaClient();

const INTERNAL_SECRET = process.env.INTERNAL_SECRET ?? 'tf-internal';

/**
 * Middleware: validate x-internal-secret header.
 * Only the worker process (running on the same machine) sends this header.
 */
function requireInternalSecret(req: any, res: any, next: any) {
  const secret = req.headers['x-internal-secret'];
  if (secret !== INTERNAL_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

/**
 * PATCH /internal/submissions/:id
 * Called by the grading worker to update submission status, score, and feedback
 * after a grading job completes. Not exposed to the public.
 */
router.patch('/submissions/:id', requireInternalSecret, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, score, feedback } = req.body;

    const submission = await prisma.submission.update({
      where: { id },
      data: {
        status:   status ?? 'completed',
        score:    score  ?? null,
        feedback: feedback ? String(feedback) : null,
      },
      include: { problem: true },
    });

    const isSuccess = typeof score === 'number' && score >= 75;

    // Gamification & Notifications
    const user = await prisma.user.findUnique({ where: { id: submission.userId } });
    if (user) {
      let { successfulSubmissions, totalSubmissions, currentStreak, longestStreak, lastActivityDate } = user;
      
      totalSubmissions += 1;
      
      const today = new Date();
      today.setHours(0,0,0,0);
      const lastActivity = lastActivityDate ? new Date(lastActivityDate) : null;
      if (lastActivity) lastActivity.setHours(0,0,0,0);
      
      // Streak calculation (simple 1 day apart)
      if (!lastActivity || today.getTime() - lastActivity.getTime() > 86400000) {
          currentStreak = 1;
      } else if (today.getTime() - lastActivity.getTime() === 86400000) {
          currentStreak += 1;
      }
      if (currentStreak > longestStreak) longestStreak = currentStreak;
      
      if (isSuccess) {
         successfulSubmissions += 1;
      }
      
      await prisma.user.update({
         where: { id: user.id },
         data: {
            totalSubmissions,
            successfulSubmissions,
            currentStreak,
            longestStreak,
            lastActivityDate: new Date(),
            xp: { increment: typeof score === 'number' ? score : 50 },
         }
      });

      // Phase 7/8: Recruiter Alert on 10th submission
      if (totalSubmissions === 10) {
         await prisma.notification.create({
            data: {
               userId: user.id,
               type: 'recruiter_alert',
               title: 'Profile Visible to Recruiters',
               message: 'You have completed 10 simulations! Your profile is now actively visible to hiring managers.',
            }
         });
         console.log(`\n[Notification] 📧 Email to Employers: Candidate ${user.name} (${user.email}) reached 10 submissions! Profile active.`);
         console.log(`[Notification] 📱 WhatsApp to ${user.name}: Congrats! Recruiters can now see your verified profile on TalentForge.\n`);
      }
      
      // Phase 5: LMS Remediation Notification on Failure
      if (!isSuccess && status === 'completed') {
         await prisma.notification.create({
            data: {
               userId: user.id,
               type: 'lms_remediation',
               title: 'LMS Module Unlocked',
               message: `You struggled with "${submission.problem.title}". Watch the remediation video in the Learning Center to unlock a retest.`,
            }
         });
      }
    }

    // Auto-award badge if score >= 75
    let awardedBadge = null;
    if (isSuccess) {
      awardedBadge = await checkAndAwardBadge(submission.userId, submission.problemId, score);
      if (awardedBadge && user) {
         await prisma.user.update({
             where: { id: user.id },
             data: { badgesEarned: { increment: 1 } }
         });
      }
    }

    // Auto-update student's aggregate score in DB
    await computeAndSaveAggregateScore(submission.userId);

    return res.json({ ok: true, submission, badge: awardedBadge });
  } catch (err: any) {
    // P2025 = record not found in Prisma
    if (err?.code === 'P2025') {
      return res.status(404).json({ error: 'Submission not found' });
    }
    console.error('[Internal] Submission patch error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /internal/problems/:id/cases
 * Called by the grading worker to securely fetch both publicTestCases and hiddenTestCases
 * for a given problem. These are NEVER exposed to the public student API.
 */
router.get('/problems/:id/cases', requireInternalSecret, async (req, res) => {
  try {
    const { id } = req.params;

    const problem = await prisma.problem.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        title: true,
        publicTestCases: true,
        hiddenTestCases: true,
      },
    });

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    return res.json({
      problemId: problem.id,
      slug: problem.slug,
      title: problem.title,
      publicTestCases:  (problem.publicTestCases  as Prisma.JsonArray | null) ?? [],
      hiddenTestCases:  (problem.hiddenTestCases  as Prisma.JsonArray | null) ?? [],
    });
  } catch (err: any) {
    console.error('[Internal] Problem cases fetch error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /internal/embed-profiles
 * Triggered by the nightly BullMQ worker to extract SkillScores and generate embeddings
 * for modified user profiles.
 */
router.post('/embed-profiles', requireInternalSecret, async (req, res) => {
  try {
    // For MVP, just process up to 10 users that don't have embeddings or skills
    // In production, you'd track a 'profileModifiedSinceLastEmbed' flag.
    const users = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      take: 10,
    });

    const aiAdapter = getAIAdapter();
    let processed = 0;

    for (const user of users) {
      // 1. Extract Skills
      const prompt = `Extract skills for a software engineering student named ${user.name}. Domain: ${user.domain}. Format as SkillScore[]`;
      const skillsData = await aiAdapter.generateJSON<any[]>(prompt);
      
      if (Array.isArray(skillsData) && skillsData.length > 0) {
        // Delete existing skills
        await prisma.skillScore.deleteMany({ where: { userId: user.id } });
        
        // Insert new skills
        for (const skillItem of skillsData) {
          if (skillItem.skill && typeof skillItem.score === 'number') {
            await prisma.skillScore.create({
              data: {
                userId: user.id,
                skill: String(skillItem.skill),
                score: Number(skillItem.score),
                category: String(skillItem.category || 'core'),
              }
            });
          }
        }
      }

      // 2. Generate Embedding
      const profileText = `Name: ${user.name}, Domain: ${user.domain}, Bio: Software Engineer. Skills: ${Array.isArray(skillsData) ? skillsData.map(s => s.skill).join(', ') : 'None'}`;
      const embedding = await aiAdapter.generateEmbedding(profileText);
      
      if (embedding && embedding.length === 1536) {
        // Use raw SQL to update the vector column
        // Cast string representation to vector: '[0.1, 0.2, ...]'
        const vectorString = `[${embedding.join(',')}]`;
        await prisma.$executeRawUnsafe(
          `UPDATE "User" SET "profileEmbedding" = $1::vector WHERE id = $2`,
          vectorString,
          user.id
        );
      }
      processed++;
    }

    return res.json({ ok: true, processed });
  } catch (err: any) {
    console.error('[Internal] Embed profiles error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
