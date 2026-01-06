import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import * as notificationService from '../services/notificationService';

export type { Notification } from '../services/notificationService';

interface UseNotificationsProps {
  userId?: string;
}

export function useNotifications(props?: UseNotificationsProps) {
  const userId = props?.userId;
  const [notifications, setNotifications] = useState<notificationService.Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch notifications from Supabase when userId changes
  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const fetchedNotifications = await notificationService.fetchNotifications(userId);
        setNotifications(fetchedNotifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const handleAddNotification = useCallback(
    async (notification: Omit<notificationService.Notification, 'id' | 'createdAt'>) => {
      try {
        const newNotification = await notificationService.createNotification(notification);
        setNotifications((prev) => [newNotification, ...prev]);
        return newNotification;
      } catch (error) {
        console.error('Error adding notification:', error);
        return null;
      }
    },
    []
  );

  const handleMarkNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const handleMarkAllNotificationsAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      await notificationService.markAllAsRead(userId);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [userId]);

  const handleDeleteNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Không thể xóa thông báo');
    }
  }, []);

  const getUnreadCount = useCallback(() => notifications.filter((n) => !n.read).length, [notifications]);

  const getNotificationsByUser = useCallback(
    (targetUserId: string) =>
      notifications.filter((n) => n.userId === targetUserId || n.userId === ''),
    [notifications]
  );

  return {
    notifications,
    setNotifications,
    isLoading,
    handleAddNotification,
    handleMarkNotificationAsRead,
    handleMarkAllNotificationsAsRead,
    handleDeleteNotification,
    getUnreadCount,
    getNotificationsByUser,
  };
}
