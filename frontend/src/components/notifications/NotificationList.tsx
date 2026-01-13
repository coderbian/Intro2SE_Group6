"use client"

import { useState } from "react"
import { ScrollArea } from "../ui/scroll-area"
import { Button } from "../ui/button"
import { Check, Trash2, CheckCheck, Bell } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog"
import type { Notification } from "../../types"

interface NotificationListProps {
  notifications: Notification[]
  onMarkAsRead: (notificationId: string) => void
  onMarkAllAsRead: () => void
  onDelete: (notificationId: string) => void
  onAcceptInvitation?: (invitationId: string) => void
  onRejectInvitation?: (invitationId: string) => void
  theme?: string // Added theme prop
}

export function NotificationList({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onAcceptInvitation,
  onRejectInvitation,
  theme
}: NotificationListProps) {
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const unreadCount = notifications.filter((n) => !n.read).length

  const isDark = theme === 'dark'

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "task_assigned":
        return "📋"
      case "task_completed":
        return "✅"
      case "member_added":
        return "👤"
      case "project_update":
        return "📢"
      case "task_mentioned":
        return "💬"
      case "project_invite":
        return "✉️"
      case "invitation_rejected":
        return "❌"
      case "join_request_sent":
        return "📤"
      default:
        return "🔔"
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      task_assigned: "Nhiệm vụ được giao",
      task_completed: "Nhiệm vụ hoàn thành",
      member_added: "Thành viên được thêm",
      project_update: "Cập nhật dự án",
      task_mentioned: "Được nhắc đến",
      project_invite: "Lời mời tham gia dự án",
      invitation_rejected: "Lời mời bị từ chối",
      join_request_sent: "Yêu cầu tham gia dự án",
    }
    return labels[type] || "Thông báo"
  }

  return (
    <>
      <div
        className="flex flex-col h-96 rounded-lg shadow-lg border"
        style={{
          backgroundColor: isDark ? '#111827' : '#ffffff',
          borderColor: isDark ? '#374151' : '#e5e7eb',
          color: isDark ? '#f9fafb' : '#111827'
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b rounded-t-lg"
          style={{
            backgroundColor: isDark ? '#1f2937' : '#f9fafb',
            borderColor: isDark ? '#374151' : '#e5e7eb',
            color: isDark ? '#f9fafb' : '#111827'
          }}
        >
          <h3
            className="font-semibold text-sm"
          >
            Thông báo ({notifications.length})
          </h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onMarkAllAsRead} className="text-xs h-7">
              <CheckCheck className="w-3 h-3 mr-1" />
              Đánh dấu tất cả
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="flex-1">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center">
              <Bell className="w-8 h-8 mb-2" style={{ color: isDark ? '#9ca3af' : '#d1d5db' }} />
              <p className="text-sm" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                Không có thông báo nào
              </p>
              <p className="text-xs" style={{ color: isDark ? '#6b7280' : '#9ca3af' }}>
                Bạn sẽ được thông báo khi có hoạt động mới
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 border-b hover:bg-opacity-50 transition-colors cursor-pointer ${!notification.read ? 'font-semibold' : ''
                    }`}
                  style={{
                    backgroundColor: !notification.read
                      ? (isDark ? '#1e3a8a' : '#dbeafe')
                      : 'transparent',
                    borderColor: isDark ? '#374151' : '#e5e7eb'
                  }}
                  onClick={() => setSelectedNotification(notification)}
                  onMouseEnter={(e) => {
                    if (notification.read) {
                      e.currentTarget.style.backgroundColor = isDark ? '#1f2937' : '#f3f4f6'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (notification.read) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                        <h4
                          className={`text-sm truncate ${notification.read ? 'font-medium' : 'font-bold'
                            }`}
                        >
                          {notification.title}
                        </h4>
                        {!notification.read && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                      </div>
                      <p
                        className="text-sm mt-1 line-clamp-2"
                        style={{ color: isDark ? '#d1d5db' : '#4b5563' }}
                      >
                        {notification.message ||
                          (notification.type === 'join_request_sent'
                            ? 'Yêu cầu của bạn đang được xem xét bởi chủ dự án.'
                            : '')}
                      </p>
                      <p
                        className="text-xs mt-1"
                        style={{ color: isDark ? '#9ca3af' : '#6b7280' }}
                      >
                        {new Date(notification.createdAt).toLocaleDateString("vi-VN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {/* Invitation Actions for project_invite */}
                    {notification.type === 'project_invite' && notification.entityId && !notification.read && (
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation()
                            onAcceptInvitation?.(notification.entityId!)
                            onMarkAsRead(notification.id)
                          }}
                          className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
                        >
                          Đồng ý
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation()
                            onRejectInvitation?.(notification.entityId!)
                            onMarkAsRead(notification.id)
                          }}
                          className="h-7 text-xs"
                        >
                          Từ chối
                        </Button>
                      </div>
                    )}

                    {/* Standard Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation()
                            onMarkAsRead(notification.id)
                          }}
                          title="Mark as read"
                          className="h-6 w-6 p-0"
                        >
                          <Check className="w-4 h-4 text-blue-500" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation()
                          onDelete(notification.id)
                        }}
                        title="Delete"
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {selectedNotification && (
        <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getNotificationIcon(selectedNotification.type)}</span>
                <div>
                  <DialogTitle>{selectedNotification.title}</DialogTitle>
                  <DialogDescription>{getTypeLabel(selectedNotification.type)}</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm">{selectedNotification.message}</p>
              </div>

              <div className="text-xs text-gray-500">
                Được gửi:{" "}
                {new Date(selectedNotification.createdAt).toLocaleDateString("vi-VN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                {!selectedNotification.read && (
                  <Button
                    onClick={() => {
                      onMarkAsRead(selectedNotification.id)
                      setSelectedNotification(null)
                    }}
                    className="flex-1"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Đánh dấu là đã đọc
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedNotification(null)} className="flex-1">
                  Đóng
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
