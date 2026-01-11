"use client"

import { useNotificationContext } from './NotificationContext';
import { NotificationList } from './NotificationList';
import { Loader2 } from 'lucide-react';

export function NotificationListContainer({ theme }: { theme?: string }) {
  const {
    notifications,
    loading,
    handleMarkNotificationAsRead,
    handleMarkAllNotificationsAsRead,
    handleDeleteNotification,
    handleAcceptInvitation,
    handleRejectInvitation,
  } = useNotificationContext();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  const transformedNotifications = notifications.map(n => ({
    ...n,
    read: n.isRead,
    message: n.content,
  }));

  return (
    <NotificationList
      notifications={transformedNotifications}
      onMarkAsRead={handleMarkNotificationAsRead}
      onMarkAllAsRead={handleMarkAllNotificationsAsRead}
      onDelete={handleDeleteNotification}
      onAcceptInvitation={handleAcceptInvitation}
      onRejectInvitation={handleRejectInvitation}
      theme={theme}
    />
  );
}