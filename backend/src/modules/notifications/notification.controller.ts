import { Response } from 'express';
import * as notificationService from './notification.service.js';
import { sendSuccess, sendError, sendNoContent } from '../../utils/response.js';
import { HTTP_STATUS } from '../../config/constants.js';
import { parsePagination } from '../../utils/helpers.js';
import logger from '../../utils/logger.js';
import type { AuthenticatedRequest } from '../../types/index.js';

/**
 * Get notifications for current user
 */
export async function getNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { page, limit } = parsePagination(req.query);
    const unread_only = req.query.unread_only === 'true';

    const result = await notificationService.getNotifications(userId, {
      page,
      limit,
      unread_only,
    });

    if (!result.success) {
      return sendError(res, result.error || 'Failed to fetch notifications', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    sendSuccess(res, result.data);
  } catch (error) {
    logger.error('Error in getNotifications', { error });
    sendError(res, 'Failed to fetch notifications', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Get unread count
 */
export async function getUnreadCount(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;

    const result = await notificationService.getUnreadCount(userId);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to fetch unread count', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    sendSuccess(res, { unread_count: result.data });
  } catch (error) {
    logger.error('Error in getUnreadCount', { error });
    sendError(res, 'Failed to fetch unread count', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Mark notification as read
 */
export async function markAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { notificationId } = req.params;

    const result = await notificationService.markAsRead(notificationId, userId);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to mark as read', HTTP_STATUS.BAD_REQUEST);
    }

    sendSuccess(res, result.data);
  } catch (error) {
    logger.error('Error in markAsRead', { error });
    sendError(res, 'Failed to mark notification as read', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;

    const result = await notificationService.markAllAsRead(userId);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to mark all as read', HTTP_STATUS.BAD_REQUEST);
    }

    sendSuccess(res, null, 'All notifications marked as read');
  } catch (error) {
    logger.error('Error in markAllAsRead', { error });
    sendError(res, 'Failed to mark all notifications as read', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { notificationId } = req.params;

    const result = await notificationService.deleteNotification(notificationId, userId);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to delete notification', HTTP_STATUS.BAD_REQUEST);
    }

    sendNoContent(res);
  } catch (error) {
    logger.error('Error in deleteNotification', { error });
    sendError(res, 'Failed to delete notification', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Delete all read notifications
 */
export async function deleteReadNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;

    const result = await notificationService.deleteReadNotifications(userId);

    if (!result.success) {
      return sendError(res, result.error || 'Failed to delete notifications', HTTP_STATUS.BAD_REQUEST);
    }

    sendSuccess(res, { deleted_count: result.data }, `Deleted ${result.data} notifications`);
  } catch (error) {
    logger.error('Error in deleteReadNotifications', { error });
    sendError(res, 'Failed to delete read notifications', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,
};
