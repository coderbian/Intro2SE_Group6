import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { notificationsApi } from '../services/apiClient';

export type NotificationType = 
  | 'task_assigned'
  | 'task_updated'
  | 'comment_added'
  | 'project_update'
  | 'sprint_started'
  | 'sprint_completed'
  | 'member_added';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  relatedId?: string;
  createdAt: string;
}

export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch notifications from backend
  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await notificationsApi.getAll();
      if (response.success) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Don't show error toast for notifications fetch failure
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Load notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Add notification (optimistic update)
  const handleAddNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    setNotifications(prev => [newNotification, ...prev]);

    // TODO: Send to backend if needed
    // For now, notifications are created by backend automatically
  }, []);

  // Mark notification as read
  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await notificationsApi.markAsRead(notificationId);
      if (response.success) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
      }
    } catch (error: any) {
      console.error('Failed to mark notification as read:', error);
      toast.error(error.message || 'Không thể đánh dấu đã đọc');
    }
  }, []);

  // Mark all as read
  const handleMarkAllAsRead = useCallback(async () => {
    try {
      const response = await notificationsApi.markAllAsRead();
      if (response.success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        toast.success('Đã đánh dấu tất cả là đã đọc');
      }
    } catch (error: any) {
      console.error('Failed to mark all as read:', error);
      toast.error(error.message || 'Không thể đánh dấu tất cả');
    }
  }, []);

  // Delete notification
  const handleDeleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await notificationsApi.delete(notificationId);
      if (response.success) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        toast.success('Thông báo đã được xóa');
      }
    } catch (error: any) {
      console.error('Failed to delete notification:', error);
      toast.error(error.message || 'Không thể xóa thông báo');
    }
  }, []);

  // Get unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    isLoading,
    unreadCount,
    fetchNotifications,
    handleAddNotification,
    handleMarkAsRead,
    handleMarkAllAsRead,
    handleDeleteNotification,
  };
}
