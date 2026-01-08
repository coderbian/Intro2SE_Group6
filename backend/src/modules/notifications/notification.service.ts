import { getSupabaseAdminClient } from '../../config/supabase.js';
import logger from '../../utils/logger.js';
import type { Tables, TablesInsert } from '../../types/database.js';
import type { ServiceResult, PaginationParams } from '../../types/index.js';

const supabase = getSupabaseAdminClient();

/**
 * Get notifications for user
 */
export async function getNotifications(
  userId: string,
  options: PaginationParams & { unread_only?: boolean }
): Promise<ServiceResult<{ notifications: Tables<'notifications'>[]; total: number }>> {
  try {
    const { page = 1, limit = 20, unread_only = false } = options;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (unread_only) {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      success: true,
      data: {
        notifications: notifications || [],
        total: count || 0,
      },
    };
  } catch (error) {
    logger.error('Error getting notifications', { error, userId });
    return { success: false, error: 'Failed to fetch notifications' };
  }
}

/**
 * Get unread count
 */
export async function getUnreadCount(userId: string): Promise<ServiceResult<number>> {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;

    return { success: true, data: count || 0 };
  } catch (error) {
    logger.error('Error getting unread count', { error, userId });
    return { success: false, error: 'Failed to fetch unread count' };
  }
}

/**
 * Create notification
 */
export async function createNotification(
  notificationData: TablesInsert<'notifications'>
): Promise<ServiceResult<Tables<'notifications'>>> {
  try {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: notification };
  } catch (error) {
    logger.error('Error creating notification', { error });
    return { success: false, error: 'Failed to create notification' };
  }
}

/**
 * Create notifications for multiple users
 */
export async function createBulkNotifications(
  userIds: string[],
  baseNotification: Omit<TablesInsert<'notifications'>, 'user_id'>
): Promise<ServiceResult<void>> {
  try {
    const notifications = userIds.map((userId) => ({
      ...baseNotification,
      user_id: userId,
    }));

    const { error } = await supabase.from('notifications').insert(notifications);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    logger.error('Error creating bulk notifications', { error });
    return { success: false, error: 'Failed to create notifications' };
  }
}

/**
 * Mark notification as read
 */
export async function markAsRead(
  notificationId: string,
  userId: string
): Promise<ServiceResult<Tables<'notifications'>>> {
  try {
    const { data: notification, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: notification };
  } catch (error) {
    logger.error('Error marking notification as read', { error, notificationId });
    return { success: false, error: 'Failed to mark notification as read' };
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(userId: string): Promise<ServiceResult<void>> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    logger.error('Error marking all notifications as read', { error, userId });
    return { success: false, error: 'Failed to mark all notifications as read' };
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(
  notificationId: string,
  userId: string
): Promise<ServiceResult<void>> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    logger.error('Error deleting notification', { error, notificationId });
    return { success: false, error: 'Failed to delete notification' };
  }
}

/**
 * Delete all read notifications
 */
export async function deleteReadNotifications(userId: string): Promise<ServiceResult<number>> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .eq('is_read', true)
      .select();

    if (error) throw error;

    return { success: true, data: data?.length || 0 };
  } catch (error) {
    logger.error('Error deleting read notifications', { error, userId });
    return { success: false, error: 'Failed to delete read notifications' };
  }
}

/**
 * Notify project members
 */
export async function notifyProjectMembers(
  projectId: string,
  notification: Omit<TablesInsert<'notifications'>, 'user_id'>,
  excludeUserIds: string[] = []
): Promise<ServiceResult<void>> {
  try {
    // Get project members
    const { data: members, error: membersError } = await supabase
      .from('project_members')
      .select('user_id')
      .eq('project_id', projectId);

    if (membersError) throw membersError;

    const userIds = (members || [])
      .map((m) => m.user_id)
      .filter((id): id is string => id !== null && !excludeUserIds.includes(id));

    if (userIds.length === 0) {
      return { success: true };
    }

    return await createBulkNotifications(userIds, notification);
  } catch (error) {
    logger.error('Error notifying project members', { error, projectId });
    return { success: false, error: 'Failed to notify project members' };
  }
}

/**
 * Notify task assignees
 */
export async function notifyTaskAssignees(
  taskId: string,
  notification: Omit<TablesInsert<'notifications'>, 'user_id'>,
  excludeUserIds: string[] = []
): Promise<ServiceResult<void>> {
  try {
    // Get task assignees
    const { data: assignees, error: assigneesError } = await supabase
      .from('task_assignees')
      .select('user_id')
      .eq('task_id', taskId);

    if (assigneesError) throw assigneesError;

    const userIds = (assignees || [])
      .map((a) => a.user_id)
      .filter((id): id is string => id !== null && !excludeUserIds.includes(id));

    if (userIds.length === 0) {
      return { success: true };
    }

    return await createBulkNotifications(userIds, notification);
  } catch (error) {
    logger.error('Error notifying task assignees', { error, taskId });
    return { success: false, error: 'Failed to notify task assignees' };
  }
}

export default {
  getNotifications,
  getUnreadCount,
  createNotification,
  createBulkNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,
  notifyProjectMembers,
  notifyTaskAssignees,
};
