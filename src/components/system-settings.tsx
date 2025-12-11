"use client"

import { useState } from "react"
import { Settings, Users, Shield, Database, LogOut, LayoutDashboard, Mail, HardDrive, User, ShieldCheck } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SystemSettingsProps {
  onNavigate: (page: 'dashboard' | 'users' | 'roles' | 'settings' | 'backup') => void
  onExitAdmin?: () => void // Added onExitAdmin prop
  adminEmail?: string // Added adminEmail prop
  onLogout?: () => void // Added onLogout prop
}

export function SystemSettings({ onNavigate, onExitAdmin, adminEmail, onLogout }: SystemSettingsProps) {
  const [activeNav, setActiveNav] = useState("settings")
  
  // Email settings state
  const [emailSettings, setEmailSettings] = useState({
    host: "smtp.sendgrid.net",
    port: "587",
    username: "apikey",
    password: ""
  })

  // Limit settings state
  const [limitSettings, setLimitSettings] = useState({
    maxFileSize: "10",
    maxProjectsPerPM: "5"
  })

  const handleSendTestEmail = () => {
    alert("Đang gửi email kiểm tra...")
  }

  const handleSaveChanges = () => {
    alert("Đã lưu thay đổi thành công!")
  }

  const adminUsername = adminEmail ? adminEmail.split('@')[0] : 'admin'
  const displayEmail = adminEmail || 'admin@gmail.com'

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <h1 className="text-xl font-bold text-primary">Planora</h1>
        </div>
        
        <nav className="flex-1 py-6">
          <ul className="space-y-1 px-3">
            <li>
              <button
                onClick={() => onNavigate('dashboard')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <LayoutDashboard className="h-5 w-5" />
                <span>Giám sát hệ thống</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('users')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Users className="h-5 w-5" />
                <span>Quản lý người dùng</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('roles')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Shield className="h-5 w-5" />
                <span>Quản lý vai trò</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('settings')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors bg-gray-100 dark:bg-gray-800 text-primary dark:text-white border border-gray-300 dark:border-gray-700"
              >
                <Settings className="h-5 w-5" />
                <span>Cấu hình hệ thống</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('backup')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Database className="h-5 w-5" />
                <span>Backup/Restore</span>
              </button>
            </li>
          </ul>
        </nav>
        
        <div className="p-3 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                  <AvatarFallback>{adminUsername.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-foreground">{adminUsername}</div>
                  <div className="text-xs text-muted-foreground">{displayEmail}</div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Cài đặt</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={onLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Đăng xuất</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-foreground mb-8">Cấu hình hệ thống</h1>
          
          <div className="space-y-6 max-w-4xl pb-20">
            {/* Email Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Cài đặt Email (SMTP/SendGrid)
                </CardTitle>
                <CardDescription>
                  Cấu hình máy chủ email để gửi thông báo và email hệ thống
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="host">Host</Label>
                    <Input
                      id="host"
                      placeholder="smtp.sendgrid.net"
                      value={emailSettings.host}
                      onChange={(e) => setEmailSettings({ ...emailSettings, host: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="port">Port</Label>
                    <Input
                      id="port"
                      placeholder="587"
                      value={emailSettings.port}
                      onChange={(e) => setEmailSettings({ ...emailSettings, port: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="apikey"
                    value={emailSettings.username}
                    onChange={(e) => setEmailSettings({ ...emailSettings, username: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Mật khẩu</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••••••"
                    value={emailSettings.password}
                    onChange={(e) => setEmailSettings({ ...emailSettings, password: e.target.value })}
                  />
                </div>
                
                <Button variant="outline" onClick={handleSendTestEmail}>
                  Gửi email kiểm tra
                </Button>
              </CardContent>
            </Card>

            {/* Limit Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="w-5 h-5" />
                  Cài đặt giới hạn
                </CardTitle>
                <CardDescription>
                  Thiết lập các giới hạn cho hệ thống
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="maxFileSize">Kích thước file upload tối đa (MB)</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    min="1"
                    placeholder="10"
                    value={limitSettings.maxFileSize}
                    onChange={(e) => setLimitSettings({ ...limitSettings, maxFileSize: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxProjects">Số dự án tối đa mỗi Project Manager</Label>
                  <Input
                    id="maxProjects"
                    type="number"
                    min="1"
                    placeholder="5"
                    value={limitSettings.maxProjectsPerPM}
                    onChange={(e) => setLimitSettings({ ...limitSettings, maxProjectsPerPM: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fixed Save Button */}
          <div className="fixed bottom-8 right-8">
            <Button size="lg" onClick={handleSaveChanges} className="shadow-lg">
              Lưu thay đổi
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
