import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthenticatedRequest } from '../middleware/authMiddleware';
import { generateLearningPath } from '../services/llmService';

const router = Router();
const prisma = new PrismaClient();

router.post('/generate', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { psychProfile: true },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    // In a real scenario, we'd also fetch the assessment score
    const assessmentScore = 85; // Placeholder

    const learningPathData = await generateLearningPath(
      user.psychProfile || { name: user.name },
      user.domain,
      assessmentScore
    );

    const learningPath = await prisma.learningPath.upsert({
      where: { userId },
      update: {
        domain: user.domain,
        milestones: learningPathData.milestones,
        weeklyGoals: learningPathData.weeklyGoals,
        recommendedProblemSlugs: learningPathData.recommendedProblemSlugs,
      },
      create: {
        userId,
        domain: user.domain,
        milestones: learningPathData.milestones,
        weeklyGoals: learningPathData.weeklyGoals,
        recommendedProblemSlugs: learningPathData.recommendedProblemSlugs,
      },
    });

    return res.json(learningPath);
  } catch (err) {
    console.error('Learning path generation error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const learningPath = await prisma.learningPath.findUnique({
      where: { userId },
    });

    if (!learningPath) return res.status(404).json({ error: 'Learning path not found' });
    return res.json(learningPath);
  } catch (err) {
    console.error('Learning path fetch error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
