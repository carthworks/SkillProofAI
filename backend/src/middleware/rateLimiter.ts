import type { RequestHandler } from 'express';

// Dynamic require so the server starts even if express-rate-limit isn't installed yet
let rateLimit: (options: any) => RequestHandler;
try {
  rateLimit = require('express-rate-limit');
} catch {
  // Fallback: no-op pass-through middleware
  rateLimit = (_options: any) => (_req: any, _res: any, next: any) => next();
  console.warn('[RateLimiter] express-rate-limit not installed — rate limiting disabled. Run: npm install');
}

/**
 * Public API Rate Limiter
 * Enforces 100 requests per 15-minute window for public endpoints.
 */
export const publicApiRateLimiter: RequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});

/**
 * Copilot AI Chat Rate Limiter
 * Stricter limit: 30 requests per 15-minute window per IP.
 */
export const copilotRateLimiter: RequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'AI Copilot rate limit reached. Please wait before sending more messages.',
  },
});
