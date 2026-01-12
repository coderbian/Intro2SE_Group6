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
  handleAcceptInvitation?: (invitationId: string) => void;
  handleRejectInvitation?: (invitationId: string) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ 
  children, 
  onAcceptInvitation,
  onRejectInvitation 
}: { 
  children: ReactNode;
  onAcceptInvitation?: (invitationId: string) => void;
  onRejectInvitation?: (invitationId: string) => void;
}) {
  const { user } = useSupabaseAuth();
  const notificationData = useNotifications({ user });

  return (
    <NotificationContext.Provider value={{
      ...notificationData,
      handleAcceptInvitation: onAcceptInvitation,
      handleRejectInvitation: onRejectInvitation
    }}>
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