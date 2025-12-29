"use client"

import { useState } from "react"
import { LayoutDashboard, Users, Shield, Settings, Database, LogOut, Activity, AlertCircle, Cpu, HardDrive, User, ShieldCheck } from 'lucide-react'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SettingsModal } from "../src/components/settings/SettingsModal"

interface SystemMonitoringProps {
  adminEmail?: string // added adminEmail prop
  onNavigate: (page: 'dashboard' | 'users' | 'roles' | 'settings' | 'backup') => void
  onLogout?: () => void
}

const performanceData = [
  { time: "00:00", cpu: 45, ram: 62 },
  { time: "04:00", cpu: 32, ram: 58 },
  { time: "08:00", cpu: 68, ram: 72 },
  { time: "12:00", cpu: 75, ram: 78 },
  { time: "16:00", cpu: 82, ram: 85 },
  { time: "20:00", cpu: 58, ram: 70 },
  { time: "24:00", cpu: 48, ram: 65 },
]

const roleDistributionData = [
  { name: "Admin", value: 5, color: "#3b82f6" },
  { name: "Project Manager", value: 12, color: "#8b5cf6" },
  { name: "Developer", value: 28, color: "#10b981" },
  { name: "Designer", value: 15, color: "#f59e0b" },
]

const activityLogs = [
  {
    id: 1,
    time: "14:32:15",
    user: "Nguyễn Văn An",
    action: "Tạo dự án mới",
    details: "Website Redesign 2024",
  },
  {
    id: 2,
    time: "14:28:42",
    user: "Trần Thị Bích",
    action: "Cập nhật nhiệm vụ",
    details: "Task #234 - Hoàn thành UI Dashboard",
  },
  {
    id: 3,
    time: "14:15:20",
    user: "Lê Minh Cường",
    action: "Thêm thành viên",
    details: "Thêm Phạm Thu Dung vào dự án Mobile App",
  },
  {
    id: 4,
    time: "13:58:07",
    user: "Hoàng Văn Em",
    action: "Đăng nhập",
    details: "IP: 192.168.1.105",
  },
  {
    id: 5,
    time: "13:45:33",
    user: "Admin System",
    action: "Backup dữ liệu",
    details: "Backup tự động hàng ngày",
  },
]

export function SystemMonitoring({ adminEmail, onNavigate, onLogout }: SystemMonitoringProps) {
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
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-100 dark:bg-gray-800 text-primary dark:text-white border border-gray-300 dark:border-gray-700"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Giám sát hệ thống</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('users')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
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
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Xin chào, {adminUsername}!
                </h1>
                <p className="text-gray-600 text-sm">Đây là tổng quan về hệ thống và hoạt động quản trị</p>
              </div>
            </div>
          </div>

          {/* Stat Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="border border-blue-200 hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs text-blue-700 font-semibold uppercase tracking-wide">
                  Tổng số người dùng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    60
                  </div>
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl shadow-md">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-xs text-blue-700 font-medium mt-2">
                  +12% so với tháng trước
                </p>
              </CardContent>
            </Card>

            <Card className="border border-green-200 hover:shadow-lg transition-shadow bg-gradient-to-br from-green-50 to-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs text-green-700 font-semibold uppercase tracking-wide">
                  Tổng số dự án
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    24
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2.5 rounded-xl shadow-md">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-xs text-green-700 font-medium mt-2">
                  +3 dự án mới tuần này
                </p>
              </CardContent>
            </Card>

            <Card className="border border-yellow-200 hover:shadow-lg transition-shadow bg-gradient-to-br from-yellow-50 to-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs text-yellow-700 font-semibold uppercase tracking-wide">
                  Dự án đang hoạt động
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                    18
                  </div>
                  <div className="bg-gradient-to-br from-yellow-500 to-orange-600 p-2.5 rounded-xl shadow-md">
                    <Cpu className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-xs text-yellow-700 font-medium mt-2">
                  75% tỷ lệ hoạt động
                </p>
              </CardContent>
            </Card>

            <Card className="border border-red-200 hover:shadow-lg transition-shadow bg-gradient-to-br from-red-50 to-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs text-red-700 font-semibold uppercase tracking-wide">
                  Lỗi hệ thống (24h)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                    3
                  </div>
                  <div className="bg-gradient-to-br from-red-500 to-rose-600 p-2.5 rounded-xl shadow-md">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-xs text-red-700 font-medium mt-2">
                  -2 so với hôm qua
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Performance Chart */}
            <Card className="border shadow-md">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="text-lg font-bold text-gray-900">Hiệu năng hệ thống (CPU/RAM)</CardTitle>
                <CardDescription className="text-sm mt-0.5">Sử dụng tài nguyên theo thời gian</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 pb-4 px-2">
                <ChartContainer
                  config={{
                    cpu: {
                      label: "CPU",
                      color: "hsl(var(--chart-1))",
                    },
                    ram: {
                      label: "RAM",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-[280px] w-full"
                >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={performanceData} margin={{ top: 10, right: 30, left: -15, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="time" className="text-xs" />
                        <YAxis className="text-xs" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="cpu" 
                          stroke="hsl(var(--chart-1))" 
                          strokeWidth={2}
                          name="CPU %" 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="ram" 
                          stroke="hsl(var(--chart-2))" 
                          strokeWidth={2}
                          name="RAM %" 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

            {/* Role Distribution Chart */}
            <Card className="border shadow-md">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                <CardTitle className="text-lg font-bold text-gray-900">Phân bố vai trò</CardTitle>
                <CardDescription className="text-sm">Người dùng theo vai trò</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                  <ChartContainer
                    config={{
                      admin: {
                        label: "Admin",
                        color: "#3b82f6",
                      },
                      projectManager: {
                        label: "Project Manager",
                        color: "#8b5cf6",
                      },
                      developer: {
                        label: "Developer",
                        color: "#10b981",
                      },
                      designer: {
                        label: "Designer",
                        color: "#f59e0b",
                      },
                    }}
                    className="h-[280px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={roleDistributionData}
                          cx="50%"
                          cy="45%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {roleDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          formatter={(value, entry: any) => `${entry.payload.name}: ${entry.payload.value}`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
          </div>

          {/* Activity Log Table */}
          <Card className="border shadow-md">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b">
              <CardTitle className="text-lg font-bold text-gray-900">Nhật ký hoạt động (Activity Log)</CardTitle>
              <CardDescription className="text-sm">Các hoạt động gần đây trong hệ thống</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Thời gian</TableHead>
                    <TableHead className="w-[200px]">Người dùng</TableHead>
                    <TableHead className="w-[180px]">Hành động</TableHead>
                    <TableHead>Chi tiết</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activityLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {log.time}
                      </TableCell>
                      <TableCell className="font-medium">{log.user}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.action}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {log.details}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>

      <SettingsModal
        open={isSettingsModalOpen}
        onOpenChange={setIsSettingsModalOpen}
        settings={settings}
        onUpdateSettings={setSettings}
      />
    </div>
  )
}
