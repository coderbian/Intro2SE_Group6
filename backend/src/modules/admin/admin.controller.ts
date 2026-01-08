import { Response } from 'express';
import * as adminService from './admin.service.js';
import { sendSuccess, sendError, sendNoContent } from '../../utils/response.js';
import { HTTP_STATUS } from '../../config/constants.js';
import { parsePagination } from '../../utils/helpers.js';
import logger from '../../utils/logger.js';
import type { AuthenticatedRequest } from '../../types/index.js';

/**
 * Get all users
 */
export async function getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { page, limit } = parsePagination(req.query);
    const { search, status, role } = req.query;

    const result = await adminService.getAllUsers({
      page,
      limit,
      search: search as string,
      status: status as string,
      role: role as string,
    });

    if (!result.success) {
      return sendError(res, result.error || 'Failed to fetch users', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    sendSuccess(res, result.data);
  } catch (error) {
    logger.error('Error in getUsers', { error });
    sendError(res, 'Failed to fetch users', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Update user status
 */
export async function updateUserStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    // Prevent admin from suspending themselves
    if (userId === req.user!.id && status === 'suspended') {
      return sendError(res, 'Cannot suspend your own account', HTTP_STATUS.BAD_REQUEST);
    }

    const result = await adminService.updateUserStatus(userId, status);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to update status', HTTP_STATUS.BAD_REQUEST);
    }

    sendSuccess(res, result.data, 'User status updated successfully');
  } catch (error) {
    logger.error('Error in updateUserStatus', { error });
    sendError(res, 'Failed to update user status', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Update user role
 */
export async function updateUserRole(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Prevent admin from demoting themselves
    if (userId === req.user!.id && role === 'user') {
      return sendError(res, 'Cannot demote your own account', HTTP_STATUS.BAD_REQUEST);
    }

    const result = await adminService.updateUserRole(userId, role);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to update role', HTTP_STATUS.BAD_REQUEST);
    }

    sendSuccess(res, result.data, 'User role updated successfully');
  } catch (error) {
    logger.error('Error in updateUserRole', { error });
    sendError(res, 'Failed to update user role', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Delete user
 */
export async function deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { userId } = req.params;

    // Prevent admin from deleting themselves
    if (userId === req.user!.id) {
      return sendError(res, 'Cannot delete your own account', HTTP_STATUS.BAD_REQUEST);
    }

    const result = await adminService.deleteUser(userId);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to delete user', HTTP_STATUS.BAD_REQUEST);
    }

    sendNoContent(res);
  } catch (error) {
    logger.error('Error in deleteUser', { error });
    sendError(res, 'Failed to delete user', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Get system statistics
 */
export async function getStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const result = await adminService.getSystemStats();

    if (!result.success) {
      return sendError(res, result.error || 'Failed to fetch statistics', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    sendSuccess(res, result.data);
  } catch (error) {
    logger.error('Error in getStats', { error });
    sendError(res, 'Failed to fetch statistics', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Get recent activity
 */
export async function getActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await adminService.getRecentActivity(limit);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to fetch activity', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    sendSuccess(res, result.data);
  } catch (error) {
    logger.error('Error in getActivity', { error });
    sendError(res, 'Failed to fetch activity', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Get all projects
 */
export async function getProjects(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { page, limit } = parsePagination(req.query);
    const { search, include_deleted } = req.query;

    const result = await adminService.getAllProjects({
      page,
      limit,
      search: search as string,
      includeDeleted: include_deleted === 'true',
    });

    if (!result.success) {
      return sendError(res, result.error || 'Failed to fetch projects', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    sendSuccess(res, result.data);
  } catch (error) {
    logger.error('Error in getProjects', { error });
    sendError(res, 'Failed to fetch projects', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Force delete project
 */
export async function forceDeleteProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { projectId } = req.params;

    const result = await adminService.forceDeleteProject(projectId);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to delete project', HTTP_STATUS.BAD_REQUEST);
    }

    sendNoContent(res);
  } catch (error) {
    logger.error('Error in forceDeleteProject', { error });
    sendError(res, 'Failed to delete project', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

export default {
  getUsers,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getStats,
  getActivity,
  getProjects,
  forceDeleteProject,
};
