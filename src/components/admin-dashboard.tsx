"use client"

import { useState } from "react"
import { LayoutDashboard, Users, Shield, Settings, Database, LogOut, UserPlus, KeyRound, UserCog, Trash2, User, ShieldCheck } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { SettingsModal } from "../src/components/settings/SettingsModal"

interface AdminDashboardProps {
  adminEmail?: string // added adminEmail prop
  onNavigate: (page: 'dashboard' | 'users' | 'roles' | 'settings' | 'backup') => void
  onLogout?: () => void
}

export function AdminDashboard({ adminEmail, onNavigate, onLogout }: AdminDashboardProps) {
  const [activeNav, setActiveNav] = useState("users")
  const [resetPasswordUser, setResetPasswordUser] = useState<{ id: number; name: string; email: string } | null>(null)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [settings, setSettings] = useState({
    theme: 'light',
    language: 'vi',
    notifications: {
      taskAssigned: true,
      taskCompleted: true,
      projectUpdates: true,
      emailNotifications: true,
    },
  })

  const mockUsers = [
    {
      id: 1,
      name: "Nguyễn Văn A",
      email: "nguyenvana@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
      role: "Admin",
      roleColor: "default",
      joinDate: "15/01/2024",
      status: "active",
    },
    {
      id: 2,
      name: "Trần Thị B",
      email: "tranthib@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
      role: "Manager",
      roleColor: "secondary",
      joinDate: "20/01/2024",
      status: "active",
    },
    {
      id: 3,
      name: "Lê Văn C",
      email: "levanc@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
      role: "Member",
      roleColor: "outline",
      joinDate: "25/01/2024",
      status: "active",
    },
    {
      id: 4,
      name: "Phạm Thị D",
      email: "phamthid@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
      role: "Member",
      roleColor: "outline",
      joinDate: "01/02/2024",
      status: "inactive",
    },
  ]

  const handleResetPassword = () => {
    console.log("[v0] Resetting password for user:", resetPasswordUser)
    setResetPasswordUser(null)
  }

  const adminUsername = adminEmail ? adminEmail.split('@')[0] : 'Admin'
  const adminAvatarFallback = adminUsername.substring(0, 2).toUpperCase()

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-border">
          <h1 className="text-xl font-bold text-primary">Planora</h1>
        </div>

        {/* Navigation */}
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
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors bg-gray-100 dark:bg-gray-800 text-primary dark:text-white border border-gray-300 dark:border-gray-700"
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
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
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

        {/* Logout */}
        <div className="p-3 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                  <AvatarFallback>{adminAvatarFallback}</AvatarFallback> {/* use dynamic avatar fallback */}
                </Avatar>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-foreground">{adminUsername}</div> {/* display dynamic username */}
                  <div className="text-xs text-muted-foreground">{adminEmail}</div> {/* display dynamic email */}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setIsSettingsModalOpen(true)}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Cài đặt</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-destructive">
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
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-foreground">Quản lý người dùng</h2>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Thêm người dùng mới
            </Button>
          </div>

          {/* Users Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Họ và tên</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Ngày tham gia</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-foreground">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.roleColor as "default" | "secondary" | "outline"}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.joinDate}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.status === "active" ? "default" : "destructive"}
                        className={user.status === "active" ? "bg-green-500 hover:bg-green-600" : ""}
                      >
                        {user.status === "active" ? "Hoạt động" : "Bị khóa"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Đặt lại mật khẩu"
                          onClick={() => setResetPasswordUser({ id: user.id, name: user.name, email: user.email })}
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Chỉnh sửa vai trò"
                        >
                          <UserCog className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          title="Xóa/Khóa tài khoản"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>

      {/* Reset Password Confirmation Modal */}
      <Dialog open={!!resetPasswordUser} onOpenChange={(open) => !open && setResetPasswordUser(null)}>
        <DialogContent className="bg-white dark:bg-gray-800 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">
              Bạn có chắc muốn đặt lại mật khẩu?
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Một mật khẩu mới sẽ được tạo và gửi đến email của người dùng này.
            </DialogDescription>
          </DialogHeader>
          {resetPasswordUser && (
            <div className="py-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{resetPasswordUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{resetPasswordUser.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{resetPasswordUser.email}</div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setResetPasswordUser(null)}
            >
              Hủy
            </Button>
            <Button onClick={handleResetPassword}>
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <SettingsModal
        open={isSettingsModalOpen}
        onOpenChange={setIsSettingsModalOpen}
        settings={settings}
        onUpdateSettings={setSettings}
      />
    </div>
  )
}
