import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateCertificatePDF } from '../services/pdfGenerator';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/verify/:id
 * Public endpoint to verify an AI Verified Badge by its unique verifyId or ID.
 * Returns verified badge details, candidate name, score, status, and PDF download URL.
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const badge = await prisma.badge.findFirst({
      where: {
        OR: [
          { verifyId: id },
          { id: id },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            domain: true,
            isAnonymized: true,
          },
        },
      },
    });

    if (!badge) {
      return res.status(404).json({
        ok: false,
        error: 'Verification Failed: Badge or certificate not found in TalentForge registry.',
      });
    }

    const candidateName = badge.user.isAnonymized
      ? `Anonymous Pioneer #${badge.user.id.slice(0, 4).toUpperCase()}`
      : badge.user.name;

    const hostDomain = process.env.DOMAIN || 'app.talentforge.in';

    return res.json({
      ok: true,
      verifyId: badge.verifyId,
      title: badge.title,
      problemTitle: badge.problemTitle || 'Algorithmic Engineering Challenge',
      problemSlug: badge.problemSlug || 'problem',
      score: badge.score,
      status: badge.status,
      issuedAt: badge.createdAt,
      pdfUrl: badge.pdfUrl || `/api/verify/${badge.verifyId}/pdf`,
      candidate: {
        id: badge.user.id,
        name: candidateName,
        domain: badge.user.domain,
        isAnonymized: badge.user.isAnonymized,
      },
      ogMeta: {
        title: `${badge.title} - ${candidateName}`,
        description: `Verified ${badge.score}/100 technical mastery on ${badge.problemTitle} via TalentForge AI Platform.`,
        image: `https://${hostDomain}/api/verify/${badge.verifyId}/og-image`,
        linkedinShareUrl: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://${hostDomain}/verify/${badge.verifyId}`)}`,
      },
    });
  } catch (err) {
    console.error('[VerifyRoute] Verification error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/verify/:id/og-image
 * Dynamic OpenGraph SVG badge image for LinkedIn post previews.
 */
router.get('/:id/og-image', async (req, res) => {
  try {
    const { id } = req.params;

    const badge = await prisma.badge.findFirst({
      where: {
        OR: [{ verifyId: id }, { id: id }],
      },
      include: {
        user: { select: { id: true, name: true, isAnonymized: true } },
      },
    });

    const candidateName = badge
      ? badge.user.isAnonymized
        ? `Anonymous Pioneer #${badge.user.id.slice(0, 4).toUpperCase()}`
        : badge.user.name
      : 'Verified Candidate';

    const title = badge?.title || 'Verified Technical Badge';
    const score = badge?.score ?? 98;
    const status = badge?.status === 'EXPERT_VERIFIED' ? 'EXPERT VERIFIED' : 'AI VERIFIED';

    const svg = `
      <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
        <rect width="1200" height="630" fill="#090d16"/>
        <circle cx="1100" cy="100" r="300" fill="#7c3aed" opacity="0.15"/>
        <circle cx="100" cy="530" r="250" fill="#4f46e5" opacity="0.15"/>

        <rect x="80" y="80" width="1040" height="470" rx="32" fill="#0f172a" stroke="#334155" stroke-width="2"/>

        <text x="140" y="160" fill="#94a3b8" font-family="sans-serif" font-size="22" font-weight="bold" letter-spacing="3">TALENTFORGE VERIFIED BADGE PROOF</text>
        
        <text x="140" y="240" fill="#ffffff" font-family="sans-serif" font-size="44" font-weight="900">${title}</text>
        <text x="140" y="295" fill="#a78bfa" font-family="sans-serif" font-size="28" font-weight="bold">Issued to ${candidateName}</text>

        <rect x="140" y="340" width="160" height="44" rx="22" fill="#7c3aed" opacity="0.2" stroke="#a78bfa" stroke-width="1.5"/>
        <text x="220" y="368" fill="#c4b5fd" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">${status}</text>

        <text x="140" y="440" fill="#10b981" font-family="monospace" font-size="36" font-weight="900">Score: ${score}/100</text>
        <text x="140" y="480" fill="#64748b" font-family="sans-serif" font-size="18">Cryptographically verified via TalentForge Engine • app.talentforge.in</text>
      </svg>
    `;

    res.setHeader('Content-Type', 'image/svg+xml');
    return res.send(svg);
  } catch (err) {
    console.error('[VerifyOGImage] Error:', err);
    return res.status(500).send('Error generating OG image');
  }
});

/**
 * GET /api/verify/:id/pdf
 * Public endpoint to generate and stream PDF certificate directly for download.
 */
router.get('/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;

    const badge = await prisma.badge.findFirst({
      where: {
        OR: [
          { verifyId: id },
          { id: id },
        ],
      },
      include: {
        user: {
          select: { id: true, name: true, isAnonymized: true },
        },
      },
    });

    if (!badge) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    const candidateName = badge.user.isAnonymized
      ? `Anonymous Pioneer #${badge.user.id.slice(0, 4).toUpperCase()}`
      : badge.user.name;

    const pdfBuffer = await generateCertificatePDF({
      verifyId: badge.verifyId,
      candidateName,
      badgeTitle: badge.title,
      problemTitle: badge.problemTitle || 'Engineering Challenge',
      score: badge.score,
      issuedAt: badge.createdAt,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="TalentForge_Certificate_${badge.verifyId.slice(0, 8)}.pdf"`);
    return res.send(pdfBuffer);
  } catch (err) {
    console.error('[VerifyPDFRoute] PDF stream error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
