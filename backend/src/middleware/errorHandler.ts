import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, sendError } from '../utils/apiResponse';

/**
 * Centralized REST API Error Handler
 * Ensures no stack traces or internal paths leak to clients.
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // If headers already sent, delegate to default express handler
  if (res.headersSent) {
    return next(err);
  }

  // Known AppError
  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.code, err.message, err.details, req);
  }

  // Zod Validation Error
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.filter((p) => p !== 'body' && p !== 'query' && p !== 'params').join('.') || undefined,
      message: e.message,
    }));
    return sendError(res, 400, 'VALIDATION_ERROR', 'Request validation failed', details, req);
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 401, 'UNAUTHORIZED', 'Invalid authentication token', undefined, req);
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 401, 'TOKEN_EXPIRED', 'Authentication token has expired', undefined, req);
  }

  // Log full error internally for debugging
  console.error(`[Error] [${req.id || 'no-id'}] ${req.method} ${req.originalUrl}:`, err);

  // Generic 500 Internal Server Error (never leak internal details to client)
  return sendError(
    res,
    500,
    'INTERNAL_SERVER_ERROR',
    'An unexpected error occurred. Please try again later.',
    undefined,
    req
  );
}
