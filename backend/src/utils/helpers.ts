import { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest, AsyncHandler } from '../types/index.js';

/**
 * Wrap async route handlers to catch errors
 */
export function asyncHandler(fn: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as AuthenticatedRequest, res, next)).catch(next);
  };
}

/**
 * Generate a unique key for projects
 */
export function generateProjectKey(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(' ')
    .filter((word) => word.length > 0)
    .map((word) => word[0].toUpperCase())
    .join('')
    .substring(0, 4)
    .padEnd(3, 'X');
}

/**
 * Generate invitation token
 */
export function generateToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Parse pagination params from query
 */
export function parsePagination(query: Record<string, unknown>): {
  page: number;
  limit: number;
  offset: number;
} {
  const page = Math.max(1, parseInt(String(query.page || '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || '20'), 10)));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Parse sort params from query
 */
export function parseSort(query: Record<string, unknown>): {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
} {
  const sortBy = String(query.sortBy || 'created_at');
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

  return { sortBy, sortOrder };
}

/**
 * Remove undefined values from object
 */
export function cleanObject<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}

/**
 * Sleep utility for testing
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Format date to ISO string
 */
export function formatDate(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
}

/**
 * Check if string is valid UUID
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Sanitize user input
 */
export function sanitizeString(str: string): string {
  return str.trim().replace(/<[^>]*>/g, '');
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
}

/**
 * Calculate task number for a project
 */
export async function getNextTaskNumber(
  projectId: string,
  supabase: any
): Promise<number> {
  const { data } = await supabase
    .from('tasks')
    .select('task_number')
    .eq('project_id', projectId)
    .order('task_number', { ascending: false })
    .limit(1)
    .single();

  return (data?.task_number || 0) + 1;
}
