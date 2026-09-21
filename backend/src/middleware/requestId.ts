import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

/**
 * Request ID Middleware (REST API standard)
 * Injects a unique trace identifier into each incoming request and response headers.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const existingId = req.headers['x-request-id'] as string;
  const requestId = existingId || `req_${crypto.randomUUID().replace(/-/g, '')}`;
  
  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);
  
  next();
}
