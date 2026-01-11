"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Lock, Mail, Github } from "lucide-react"
import type { Settings } from "../../types"

interface SettingsPageProps {
  settings?: Settings
  onUpdateSettings?: (settings: Settings) => void
  onNavigate?: (page: string) => void
}

export function SettingsPage({ settings, onUpdateSettings, onNavigate }: SettingsPageProps) {
  const [linkedAccounts, setLinkedAccounts] = useState(settings?.linkedAccounts || {})

  const handleLinkAccount = (provider: "google" | "github", email: string) => {
    const updatedAccounts = {
      ...linkedAccounts,
      [provider]: {
        email,
        linkedAt: new Date().toISOString(),
      },
    }
    setLinkedAccounts(updatedAccounts)
    onUpdateSettings?.({
      ...settings!,
      linkedAccounts: updatedAccounts,
    })
  }

  const handleUnlinkAccount = (provider: "google" | "github") => {
    const updatedAccounts = { ...linkedAccounts }
    delete updatedAccounts[provider]
    setLinkedAccounts(updatedAccounts)
    onUpdateSettings?.({
      ...settings!,
      linkedAccounts: updatedAccounts,
    })
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="mb-2">Cài đặt ứng dụng</h1>
        <p className="text-gray-600">Quản lý các tùy chọn cài đặt của bạn</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Tài khoản đã liên kết</CardTitle>
            <CardDescription>Quản lý các tài khoản mạng xã hội đã liên kết với tài khoản của bạn</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Google */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-red-500" />
                <div>
                  <p className="font-medium">Google</p>
                  {linkedAccounts.google ? (
                    <p className="text-sm text-gray-600">{linkedAccounts.google.email}</p>
                  ) : (
                    <p className="text-sm text-gray-500">Chưa liên kết</p>
                  )}
                </div>
              </div>
              <Button
                variant={linkedAccounts.google ? "destructive" : "outline"}
                size="sm"
                onClick={() => {
                  if (linkedAccounts.google) {
                    handleUnlinkAccount("google")
                  } else {
                    // Mock link account - in real app, this would open OAuth dialog
                    handleLinkAccount("google", "user@gmail.com")
                  }
                }}
              >
                {linkedAccounts.google ? "Bỏ liên kết" : "Liên kết"}
              </Button>
            </div>

            {/* GitHub */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center gap-3">
                <Github className="w-5 h-5 text-gray-800" />
                <div>
                  <p className="font-medium">GitHub</p>
                  {linkedAccounts.github ? (
                    <p className="text-sm text-gray-600">{linkedAccounts.github.email}</p>
                  ) : (
                    <p className="text-sm text-gray-500">Chưa liên kết</p>
                  )}
                </div>
              </div>
              <Button
                variant={linkedAccounts.github ? "destructive" : "outline"}
                size="sm"
                onClick={() => {
                  if (linkedAccounts.github) {
                    handleUnlinkAccount("github")
                  } else {
                    handleLinkAccount("github", "user@github.com")
                  }
                }}
              >
                {linkedAccounts.github ? "Bỏ liên kết" : "Liên kết"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Bảo mật
            </CardTitle>
            <CardDescription>Quản lý bảo mật tài khoản của bạn</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Các cài đặt giao diện, ngôn ngữ và thông báo có thể được điều chỉnh từ nút cài đặt ở góc trên bên phải
            </p>
            <Button variant="outline" onClick={() => onNavigate?.("profile")}>
              Quản lý bảo mật
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
