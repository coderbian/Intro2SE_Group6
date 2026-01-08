import { useState, useEffect } from 'react';

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

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('planora_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const handleAddNotification = (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setNotifications([newNotification, ...notifications]);
    return newNotification;
  };

  const handleMarkNotificationAsRead = (notificationId: string) => {
    setNotifications(notifications.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const handleDeleteNotification = (notificationId: string) => {
    setNotifications(notifications.filter((n) => n.id !== notificationId));
  };

  const getUnreadCount = () => notifications.filter((n) => !n.read).length;

  const getNotificationsByUser = (userId: string) =>
    notifications.filter((n) => n.userId === userId || n.userId === '');

  return {
    notifications,
    setNotifications,
    handleAddNotification,
    handleMarkNotificationAsRead,
    handleMarkAllNotificationsAsRead,
    handleDeleteNotification,
    getUnreadCount,
    getNotificationsByUser,
  };
}
