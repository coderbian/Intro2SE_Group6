import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError, ZodIssue } from 'zod';
import { sendValidationError } from '../utils/response.js';
import logger from '../utils/logger.js';

/**
 * Validation middleware factory
 * Validates request body, query, or params against a Zod schema
 */
export function validate(
  schema: ZodSchema,
  source: 'body' | 'query' | 'params' = 'body'
) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[source];
      const result = schema.safeParse(data);

      if (!result.success) {
        const errors = formatZodErrors(result.error);
        logger.warn('Validation failed', { errors, source, path: req.path });
        return sendValidationError(res, errors);
      }

      // Replace with validated/transformed data
      req[source] = result.data;
      next();
    } catch (error) {
      logger.error('Validation error', { error });
      return sendValidationError(res, 'Validation failed');
    }
  };
}

/**
 * Format Zod errors into readable messages
 */
function formatZodErrors(error: ZodError): string[] {
  return error.errors.map((err: ZodIssue) => {
    const path = err.path.join('.');
    return path ? `${path}: ${err.message}` : err.message;
  });
}

/**
 * Validate multiple sources at once
 */
export function validateMultiple(schemas: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];

    for (const [source, schema] of Object.entries(schemas)) {
      if (schema) {
        const data = req[source as 'body' | 'query' | 'params'];
        const result = schema.safeParse(data);

        if (!result.success) {
          errors.push(...formatZodErrors(result.error));
        } else {
          req[source as 'body' | 'query' | 'params'] = result.data;
        }
      }
    }

    if (errors.length > 0) {
      logger.warn('Validation failed', { errors, path: req.path });
      return sendValidationError(res, errors);
    }

    next();
  };
}

export * from './schemas.js';
