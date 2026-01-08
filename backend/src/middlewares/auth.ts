import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { getSupabaseAdminClient } from '../config/supabase.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';
import logger from '../utils/logger.js';
import type { AuthenticatedRequest, AuthUser } from '../types/index.js';

interface JWTPayload {
  sub: string;
  email: string;
  role?: string;
  iat?: number;
  exp?: number;
}

/**
 * Extract JWT token from Authorization header
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
}

/**
 * Verify Supabase JWT token and get user data
 */
async function verifySupabaseToken(token: string): Promise<AuthUser | null> {
  try {
    const supabase = getSupabaseAdminClient();
    
    // Get user from Supabase auth
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      logger.warn('Supabase token verification failed', { error: error?.message });
      return null;
    }

    // Get user role from public.users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, name, phone, avatar_url')
      .eq('id', user.id)
      .single();

    const userDataTyped = userData as { role?: string; name?: string; phone?: string; avatar_url?: string } | null;

    if (userError) {
      logger.warn('Failed to fetch user data', { error: userError.message });
    }

    return {
      id: user.id,
      email: user.email || '',
      name: userDataTyped?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      phone: userDataTyped?.phone || user.user_metadata?.phone,
      avatar: userDataTyped?.avatar_url || user.user_metadata?.avatar_url,
      role: userDataTyped?.role === 'admin' ? 'admin' : 'user',
    };
  } catch (error) {
    logger.error('Token verification error', { error });
    return null;
  }
}

/**
 * Verify JWT token (for custom JWT implementation)
 */
function verifyJWT(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    return decoded;
  } catch (error) {
    logger.warn('JWT verification failed', { error });
    return null;
  }
}

/**
 * Authentication middleware
 * Validates JWT token and attaches user to request
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new UnauthorizedError('No authentication token provided');
    }

    // First try Supabase token verification
    const user = await verifySupabaseToken(token);

    if (!user) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    // Attach user and token to request
    (req as AuthenticatedRequest).user = user;
    (req as AuthenticatedRequest).accessToken = token;

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return sendError(res, error.message, error.statusCode);
    }
    logger.error('Authentication error', { error });
    return sendError(res, 'Authentication failed', HTTP_STATUS.UNAUTHORIZED);
  }
}

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't fail if no token
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);

    if (token) {
      const user = await verifySupabaseToken(token);
      if (user) {
        (req as AuthenticatedRequest).user = user;
        (req as AuthenticatedRequest).accessToken = token;
      }
    }

    next();
  } catch (error) {
    // Don't fail, just continue without user
    logger.warn('Optional auth failed', { error });
    next();
  }
}

/**
 * Require admin role middleware
 * Must be used after authenticate middleware
 */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authReq = req as AuthenticatedRequest;
  
  if (!authReq.user) {
    return sendError(res, 'Authentication required', HTTP_STATUS.UNAUTHORIZED);
  }

  if (authReq.user.role !== 'admin') {
    return sendError(res, 'Admin access required', HTTP_STATUS.FORBIDDEN);
  }

  next();
}

/**
 * Require specific roles middleware
 * Must be used after authenticate middleware
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    
    if (!authReq.user) {
      return sendError(res, 'Authentication required', HTTP_STATUS.UNAUTHORIZED);
    }

    if (!roles.includes(authReq.user.role)) {
      return sendError(
        res,
        `Required role: ${roles.join(' or ')}`,
        HTTP_STATUS.FORBIDDEN
      );
    }

    next();
  };
}

export default {
  authenticate,
  optionalAuth,
  requireAdmin,
  requireRole,
};
