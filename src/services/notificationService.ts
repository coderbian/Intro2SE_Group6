/**
 * Notification Service - Supabase CRUD operations for notifications
 */
import { getSupabaseClient } from '../lib/supabase-client';
import type { Database } from '../types/supabase';

type NotificationRow = Database['public']['Tables']['notifications']['Row'];
type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];

export interface Notification {
    id: string;
    userId: string;
    type: 'task_assigned' | 'task_completed' | 'member_added' | 'project_update' | 'task_mentioned';
    title: string;
    message: string;
    read: boolean;
    relatedId?: string;
    createdAt: string;
}

/**
 * Transform DB row to app Notification model
 */
function transformNotification(row: NotificationRow): Notification {
    return {
        id: row.id,
        userId: row.user_id || '',
        type: (row.type as Notification['type']) || 'project_update',
        title: row.title || '',
        message: row.content || '',
        read: row.is_read || false,
        relatedId: row.entity_id || undefined,
        createdAt: row.created_at || new Date().toISOString(),
    };
}

/**
 * Fetch notifications for a user
 */
export async function fetchNotifications(userId: string): Promise<Notification[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) throw error;

    return (data || []).map(transformNotification);
}

/**
 * Create a notification
 */
export async function createNotification(
    notification: Omit<Notification, 'id' | 'createdAt'>
): Promise<Notification> {
    const supabase = getSupabaseClient();

    const insertData: NotificationInsert = {
        user_id: notification.userId || null,
        type: notification.type,
        title: notification.title,
        content: notification.message,
        is_read: notification.read,
        entity_id: notification.relatedId || null,
    };

    const { data, error } = await supabase
        .from('notifications')
        .insert(insertData)
        .select()
        .single();

    if (error) throw error;

    return transformNotification(data);
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('notifications')
        .update({
            is_read: true,
            read_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

    if (error) throw error;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('notifications')
        .update({
            is_read: true,
            read_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('is_read', false);

    if (error) throw error;
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

    if (error) throw error;
}

/**
 * Get unread count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
    const supabase = getSupabaseClient();

    const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

    if (error) throw error;

    return count || 0;
}
