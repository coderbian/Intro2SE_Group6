"use client"

import { Moon, Sun, Globe } from 'lucide-react'
import { Button } from "../ui/button"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Switch } from "../ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { toast } from "sonner@2.0.3"
import type { Settings } from "../../App"

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: Settings
  onUpdateSettings: (settings: Settings) => void
}

export function SettingsModal({ open, onOpenChange, settings, onUpdateSettings }: SettingsModalProps) {
  const handleThemeChange = (theme: "light" | "dark") => {
    const newSettings = { ...settings, theme }
    onUpdateSettings(newSettings)
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
      document.documentElement.style.colorScheme = "dark"
    } else {
      document.documentElement.classList.remove("dark")
      document.documentElement.style.colorScheme = "light"
    }
    toast.success(`Đã đổi giao diện sang ${theme === "dark" ? "tối" : "sáng"}`)
  }

  const handleLanguageChange = (language: "vi" | "en") => {
    const newSettings = { ...settings, language }
    onUpdateSettings(newSettings)
    document.documentElement.lang = language === "vi" ? "vi" : "en"
    toast.success("Đã thay đổi ngôn ngữ!")
  }

  const handleNotificationChange = (key: keyof typeof settings.notifications) => {
    const newSettings = {
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: !settings.notifications[key],
      },
    }
    onUpdateSettings(newSettings)
    toast.success("Cập nhật cài đặt thông báo thành công!")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-md max-h-[90vh] overflow-y-auto"
        style={{ 
          backgroundColor: settings.theme === 'dark' ? '#1f2937' : '#ffffff',
          color: settings.theme === 'dark' ? '#f9fafb' : '#111827'
        }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: settings.theme === 'dark' ? '#f9fafb' : '#111827' }}>
            Cài đặt ứng dụng
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Theme Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5" style={{ color: settings.theme === 'dark' ? '#f9fafb' : '#111827' }} />
              <Label className="font-semibold" style={{ color: settings.theme === 'dark' ? '#f9fafb' : '#111827' }}>
                Giao diện
              </Label>
            </div>
            <div className="flex gap-2">
              <Button
                variant={settings.theme === "light" ? "default" : "outline"}
                onClick={() => handleThemeChange("light")}
                className="flex-1"
              >
                <Sun className="w-4 h-4 mr-2" />
                Sáng
              </Button>
              <Button
                variant={settings.theme === "dark" ? "default" : "outline"}
                onClick={() => handleThemeChange("dark")}
                className="flex-1"
              >
                <Moon className="w-4 h-4 mr-2" />
                Tối
              </Button>
            </div>
          </div>

          {/* Language Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5" style={{ color: settings.theme === 'dark' ? '#f9fafb' : '#111827' }} />
              <Label className="font-semibold" style={{ color: settings.theme === 'dark' ? '#f9fafb' : '#111827' }}>
                Ngôn ngữ
              </Label>
            </div>
            <Select value={settings.language} onValueChange={(val) => handleLanguageChange(val as "vi" | "en")}>
              <SelectTrigger 
                className="w-full"
                style={{ 
                  backgroundColor: settings.theme === 'dark' ? '#374151' : '#ffffff',
                  color: settings.theme === 'dark' ? '#f9fafb' : '#111827',
                  borderColor: settings.theme === 'dark' ? '#4b5563' : '#d1d5db'
                }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vi">Tiếng Việt</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notification Settings */}
          <div className="space-y-3">
            <Label className="font-semibold" style={{ color: settings.theme === 'dark' ? '#f9fafb' : '#111827' }}>
              Thông báo
            </Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="taskAssigned" className="text-sm" style={{ color: settings.theme === 'dark' ? '#f9fafb' : '#111827' }}>
                    Nhiệm vụ được giao
                  </Label>
                  <p className="text-xs" style={{ color: settings.theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                    Khi được giao nhiệm vụ mới
                  </p>
                </div>
                <Switch
                  id="taskAssigned"
                  checked={settings.notifications.taskAssigned}
                  onCheckedChange={() => handleNotificationChange("taskAssigned")}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="taskCompleted" className="text-sm" style={{ color: settings.theme === 'dark' ? '#f9fafb' : '#111827' }}>
                    Nhiệm vụ hoàn thành
                  </Label>
                  <p className="text-xs" style={{ color: settings.theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                    Khi nhiệm vụ được đánh dấu hoàn thành
                  </p>
                </div>
                <Switch
                  id="taskCompleted"
                  checked={settings.notifications.taskCompleted}
                  onCheckedChange={() => handleNotificationChange("taskCompleted")}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="projectUpdates" className="text-sm" style={{ color: settings.theme === 'dark' ? '#f9fafb' : '#111827' }}>
                    Cập nhật dự án
                  </Label>
                  <p className="text-xs" style={{ color: settings.theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                    Cập nhật dự án quan trọng
                  </p>
                </div>
                <Switch
                  id="projectUpdates"
                  checked={settings.notifications.projectUpdates}
                  onCheckedChange={() => handleNotificationChange("projectUpdates")}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailNotifications" className="text-sm" style={{ color: settings.theme === 'dark' ? '#f9fafb' : '#111827' }}>
                    Thông báo qua email
                  </Label>
                  <p className="text-xs" style={{ color: settings.theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                    Ngoài thông báo trong ứng dụng
                  </p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={settings.notifications.emailNotifications}
                  onCheckedChange={() => handleNotificationChange("emailNotifications")}
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
