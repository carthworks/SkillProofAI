import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { generateCertificatePDF } from './pdfGenerator';
import { uploadBuffer } from './s3';

const prisma = new PrismaClient();

/**
 * Check submission score (score >= 75) and auto-award an AI Verified Badge with PDF certificate.
 */
export async function checkAndAwardBadge(userId: string, problemId: string, score: number) {
  if (score < 75) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const problem = await prisma.problem.findUnique({ where: { id: problemId } });

    if (!user || !problem) {
      console.warn(`[BadgeService] User (${userId}) or Problem (${problemId}) not found.`);
      return null;
    }

    const title = `${problem.title} Verified Badge`;

    // Check if user already holds a badge for this problem
    const existingBadge = await prisma.badge.findFirst({
      where: {
        userId,
        problemSlug: problem.slug,
      },
    });

    if (existingBadge) {
      // If new score is higher, update score & return
      if (score > existingBadge.score) {
        const updated = await prisma.badge.update({
          where: { id: existingBadge.id },
          data: { score },
        });
        await updateUserXp(userId);
        return updated;
      }
      return existingBadge;
    }

    // Generate unique verification UUID
    const verifyId = uuidv4();

    // Generate PDF Certificate Buffer
    const pdfBuffer = await generateCertificatePDF({
      verifyId,
      candidateName: user.name,
      badgeTitle: title,
      problemTitle: problem.title,
      score,
      issuedAt: new Date(),
    });

    // Upload to MinIO/S3 object storage
    let pdfUrl: string | null = null;
    try {
      const s3Key = `certificates/${userId}/${verifyId}.pdf`;
      pdfUrl = await uploadBuffer(s3Key, pdfBuffer, 'application/pdf');
    } catch (s3Err) {
      console.warn('[BadgeService] S3 upload failed, fallback URL used:', s3Err);
      pdfUrl = `/api/verify/${verifyId}/pdf`;
    }

    // Create Badge record in database
    const newBadge = await prisma.badge.create({
      data: {
        verifyId,
        userId,
        title,
        problemTitle: problem.title,
        problemSlug:  problem.slug,
        score,
        status:       'AI_VERIFIED',
        pdfUrl:       pdfUrl ?? `/api/verify/${verifyId}/pdf`,
      },
    });

    // Recalculate and persist user total XP
    await updateUserXp(userId);

    console.log(`[BadgeService] Awarded Badge ${newBadge.id} (${verifyId}) to user ${userId} for ${problem.title}`);
    return newBadge;
  } catch (err) {
    console.error('[BadgeService] Failed to award badge:', err);
    return null;
  }
}

/**
 * Recalculate user XP as the sum of all badge scores + bonus rewards
 */
export async function updateUserXp(userId: string): Promise<number> {
  try {
    const userBadges = await prisma.badge.findMany({
      where: { userId },
      select: { score: true },
    });

    const totalBadgeScore = userBadges.reduce((acc, b) => acc + (b.score || 0), 0);
    const newXp = totalBadgeScore * 10; // 10 XP per score point

    await prisma.user.update({
      where: { id: userId },
      data: { xp: newXp },
    });

    return newXp;
  } catch (err) {
    console.error('[BadgeService] Failed to update user XP:', err);
    return 0;
  }
}
