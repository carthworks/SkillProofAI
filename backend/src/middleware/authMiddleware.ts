import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { sendError } from '../utils/apiResponse';

declare global {
  namespace Express {
    interface User {
      userId?: string;
      id?: string;
      role?: string;
      [key: string]: any;
    }
  }
}

export type AuthenticatedRequest = Request;

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || authHeader === 'Bearer null' || authHeader === 'Bearer undefined') {
    if (process.env.NODE_ENV !== 'production') {
      req.user = { userId: 'usr-1', id: 'usr-1', role: 'STUDENT' };
      return next();
    }
    return sendError(res, 401, 'UNAUTHORIZED', 'Missing or invalid authentication token', undefined, req);
  }

  const token = authHeader.replace('Bearer ', '').trim();
  if (!token || token === 'null' || token === 'undefined') {
    if (process.env.NODE_ENV !== 'production') {
      req.user = { userId: 'usr-1', id: 'usr-1', role: 'STUDENT' };
      return next();
    }
    return sendError(res, 401, 'UNAUTHORIZED', 'Missing or invalid authentication token', undefined, req);
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET ?? 'secret') as any;
    req.user = {
      ...payload,
      userId: payload.userId || payload.id,
      id: payload.id || payload.userId,
    };
    return next();
  } catch {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[AuthMiddleware] Token invalid or expired in dev mode, defaulting to demo user usr-1');
      req.user = { userId: 'usr-1', id: 'usr-1', role: 'STUDENT' };
      return next();
    }
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication token is invalid or expired', undefined, req);
  }
}


export const requireAuth = authMiddleware;

/**
 * Role-Based Access Control (RBAC) Middleware
 * Verifies that the authenticated user possesses one of the required roles (e.g. 'REVIEWER', 'ADMIN').
 */
export function requireRole(...allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId || req.user?.id;

      // Authentication required before checking role
      if (!userId) {
        return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required', undefined, req);
      }

      // Check role directly on JWT payload if present
      const userRole = (req.user?.role || '').toUpperCase();
      const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());

      if (userRole && (normalizedAllowed.includes(userRole) || userRole === 'ADMIN')) {
        return next();
      }

      // Fallback: Query database user role
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (dbUser && (normalizedAllowed.includes(dbUser.role.toUpperCase()) || dbUser.role.toUpperCase() === 'ADMIN')) {
        req.user!.role = dbUser.role;
        return next();
      }

      return sendError(
        res,
        403,
        'FORBIDDEN',
        `Access requires ${allowedRoles.join(' or ')} role.`,
        undefined,
        req
      );
    } catch (err) {
      console.error('[RBAC] requireRole middleware error:', err);
      return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Internal authorization error', undefined, req);
    }
  };
}
