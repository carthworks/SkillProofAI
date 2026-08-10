import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Computes and persists the aggregate score for a student.
 *
 * Formula:
 *   aggregateScore = (profileStrength × 0.15) + (githubScore × 0.10) + (problemScore × 0.50) + (assessmentScore × 0.25)
 *
 * - profileStrength (0–100): % of key profile fields populated
 * - githubScore     (0-100): score based on GitHub API stats
 * - problemScore    (0–100): best submission score across all problems
 * - assessmentScore (0–100): stored overallScore from psychProfile
 */
export async function computeAndSaveAggregateScore(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      mobileNumber: true,
      githubUsername: true,
      linkedinUrl: true,
      resumeUrl: true,
      skills: true,
      links: true,
      githubScore: true,
      psychProfile: { select: { overallScore: true } },
      submissions: {
        where: { status: 'completed' },
        select: { score: true },
        orderBy: { score: 'desc' },
        take: 1,
      },
    },
  });

  if (!user) return 0;

  // 1. Profile Strength (7 signals)
  const signals = [
    !!user.name,
    !!user.mobileNumber,
    !!user.githubUsername,
    !!user.linkedinUrl,
    !!user.resumeUrl,
    Array.isArray(user.skills) && (user.skills as any[]).length > 0,
    Array.isArray(user.links) && (user.links as any[]).length > 0,
  ];
  const profileStrength = Math.round((signals.filter(Boolean).length / signals.length) * 100);

  // 2. Problem Score (best submission score, default 0)
  const problemScore = user.submissions[0]?.score ?? 0;

  // 3. Assessment Score
  const assessmentScore = user.psychProfile?.overallScore ?? 0;

  // 4. GitHub Score
  const githubScore = user.githubScore ?? 0;

  // Weighted formula
  const aggregateScore = Math.round(
    profileStrength * 0.15 + githubScore * 0.10 + problemScore * 0.50 + assessmentScore * 0.25
  );

  await prisma.user.update({
    where: { id: userId },
    data: { aggregateScore },
  });

  return aggregateScore;
}
