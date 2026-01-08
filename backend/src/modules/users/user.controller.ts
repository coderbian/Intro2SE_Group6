import { Response } from 'express';
import * as userService from './user.service.js';
import { sendSuccess, sendError, sendPaginated } from '../../utils/response.js';
import { parsePagination } from '../../utils/helpers.js';
import { HTTP_STATUS } from '../../config/constants.js';
import logger from '../../utils/logger.js';
import type { AuthenticatedRequest } from '../../types/index.js';

/**
 * Get current user profile
 */
export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      return sendError(res, 'User not authenticated', HTTP_STATUS.UNAUTHORIZED);
    }

    const result = await userService.getUserById(req.user.id);

    if (!result.success) {
      return sendError(res, result.error || 'User not found', result.statusCode || HTTP_STATUS.NOT_FOUND);
    }

    sendSuccess(res, result.data);
  } catch (error) {
    logger.error('Error in getMe', { error });
    sendError(res, 'Failed to get user profile', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Update current user profile
 */
export async function updateMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      return sendError(res, 'User not authenticated', HTTP_STATUS.UNAUTHORIZED);
    }

    const result = await userService.updateUserProfile(req.user.id, req.body);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to update profile', result.statusCode || HTTP_STATUS.BAD_REQUEST);
    }

    sendSuccess(res, result.data, 'Profile updated successfully');
  } catch (error) {
    logger.error('Error in updateMe', { error });
    sendError(res, 'Failed to update profile', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { page, limit } = parsePagination(req.query);
    const search = req.query.search as string | undefined;

    const result = await userService.getAllUsers(page, limit, search);

    if (!result.success || !result.data) {
      return sendError(res, result.error || 'Failed to fetch users', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    sendPaginated(res, result.data.users, page, limit, result.data.total);
  } catch (error) {
    logger.error('Error in getAllUsers', { error });
    sendError(res, 'Failed to fetch users', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Get user by ID
 */
export async function getUserById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const result = await userService.getUserById(id);

    if (!result.success) {
      return sendError(res, result.error || 'User not found', result.statusCode || HTTP_STATUS.NOT_FOUND);
    }

    sendSuccess(res, result.data);
  } catch (error) {
    logger.error('Error in getUserById', { error });
    sendError(res, 'Failed to fetch user', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (id === req.user?.id) {
      return sendError(res, 'Cannot change your own role', HTTP_STATUS.BAD_REQUEST);
    }

    const result = await userService.updateUserRole(id, role);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to update role', result.statusCode || HTTP_STATUS.BAD_REQUEST);
    }

    sendSuccess(res, result.data, 'User role updated successfully');
  } catch (error) {
    logger.error('Error in updateUserRole', { error });
    sendError(res, 'Failed to update user role', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Update user status (admin only)
 */
export async function updateUserStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (id === req.user?.id) {
      return sendError(res, 'Cannot change your own status', HTTP_STATUS.BAD_REQUEST);
    }

    const result = await userService.updateUserStatus(id, status);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to update status', result.statusCode || HTTP_STATUS.BAD_REQUEST);
    }

    sendSuccess(res, result.data, 'User status updated successfully');
  } catch (error) {
    logger.error('Error in updateUserStatus', { error });
    sendError(res, 'Failed to update user status', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Delete user (admin only)
 */
export async function deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (id === req.user?.id) {
      return sendError(res, 'Cannot delete your own account', HTTP_STATUS.BAD_REQUEST);
    }

    const result = await userService.deleteUser(id);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to delete user', result.statusCode || HTTP_STATUS.BAD_REQUEST);
    }

    sendSuccess(res, null, 'User deleted successfully');
  } catch (error) {
    logger.error('Error in deleteUser', { error });
    sendError(res, 'Failed to delete user', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Get user preferences
 */
export async function getPreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      return sendError(res, 'User not authenticated', HTTP_STATUS.UNAUTHORIZED);
    }

    const result = await userService.getUserPreferences(req.user.id);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to fetch preferences', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    sendSuccess(res, result.data);
  } catch (error) {
    logger.error('Error in getPreferences', { error });
    sendError(res, 'Failed to fetch preferences', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Update user preferences
 */
export async function updatePreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      return sendError(res, 'User not authenticated', HTTP_STATUS.UNAUTHORIZED);
    }

    const result = await userService.updateUserPreferences(req.user.id, req.body);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to update preferences', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    sendSuccess(res, result.data, 'Preferences updated successfully');
  } catch (error) {
    logger.error('Error in updatePreferences', { error });
    sendError(res, 'Failed to update preferences', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

export default {
  getMe,
  updateMe,
  getAllUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getPreferences,
  updatePreferences,
};
