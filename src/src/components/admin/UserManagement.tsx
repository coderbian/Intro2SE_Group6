"use client"

import { useState } from "react"
import { LayoutDashboard, Users, Shield, Settings, Database, LogOut, UserPlus, KeyRound, UserCog, Trash2, User, ShieldCheck } from 'lucide-react'
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
  adminEmail?: string
  onNavigate: (page: 'dashboard' | 'users' | 'roles' | 'settings' | 'backup') => void
  onLogout?: () => void
}

export function AdminDashboard({ adminEmail, onNavigate, onLogout }: AdminDashboardProps) {
  const [activeNav, setActiveNav] = useState("users")
  const [resetPasswordUser, setResetPasswordUser] = useState<{ id: number; name: string; email: string } | null>(null)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
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

  const mockUsers = [
    {
      id: 1,
      name: "Nguyá»…n VÄƒn A",
      email: "nguyenvana@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
      role: "Admin",
      roleColor: "default",
      joinDate: "15/01/2024",
      status: "active",
    },
    {
      id: 2,
      name: "Tráº§n Thá»‹ B",
      email: "tranthib@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
      role: "Manager",
      roleColor: "secondary",
      joinDate: "20/01/2024",
      status: "active",
    },
    {
      id: 3,
      name: "LÃª VÄƒn C",
      email: "levanc@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
      role: "Member",
      roleColor: "outline",
      joinDate: "25/01/2024",
      status: "active",
    },
    {
      id: 4,
      name: "Pháº¡m Thá»‹ D",
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
                <span>GiÃ¡m sÃ¡t há»‡ thá»‘ng</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('users')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-100 dark:bg-gray-800 text-primary dark:text-white border border-gray-300 dark:border-gray-700"
              >
                <Users className="h-4 w-4" />
                <span>Quáº£n lÃ½ ngÆ°á»i dÃ¹ng</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('roles')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Shield className="h-4 w-4" />
                <span>Quáº£n lÃ½ vai trÃ²</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('settings')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Settings className="h-4 w-4" />
                <span>Cáº¥u hÃ¬nh há»‡ thá»‘ng</span>
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
                <span>CÃ i Ä‘áº·t</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>ÄÄƒng xuáº¥t</span>
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
                  Quáº£n lÃ½ ngÆ°á»i dÃ¹ng
                </h1>
                <p className="text-gray-600 text-sm">Quáº£n lÃ½ tÃ i khoáº£n vÃ  quyá»n truy cáº­p ngÆ°á»i dÃ¹ng</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="border border-blue-200 hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs text-blue-700 font-semibold uppercase tracking-wide">Tá»•ng ngÆ°á»i dÃ¹ng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {mockUsers.length}
                  </div>
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl shadow-md">
                    <User className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-green-200 hover:shadow-lg transition-shadow bg-gradient-to-br from-green-50 to-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs text-green-700 font-semibold uppercase tracking-wide">Äang hoáº¡t Ä‘á»™ng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {mockUsers.filter(u => u.status === 'active').length}
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2.5 rounded-xl shadow-md">
                    <ShieldCheck className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-purple-200 hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-50 to-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs text-purple-700 font-semibold uppercase tracking-wide">Quáº£n trá»‹ viÃªn</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {mockUsers.filter(u => u.role === 'Admin').length}
                  </div>
                  <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-2.5 rounded-xl shadow-md">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-orange-200 hover:shadow-lg transition-shadow bg-gradient-to-br from-orange-50 to-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs text-orange-700 font-semibold uppercase tracking-wide">ThÃ nh viÃªn má»›i</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                    +2
                  </div>
                  <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-2.5 rounded-xl shadow-md">
                    <UserPlus className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-xs text-orange-700 font-medium mt-2">
                  Tuáº§n nÃ y
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          <Card className="border shadow-md">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-gray-900">Danh sÃ¡ch ngÆ°á»i dÃ¹ng</CardTitle>
                  <CardDescription className="text-sm mt-0.5">Quáº£n lÃ½ thÃ´ng tin vÃ  quyá»n truy cáº­p</CardDescription>
                </div>
                <Button className="gap-2 h-9 text-sm shadow-md">
                  <UserPlus className="h-4 w-4" />
                  ThÃªm ngÆ°á»i dÃ¹ng má»›i
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px] min-w-[200px]">Há» vÃ  tÃªn</TableHead>
                      <TableHead className="min-w-[120px]">Vai trÃ²</TableHead>
                      <TableHead className="min-w-[110px]">NgÃ y tham gia</TableHead>
                      <TableHead className="min-w-[110px]">Tráº¡ng thÃ¡i</TableHead>
                      <TableHead className="text-right min-w-[130px]">HÃ nh Ä‘á»™ng</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                  {mockUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                            <AvatarFallback className="text-[11px]">{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-foreground text-xs">{user.name}</div>
                            <div className="text-[11px] text-muted-foreground">{user.email}</div>
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
                          {user.status === "active" ? "Hoáº¡t Ä‘á»™ng" : "Bá»‹ khÃ³a"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="Äáº·t láº¡i máº­t kháº©u"
                            onClick={() => setResetPasswordUser({ id: user.id, name: user.name, email: user.email })}
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="Chá»‰nh sá»­a vai trÃ²"
                          >
                            <UserCog className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            title="XÃ³a/KhÃ³a tÃ i khoáº£n"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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
              Báº¡n cÃ³ cháº¯c muá»‘n Ä‘áº·t láº¡i máº­t kháº©u?
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Má»™t máº­t kháº©u má»›i sáº½ Ä‘Æ°á»£c táº¡o vÃ  gá»­i Ä‘áº¿n email cá»§a ngÆ°á»i dÃ¹ng nÃ y.
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
              Há»§y
            </Button>
            <Button onClick={handleResetPassword}>
              XÃ¡c nháº­n
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
