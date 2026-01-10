"use client"

import { useState, useEffect } from "react"
import { LayoutDashboard, Users, Shield, Settings, Database, LogOut, UserPlus, KeyRound, UserCog, Trash2, User, ShieldCheck, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getAllUsers, resetUserPassword, updateUserStatus, type AdminUser } from '@/services/adminService'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { SettingsModal } from "../settings/SettingsModal"

interface AdminDashboardProps {
  adminEmail?: string // added adminEmail prop
  onNavigate: (page: 'dashboard' | 'users' | 'roles' | 'settings' | 'backup') => void
  onLogout?: () => void
}

export function AdminDashboard({ adminEmail, onNavigate, onLogout }: AdminDashboardProps) {
  const [activeNav, setActiveNav] = useState("users")
  const [resetPasswordUser, setResetPasswordUser] = useState<{ id: string; name: string; email: string } | null>(null)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [settings, setSettings] = useState({
    theme: 'light' as 'light' | 'dark',
    language: 'vi' as 'vi' | 'en',
    notifications: {
      taskAssigned: true,
      taskCompleted: true,
      projectUpdates: true,
      emailNotifications: true,
    },
    linkedAccounts: {},
  })

  // Real data states
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch users from Supabase
  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true)
        setError(null)
        const data = await getAllUsers()
        setUsers(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Đã xảy ra lỗi'
        setError(message)
        toast.error(message)
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const handleResetPassword = async () => {
    if (!resetPasswordUser) return

    setIsResetting(true)
    try {
      await resetUserPassword(resetPasswordUser.email)
      toast.success(`Đã gửi email đặt lại mật khẩu đến ${resetPasswordUser.email}`)
      setResetPasswordUser(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể gửi email'
      toast.error(message)
    } finally {
      setIsResetting(false)
    }
  }

  const handleToggleUserStatus = async (user: AdminUser) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active'
    try {
      await updateUserStatus(user.id, newStatus)
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u))
      toast.success(`Đã ${newStatus === 'active' ? 'kích hoạt' : 'khóa'} tài khoản ${user.name}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể cập nhật trạng thái'
      toast.error(message)
    }
  }

  // Helper to format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('vi-VN')
  }

  // Helper to get role display info
  const getRoleDisplay = (role: string) => {
    return role === 'admin'
      ? { label: 'Admin', variant: 'default' as const }
      : { label: 'Thành viên', variant: 'secondary' as const }
  }

  const adminUsername = adminEmail ? adminEmail.split('@')[0] : 'Admin'
  const adminAvatarFallback = adminUsername.substring(0, 2).toUpperCase()

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        {/* Logo */}
        <div className="h-[52px] flex items-center px-4 border-b border-border">
          <h1 className="text-lg font-bold text-primary">Planora Admin</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          <ul className="space-y-1 px-3">
            <li>
              <button
                onClick={() => onNavigate('dashboard')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Giám sát hệ thống</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('users')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-100 dark:bg-gray-800 text-primary dark:text-white border border-gray-300 dark:border-gray-700"
              >
                <Users className="h-4 w-4" />
                <span>Quản lý người dùng</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('roles')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Shield className="h-4 w-4" />
                <span>Quản lý vai trò</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('settings')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Settings className="h-4 w-4" />
                <span>Cấu hình hệ thống</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('backup')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Database className="h-4 w-4" />
                <span>Backup/Restore</span>
              </button>
            </li>
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-accent transition-colors">
                <Avatar className="h-7 w-7">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                  <AvatarFallback className="text-xs">{adminAvatarFallback}</AvatarFallback> {/* use dynamic avatar fallback */}
                </Avatar>
                <div className="flex-1 text-left">
                  <div className="text-xs font-medium text-foreground">{adminUsername}</div> {/* display dynamic username */}
                  <div className="text-[11px] text-muted-foreground">{adminEmail}</div> {/* display dynamic email */}
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
        <div className="container mx-auto px-4 lg:px-6 py-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-md">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Quản lý người dùng
                </h1>
                <p className="text-gray-600 text-sm">Quản lý tài khoản và quyền truy cập người dùng</p>
              </div>
            </div>
          </div>


          {/* Users Table */}
          <Card className="border shadow-md">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-gray-900">Danh sách người dùng</CardTitle>
                  <CardDescription className="text-sm mt-0.5">Quản lý thông tin và quyền truy cập</CardDescription>
                </div>
                <Button className="gap-2 h-9 text-sm shadow-md">
                  <UserPlus className="h-4 w-4" />
                  Thêm người dùng mới
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px] min-w-[200px]">Họ và tên</TableHead>
                      <TableHead className="min-w-[120px]">Vai trò</TableHead>
                      <TableHead className="min-w-[110px]">Ngày tham gia</TableHead>
                      <TableHead className="min-w-[110px]">Trạng thái</TableHead>
                      <TableHead className="text-right min-w-[130px]">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                          <p className="text-muted-foreground mt-2">Đang tải...</p>
                        </TableCell>
                      </TableRow>
                    ) : error ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-destructive">
                          {error}
                        </TableCell>
                      </TableRow>
                    ) : users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Chưa có người dùng nào
                        </TableCell>
                      </TableRow>
                    ) : users.map((user) => {
                      const roleDisplay = getRoleDisplay(user.role)
                      return (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarImage src={user.avatar_url || "/placeholder.svg"} alt={user.name} />
                                <AvatarFallback className="text-[11px]">{user.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-foreground text-xs">{user.name}</div>
                                <div className="text-[11px] text-muted-foreground">{user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={roleDisplay.variant}>
                              {roleDisplay.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(user.created_at)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={user.status === "active" ? "default" : "destructive"}
                              className={user.status === "active" ? "bg-green-500 hover:bg-green-600" : ""}
                            >
                              {user.status === "active" ? "Hoạt động" : "Bị khóa"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                title="Đặt lại mật khẩu"
                                onClick={() => setResetPasswordUser({ id: user.id, name: user.name, email: user.email })}
                              >
                                <KeyRound className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                title="Chỉnh sửa vai trò"
                              >
                                <UserCog className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                title={user.status === 'active' ? 'Khóa tài khoản' : 'Kích hoạt tài khoản'}
                                onClick={() => handleToggleUserStatus(user)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
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
            <Button onClick={handleResetPassword} disabled={isResetting}>
              {isResetting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
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