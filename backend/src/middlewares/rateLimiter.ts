import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import config from '../config/index.js';
import { sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';

/**
 * General rate limiter for API routes
 */
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later',
  handler: (_req: Request, res: Response) => {
    sendError(
      res,
      'Too many requests, please try again later',
      HTTP_STATUS.TOO_MANY_REQUESTS,
      'RATE_LIMIT_EXCEEDED'
    );
  },
});

/**
 * Strict rate limiter for authentication routes
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts, please try again later',
  handler: (_req: Request, res: Response) => {
    sendError(
      res,
      'Too many login attempts, please try again in 15 minutes',
      HTTP_STATUS.TOO_MANY_REQUESTS,
      'AUTH_RATE_LIMIT_EXCEEDED'
    );
  },
});

/**
 * Strict rate limiter for password reset
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many password reset requests',
  handler: (_req: Request, res: Response) => {
    sendError(
      res,
      'Too many password reset requests, please try again later',
      HTTP_STATUS.TOO_MANY_REQUESTS,
      'PASSWORD_RESET_RATE_LIMIT_EXCEEDED'
    );
  },
});

/**
 * Rate limiter for AI endpoints (expensive operations)
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: 'AI request limit exceeded',
  handler: (_req: Request, res: Response) => {
    sendError(
      res,
      'AI request limit exceeded, please try again in a minute',
      HTTP_STATUS.TOO_MANY_REQUESTS,
      'AI_RATE_LIMIT_EXCEEDED'
    );
  },
});

/**
 * Rate limiter for file uploads
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 uploads per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Upload limit exceeded',
  handler: (_req: Request, res: Response) => {
    sendError(
      res,
      'Upload limit exceeded, please try again later',
      HTTP_STATUS.TOO_MANY_REQUESTS,
      'UPLOAD_RATE_LIMIT_EXCEEDED'
    );
  },
});

export default {
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
  aiLimiter,
  uploadLimiter,
};
