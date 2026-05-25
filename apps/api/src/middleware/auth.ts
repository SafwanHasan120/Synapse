import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import type { JwtPayload } from '@synapse/shared';

// Extend Express's Request type so req.auth is available in routes
declare global {
  namespace Express {
    interface Request {
      auth: { userId: string; teamId: string };
    }
  }
}

export function requireAuth(
  req:   Request,
  res:   Response,
  next:  NextFunction
): void {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({
      error: { message: 'Missing authorization header', code: 'UNAUTHORIZED' },
    });
    return;
  }

  try {
    const token   = header.slice(7);
    const payload = jwt.verify(token, config.JWT_SECRET) as JwtPayload;
    req.auth      = { userId: payload.sub, teamId: payload.teamId };
    next();
  } catch {
    res.status(401).json({
      error: { message: 'Invalid or expired token', code: 'TOKEN_INVALID' },
    });
  }
}