import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger }   from './logger.js';

export function errorHandler(
  err:   unknown,
  req:   Request,
  res:   Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        message: 'Validation failed',
        code:    'VALIDATION_ERROR',
        issues:  err.flatten().fieldErrors,
      },
    });
    return;
  }

  logger.error({ err, path: req.path }, 'Unhandled error');

  res.status(500).json({
    error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
  });
}