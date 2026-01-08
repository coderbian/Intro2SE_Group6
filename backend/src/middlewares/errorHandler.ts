import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';
import logger from '../utils/logger.js';
import config from '../config/index.js';

/**
 * Global error handler middleware
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log the error
  logger.error('Error caught by handler', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  // Handle known operational errors
  if (error instanceof AppError) {
    sendError(res, error.message, error.statusCode, error.code);
    return;
  }

  // Handle Supabase errors
  if (error.message?.includes('Supabase') || error.message?.includes('PostgrestError')) {
    sendError(
      res,
      'Database operation failed',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'DATABASE_ERROR'
    );
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    sendError(res, 'Invalid token', HTTP_STATUS.UNAUTHORIZED, 'INVALID_TOKEN');
    return;
  }

  if (error.name === 'TokenExpiredError') {
    sendError(res, 'Token expired', HTTP_STATUS.UNAUTHORIZED, 'TOKEN_EXPIRED');
    return;
  }

  // Handle validation errors
  if (error.name === 'ZodError') {
    sendError(
      res,
      'Validation failed',
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      'VALIDATION_ERROR'
    );
    return;
  }

  // Handle syntax errors in JSON
  if (error instanceof SyntaxError && 'body' in error) {
    sendError(res, 'Invalid JSON', HTTP_STATUS.BAD_REQUEST, 'INVALID_JSON');
    return;
  }

  // Default to internal server error
  const message = config.env === 'production' 
    ? 'An unexpected error occurred' 
    : error.message;

  sendError(
    res,
    message,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    'INTERNAL_ERROR'
  );
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  sendError(
    res,
    `Route ${req.method} ${req.path} not found`,
    HTTP_STATUS.NOT_FOUND,
    'NOT_FOUND'
  );
}

/**
 * Async error wrapper for routes
 */
export function asyncErrorHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default {
  errorHandler,
  notFoundHandler,
  asyncErrorHandler,
};
