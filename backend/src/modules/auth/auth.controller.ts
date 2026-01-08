import { Request, Response } from 'express';
import * as authService from './auth.service.js';
import { sendSuccess, sendCreated, sendError, sendNoContent } from '../../utils/response.js';
import { HTTP_STATUS } from '../../config/constants.js';
import logger from '../../utils/logger.js';
import type { AuthenticatedRequest } from '../../types/index.js';

/**
 * Register new user
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, full_name, username } = req.body;

    const result = await authService.register(email, password, { full_name, username });

    if (!result.success) {
      return sendError(res, result.error || 'Registration failed', result.statusCode || HTTP_STATUS.BAD_REQUEST);
    }

    sendCreated(res, result.data, 'Registration successful. Please check your email to verify your account.');
  } catch (error) {
    logger.error('Error in register', { error });
    sendError(res, 'Registration failed', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Login user
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    if (!result.success) {
      return sendError(res, result.error || 'Login failed', result.statusCode || HTTP_STATUS.UNAUTHORIZED);
    }

    sendSuccess(res, result.data, 'Login successful');
  } catch (error) {
    logger.error('Error in login', { error });
    sendError(res, 'Login failed', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Logout user
 */
export async function logout(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      await authService.logout(token);
    }

    sendSuccess(res, null, 'Logout successful');
  } catch (error) {
    logger.error('Error in logout', { error });
    sendError(res, 'Logout failed', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Refresh tokens
 */
export async function refreshTokens(req: Request, res: Response): Promise<void> {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return sendError(res, 'Refresh token is required', HTTP_STATUS.BAD_REQUEST);
    }

    const result = await authService.refreshTokens(refresh_token);

    if (!result.success) {
      return sendError(res, result.error || 'Token refresh failed', result.statusCode || HTTP_STATUS.UNAUTHORIZED);
    }

    sendSuccess(res, result.data, 'Tokens refreshed successfully');
  } catch (error) {
    logger.error('Error in refreshTokens', { error });
    sendError(res, 'Token refresh failed', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Request password reset
 */
export async function requestPasswordReset(req: Request, res: Response): Promise<void> {
  try {
    const { email, redirect_to } = req.body;

    await authService.requestPasswordReset(email, redirect_to);

    // Always return success to not reveal if email exists
    sendSuccess(res, null, 'If the email exists, a password reset link has been sent.');
  } catch (error) {
    logger.error('Error in requestPasswordReset', { error });
    sendSuccess(res, null, 'If the email exists, a password reset link has been sent.');
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { password } = req.body;
    const userId = req.user!.id;

    const result = await authService.resetPassword(userId, password);

    if (!result.success) {
      return sendError(res, result.error || 'Password reset failed', HTTP_STATUS.BAD_REQUEST);
    }

    sendSuccess(res, null, 'Password has been reset successfully');
  } catch (error) {
    logger.error('Error in resetPassword', { error });
    sendError(res, 'Password reset failed', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Update password (for logged in user)
 */
export async function updatePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { current_password, new_password } = req.body;

    const result = await authService.updatePassword(userId, current_password, new_password);

    if (!result.success) {
      return sendError(res, result.error || 'Password update failed', result.statusCode || HTTP_STATUS.BAD_REQUEST);
    }

    sendSuccess(res, null, 'Password updated successfully');
  } catch (error) {
    logger.error('Error in updatePassword', { error });
    sendError(res, 'Password update failed', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Verify email
 */
export async function verifyEmail(req: Request, res: Response): Promise<void> {
  try {
    const { token, type } = req.body;

    const result = await authService.verifyEmail(token, type);

    if (!result.success) {
      return sendError(res, result.error || 'Email verification failed', result.statusCode || HTTP_STATUS.BAD_REQUEST);
    }

    sendSuccess(res, result.data, 'Email verified successfully');
  } catch (error) {
    logger.error('Error in verifyEmail', { error });
    sendError(res, 'Email verification failed', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(req: Request, res: Response): Promise<void> {
  try {
    const { email, redirect_to } = req.body;

    await authService.resendVerificationEmail(email, redirect_to);

    // Always return success to not reveal if email exists
    sendSuccess(res, null, 'If the email exists and is unverified, a verification link has been sent.');
  } catch (error) {
    logger.error('Error in resendVerificationEmail', { error });
    sendSuccess(res, null, 'If the email exists and is unverified, a verification link has been sent.');
  }
}

/**
 * Get current user
 */
export async function getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    sendSuccess(res, req.user);
  } catch (error) {
    logger.error('Error in getCurrentUser', { error });
    sendError(res, 'Failed to get current user', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Get OAuth URL
 */
export async function getOAuthUrl(req: Request, res: Response): Promise<void> {
  try {
    const { provider, redirect_to } = req.query;

    if (!provider || !['google', 'github', 'gitlab'].includes(provider as string)) {
      return sendError(res, 'Invalid provider', HTTP_STATUS.BAD_REQUEST);
    }

    const result = await authService.getOAuthUrl(
      provider as 'google' | 'github' | 'gitlab',
      redirect_to as string || ''
    );

    if (!result.success) {
      return sendError(res, result.error || 'Failed to generate OAuth URL', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    sendSuccess(res, result.data);
  } catch (error) {
    logger.error('Error in getOAuthUrl', { error });
    sendError(res, 'Failed to generate OAuth URL', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

export default {
  register,
  login,
  logout,
  refreshTokens,
  requestPasswordReset,
  resetPassword,
  updatePassword,
  verifyEmail,
  resendVerificationEmail,
  getCurrentUser,
  getOAuthUrl,
};
