import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase-client';
import type { User } from './useAuth';

export interface Notification {
  id: string;
  userId: string;
  type: 'task_assigned' | 'task_completed' | 'member_added' | 'project_update' | 'task_mentioned' | 'project_invite' | 'invitation_rejected' | 'join_request_sent';
  title: string;
  content: string;
  message?: string; // Alias for content
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  read?: boolean; // Alias for isRead
  readAt?: string;
  createdAt: string;
}

interface UseNotificationsProps {
  user: User | null;
}

export function useNotifications({ user }: UseNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // ========================================
  // 1. FETCH NOTIFICATIONS
  // ========================================
  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const transformedNotifications: Notification[] = (data || []).map((n: any) => ({
        id: n.id,
        userId: n.user_id,
        type: n.type,
        title: n.title,
        content: n.content || n.message || '',
        message: n.message || n.content, // Use message field first, fallback to content
        entityType: n.entity_type,
        entityId: n.entity_id,
        isRead: n.is_read,
        read: n.is_read, // Alias for NotificationList
        readAt: n.read_at,
        createdAt: n.created_at,
      }));

      setNotifications(transformedNotifications);
      setUnreadCount(transformedNotifications.filter((n) => !n.isRead).length);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      toast.error('Không thể tải thông báo');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ========================================
  // 2. INITIAL FETCH
  // ========================================
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ========================================
  // 3. REALTIME SUBSCRIPTION
  // ========================================
  useEffect(() => {
    if (!user) return;

    let retryCount = 0;
    const MAX_RETRIES = 3;
    let channel: any = null;

    const setupSubscription = () => {
      // DON'T use removeAllChannels() - it closes active WebSocket
      // Just create new channel with unique name
      channel = supabase
        .channel(`notifications_${user.id}_${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newNotification: Notification = {
              id: payload.new.id,
              userId: payload.new.user_id,
              type: payload.new.type,
              title: payload.new.title,
              content: payload.new.content || payload.new.message || '',
              message: payload.new.message || payload.new.content, // Use message field first
              entityType: payload.new.entity_type,
              entityId: payload.new.entity_id,
              isRead: payload.new.is_read,
              read: payload.new.is_read, // Alias
              readAt: payload.new.read_at,
              createdAt: payload.new.created_at,
            };

            setNotifications((prev) => [newNotification, ...prev]);
            setUnreadCount((prev) => prev + 1);

            // Only show toast for non-invitation notifications (invitations shown in bell)
            if (newNotification.type !== 'project_invite') {
              toast.info(newNotification.title, {
                description: newNotification.content,
              });
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            setNotifications((prev) =>
              prev.map((n) =>
                n.id === payload.new.id
                  ? {
                    ...n,
                    isRead: payload.new.is_read,
                    readAt: payload.new.read_at,
                  }
                  : n
              )
            );

            if (payload.new.is_read) {
              setUnreadCount((prev) => Math.max(0, prev - 1));
            }
          }
        )
        .subscribe((status) => {
          if (status === 'TIMED_OUT' && retryCount < MAX_RETRIES) {
            retryCount++;
            setTimeout(() => {
              if (channel) {
                supabase.removeChannel(channel);
              }
              setupSubscription();
            }, 1000 * retryCount); // Exponential backoff
          } else if (status === 'SUBSCRIBED') {
            retryCount = 0;
          }
        });
    };

    setupSubscription();

    return () => {
      console.log('🔌 Cleaning up notification subscription');
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user]);

  // ========================================
  // 4. MARK AS READ
  // ========================================
  const handleMarkNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? { ...n, isRead: true, readAt: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      toast.error('Không thể đánh dấu đã đọc');
    }
  };

  // ========================================
  // 5. MARK ALL AS READ
  // ========================================
  const handleMarkAllNotificationsAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          isRead: true,
          readAt: new Date().toISOString(),
        }))
      );
      setUnreadCount(0);

      toast.success('Đã đánh dấu tất cả là đã đọc');
    } catch (err: any) {
      console.error('Error marking all as read:', err);
      toast.error('Đã xảy ra lỗi');
    }
  };

  // ========================================
  // 6. DELETE NOTIFICATION
  // ========================================
  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      const notification = notifications.find((n) => n.id === notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));

      if (notification && !notification.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      toast.success('Đã xóa thông báo');
    } catch (err: any) {
      console.error('Error deleting notification:', err);
      toast.error('Không thể xóa thông báo');
    }
  };

  // ========================================
  // 7. HELPER - ADD NOTIFICATION (FOR BACKWARD COMPATIBILITY)
  // ========================================
  const handleAddNotification = async (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('notifications').insert({
        user_id: notification.userId || user.id,
        type: notification.type,
        title: notification.title,
        content: notification.content,
        entity_type: notification.entityType,
        entity_id: notification.entityId,
        is_read: false,
      });

      if (error) throw error;

      // Realtime subscription sẽ tự động thêm vào state
    } catch (err: any) {
      console.error('Error adding notification:', err);
    }
  };

  // ========================================
  // RETURN
  // ========================================
  return {
    notifications,
    loading,
    unreadCount,
    refetch: fetchNotifications,
    handleMarkNotificationAsRead,
    handleMarkAllNotificationsAsRead,
    handleDeleteNotification,
    handleAddNotification, // For backward compatibility
  };
}
