import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { sendError } from '../utils/apiResponse';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((e) => ({
          field: e.path.filter((p) => p !== 'body' && p !== 'query' && p !== 'params').join('.') || undefined,
          message: e.message,
        }));
        return sendError(res, 400, 'VALIDATION_ERROR', 'Request validation failed', details, req);
      }
      return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Internal error during validation', undefined, req);
    }
  };
};
