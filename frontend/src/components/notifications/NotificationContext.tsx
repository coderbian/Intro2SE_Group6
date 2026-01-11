"use client"

import { createContext, useContext, type ReactNode } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { useSupabaseAuth } from '../../hooks/useAuth';

interface NotificationContextType {
  notifications: any[];
  loading: boolean;
  unreadCount: number;
  handleMarkNotificationAsRead: (id: string) => void;
  handleMarkAllNotificationsAsRead: () => void;
  handleDeleteNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useSupabaseAuth();
  const notificationData = useNotifications({ user });

  return (
    <NotificationContext.Provider value={notificationData}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return context;
}