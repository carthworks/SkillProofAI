import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/public/profile/:id
 * Fetch public profile details for a candidate.
 */
router.get('/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        domain: true,
        tier: true,
        badgesEarned: true,
        successfulSubmissions: true,
        totalSubmissions: true,
        profilePublic: true,
        aiSummary: true,
        skills: true,
        certifications: true,
        links: true,
        githubUsername: true,
        linkedinUrl: true,
        college: true,
        degree: true,
        graduationYear: true,
        badges: {
          select: {
            id: true,
            verifyId: true,
            title: true,
            score: true,
            createdAt: true,
            problemTitle: true,
            problemSlug: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (!user.profilePublic) {
      return res.status(403).json({ error: 'This profile is private' });
    }

    return res.json({ profile: user });
  } catch (error) {
    console.error('Error fetching public profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
