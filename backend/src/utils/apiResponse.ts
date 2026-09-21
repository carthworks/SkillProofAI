import { Request, Response } from 'express';

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: ApiErrorDetail[];
  requestId?: string;
}

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: ApiErrorDetail[];

  constructor(statusCode: number, code: string, message: string, details?: ApiErrorDetail[]) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Standard REST API Success Envelope
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  meta: Record<string, any> = {},
  statusCode = 200,
  req?: Request
): Response {
  const requestId = req?.id || (res.getHeader('X-Request-Id') as string) || undefined;
  return res.status(statusCode).json({
    data,
    meta: {
      version: 'v1',
      ...(requestId ? { requestId } : {}),
      ...meta,
    },
  });
}

/**
 * Standard REST API Error Envelope
 */
export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: ApiErrorDetail[],
  req?: Request
): Response {
  const requestId = req?.id || (res.getHeader('X-Request-Id') as string) || undefined;
  
  return res.status(statusCode).json({
    error: {
      code,
      message,
      ...(details && details.length > 0 ? { details } : {}),
      ...(requestId ? { requestId } : {}),
    },
    // Top-level message for backward-compatibility with simple clients
    message,
  });
}

/**
 * Standard REST API Paginated Response Envelope
 */
export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: { page: number; limit: number; total: number },
  req?: Request,
  meta: Record<string, any> = {}
): Response {
  const requestId = req?.id || (res.getHeader('X-Request-Id') as string) || undefined;
  const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;

  return res.status(200).json({
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages,
    },
    meta: {
      version: 'v1',
      ...(requestId ? { requestId } : {}),
      ...meta,
    },
  });
}
