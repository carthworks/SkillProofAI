import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import passport from 'passport';
import { PrismaClient } from '@prisma/client';
import redis from '../services/redis';
import { validate } from '../middleware/validate';
import { requireAuth, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET ?? 'secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'refresh-secret';

// Schemas
const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    name: z.string().min(2, 'Name must be at least 2 characters long'),
    domain: z.enum(['cse', 'ece'], {
      errorMap: () => ({ message: "Domain must be either 'cse' or 'ece'" }),
    }),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
  }),
});

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string({ required_error: 'Refresh token is required' }),
  }).strict(),
});

const employerRegisterSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2),
    company: z.string().min(1, 'Company name required'),
    domain: z.enum(['cse', 'ece']).default('cse'),
    companyWebsite: z.string().url().optional().or(z.literal('')),
    bookingUrl: z.string().url().optional().or(z.literal('')),
    targetRoles: z.string().optional(), // comma-separated: "Backend Engineer, React Dev"
    minScoreThreshold: z.number().min(0).max(100).default(75),
  }),
});

const githubOAuthSchema = z.object({
  body: z.object({
    code: z.string({ required_error: 'GitHub OAuth code required' }),
  }).strict(),
});

const linkedinOAuthSchema = z.object({
  body: z.object({
    code: z.string({ required_error: 'LinkedIn OAuth code required' }),
    redirectUri: z.string().optional(),
  }).strict(),
});

const onboardingSchema = z.object({
  body: z.object({
    selectedDomain: z.string().optional(),
    college: z.string().optional(),
    degree: z.string().optional(),
    graduationYear: z.string().optional(),
  }).strict(),
});

// Helper: Issue Tokens
async function issueTokens(userId: string, role: string = 'STUDENT') {
  const accessToken = jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
  const refreshToken = jwt.sign({ userId, role }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

  // Store refresh token in Redis (7 days expiration) with fallback guard
  try {
    await redis.set(`refresh:${userId}`, refreshToken, 'EX', 604800);
  } catch (err: any) {
    console.warn(`[Auth] Redis token store warning (continuing login):`, err.message);
  }

  return { accessToken, refreshToken };
}


// ─── POST /api/auth/register-employer ───────────────────────────────────────
router.post('/register-employer', validate(employerRegisterSchema), async (req, res) => {
  try {
    const {
      email, password, name, company,
      domain = 'cse',
      companyWebsite,
      bookingUrl,
      targetRoles,
      minScoreThreshold = 75,
    } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Account with this email already exists' });
    }

    // Build links JSON: store companyWebsite + bookingUrl as structured link objects
    const links: { label: string; url: string }[] = [];
    if (companyWebsite) links.push({ label: 'Company Website', url: companyWebsite });
    if (bookingUrl)     links.push({ label: 'Interview Booking', url: bookingUrl });

    // Encode employer hiring criteria into aiSummary JSON blob for Smart Match
    const employerMeta = JSON.stringify({
      company,
      targetRoles: targetRoles ? targetRoles.split(',').map((r: string) => r.trim()) : [],
      domain,
      minScoreThreshold,
    });

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,                    // recruiter's own name, clean (no company suffix hack)
        domain,
        role: 'EMPLOYER',
        tier: 'Enterprise',
        college: company,        // reuse college field to store company name (no migration needed)
        links: links.length ? links : undefined,
        aiSummary: employerMeta, // Smart Match criteria stored here
      },
    });

    const tokens = await issueTokens(user.id, 'EMPLOYER');

    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        company,
        role: 'EMPLOYER',
        domain,
        bookingUrl: bookingUrl ?? null,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (err) {
    console.error('Employer register error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Routes
router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { email, password, name, domain } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        domain,
        tier: 'Explorer',
        xp: 0,
      },
    });

    const { accessToken, refreshToken } = await issueTokens(user.id, user.role);

    return res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name, domain: user.domain, role: user.role, tier: user.tier, xp: user.xp },
      accessToken,
      refreshToken,
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { accessToken, refreshToken } = await issueTokens(user.id, user.role);

    return res.status(200).json({
      user: { id: user.id, email: user.email, name: user.name, domain: user.domain, role: user.role, tier: user.tier, xp: user.xp },
      accessToken,
      refreshToken,
    });
  } catch (err: any) {
    console.error('[Auth] Login error:', err?.message || err);
    return res.status(500).json({ error: 'Internal server error', message: err?.message });
  }
});


router.post('/refresh', validate(refreshSchema), async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Verify token structure and validity
    let payload: any;
    try {
      payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const userId = payload.userId;

    // Verify token exists in Redis
    const cachedToken = await redis.get(`refresh:${userId}`);
    if (!cachedToken || cachedToken !== refreshToken) {
      return res.status(401).json({ error: 'Invalid or revoked session' });
    }

    // Issue a new access token
    const newAccessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '15m' });

    return res.status(200).json({ accessToken: newAccessToken });
  } catch (err: any) {
    console.error('Refresh token error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (userId) {
      await redis.del(`refresh:${userId}`);
    }
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (err: any) {
    console.error('Logout error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, domain: true, role: true, tier: true, xp: true, walletAddress: true,
        badgesEarned: true, currentStreak: true, longestStreak: true, successfulSubmissions: true,
        totalSubmissions: true, velocityScore: true, unlockedTier: true, onboardingComplete: true,
        profileFrozen: true, mobileNumber: true, geoCity: true, geoCountry: true, githubUsername: true,
        avatarUrl: true, linkedinId: true, profilePublic: true,
        skillScores: true
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ user });
  } catch (err: any) {
    console.error('Fetch profile error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Google OAuth Redirection
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth Callback
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  async (req: any, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.redirect('http://localhost:5173/login?error=GoogleAuthFailed');
      }

      const { accessToken, refreshToken } = await issueTokens(user.id);

      return res.redirect(
        `http://localhost:5173/auth-callback?accessToken=${accessToken}&refreshToken=${refreshToken}`
      );
    } catch (err: any) {
      console.error('Google OAuth callback error:', err);
      return res.redirect('http://localhost:5173/login?error=ServerError');
    }
  }
);

// ─── POST /api/auth/oauth/github ─────────────────────────────────────────────
// Exchange GitHub OAuth code for user profile and JWT
router.post('/oauth/github', validate(githubOAuthSchema), async (req, res) => {
  try {
    const { code } = req.body;

    // Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
    if (!tokenData.access_token) {
      return res.status(401).json({ error: 'GitHub token exchange failed', detail: tokenData.error });
    }

    // Fetch GitHub profile
    const profileRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: 'application/json' },
    });
    const profile = await profileRes.json() as { id: number; login: string; name?: string; email?: string; avatar_url?: string };

    // Fetch primary email if not in profile
    let email = profile.email;
    if (!email) {
      const emailRes = await fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const emails = await emailRes.json() as Array<{ email: string; primary: boolean; verified: boolean }>;
      email = emails.find(e => e.primary && e.verified)?.email ?? undefined;
    }

    if (!email) return res.status(400).json({ error: 'GitHub account has no verified email' });

    // Upsert user
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: profile.name || profile.login,
          password: '',
          domain: 'cse',
          role: 'STUDENT',
          githubId: String(profile.id),
          githubUsername: profile.login,
          avatarUrl: profile.avatar_url,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { githubId: String(profile.id), githubUsername: profile.login, avatarUrl: profile.avatar_url },
      });
    }

    const { accessToken, refreshToken } = await issueTokens(user.id, user.role);
    return res.json({
      accessToken, refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, githubUsername: user.githubUsername, avatarUrl: user.avatarUrl, onboardingComplete: user.onboardingComplete },
    });
  } catch (err: any) {
    console.error('GitHub OAuth error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/auth/oauth/linkedin ───────────────────────────────────────────
// Exchange LinkedIn OAuth code for user profile and JWT
router.post('/oauth/linkedin', validate(linkedinOAuthSchema), async (req, res) => {
  try {
    const { code, redirectUri } = req.body;

    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

    // Exchange code for access token
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri || 'http://localhost:5173/auth-callback',
      client_id: clientId!,
      client_secret: clientSecret!,
    });

    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
    if (!tokenData.access_token) {
      return res.status(401).json({ error: 'LinkedIn token exchange failed' });
    }

    // Fetch LinkedIn profile (OpenID Connect userinfo)
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json() as { sub: string; name?: string; given_name?: string; email?: string; picture?: string };

    const email = profile.email;
    if (!email) return res.status(400).json({ error: 'LinkedIn account has no accessible email' });

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: profile.name || profile.given_name || 'LinkedIn User',
          password: '',
          domain: 'cse',
          role: 'STUDENT',
          linkedinId: profile.sub,
          avatarUrl: profile.picture,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { linkedinId: profile.sub, avatarUrl: profile.picture },
      });
    }

    const { accessToken, refreshToken } = await issueTokens(user.id, user.role);
    return res.json({
      accessToken, refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, linkedinId: user.linkedinId, avatarUrl: user.avatarUrl, onboardingComplete: user.onboardingComplete },
    });
  } catch (err: any) {
    console.error('LinkedIn OAuth error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/auth/geo ───────────────────────────────────────────────────────
// Capture IP geolocation for the logged-in user
router.post('/geo', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';

    // Use ip-api.com (free, no key required for non-commercial)
    const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=city,regionName,country`);
    const geo = await geoRes.json() as { city?: string; regionName?: string; country?: string };

    await prisma.user.update({
      where: { id: userId },
      data: { geoCity: geo.city, geoState: geo.regionName, geoCountry: geo.country },
    });

    return res.json({ ok: true, geo });
  } catch (err) {
    console.error('Geo capture error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PUT /api/auth/onboarding ─────────────────────────────────────────────────
// Mark onboarding complete and set selected domain
router.put('/onboarding', requireAuth, validate(onboardingSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    const { selectedDomain, college, degree, graduationYear } = req.body;
    const user = await prisma.user.update({
      where: { id: userId },
      data: { 
        selectedDomain, 
        college,
        degree,
        graduationYear,
        onboardingComplete: true, 
        domain: selectedDomain || 'cse' 
      },
      select: { id: true, email: true, name: true, role: true, selectedDomain: true, onboardingComplete: true, college: true, degree: true, graduationYear: true },
    });
    return res.json({ ok: true, user });
  } catch (err) {
    console.error('Onboarding update error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

