import { Response } from 'express';
import { HTTP_STATUS } from '../config/constants.js';
import type { ApiResponse, PaginationMeta } from '../types/index.js';

/**
 * Send success response
 */
export function sendSuccess<T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode: number = HTTP_STATUS.OK,
  meta?: PaginationMeta
): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    meta,
  };

  res.status(statusCode).json(response);
}

/**
 * Send created response
 */
export function sendCreated<T>(
  res: Response,
  data?: T,
  message: string = 'Resource created successfully'
): void {
  sendSuccess(res, data, message, HTTP_STATUS.CREATED);
}

/**
 * Send no content response
 */
export function sendNoContent(res: Response): void {
  res.status(HTTP_STATUS.NO_CONTENT).send();
}

/**
 * Send error response
 */
export function sendError(
  res: Response,
  message: string,
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  error?: string
): void {
  const response: ApiResponse = {
    success: false,
    message,
    error,
  };

  res.status(statusCode).json(response);
}

/**
 * Send validation error response
 */
export function sendValidationError(
  res: Response,
  errors: string | string[]
): void {
  const message = Array.isArray(errors) ? errors.join(', ') : errors;
  sendError(res, message, HTTP_STATUS.UNPROCESSABLE_ENTITY);
}

/**
 * Send paginated response
 */
export function sendPaginated<T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number
): void {
  const totalPages = Math.ceil(total / limit);
  const meta: PaginationMeta = {
    page,
    limit,
    total,
    totalPages,
    hasMore: page < totalPages,
  };

  sendSuccess(res, data, undefined, HTTP_STATUS.OK, meta);
}
