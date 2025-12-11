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
    theme: 'light',
    language: 'vi',
    notifications: {
      taskAssigned: true,
      taskCompleted: true,
      projectUpdates: true,
      emailNotifications: true,
    },
  })

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
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors bg-gray-100 dark:bg-gray-800 text-primary dark:text-white border border-gray-300 dark:border-gray-700"
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
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground">Tổng quan hệ thống</h2>
          </div>

          {/* Stat Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tổng số người dùng
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">60</div>
                <p className="text-xs text-muted-foreground mt-1">
                  +12% so với tháng trước
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tổng số dự án
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-muted-foreground mt-1">
                  +3 dự án mới tuần này
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Dự án đang hoạt động
                </CardTitle>
                <Cpu className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">18</div>
                <p className="text-xs text-muted-foreground mt-1">
                  75% tỷ lệ hoạt động
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Lỗi hệ thống (24h)
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">3</div>
                <p className="text-xs text-muted-foreground mt-1">
                  -2 so với hôm qua
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Hiệu năng hệ thống (CPU/RAM)</CardTitle>
                <CardDescription>Sử dụng tài nguyên theo thời gian</CardDescription>
              </CardHeader>
              <CardContent>
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
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
            <Card>
              <CardHeader>
                <CardTitle>Phân bố vai trò người dùng</CardTitle>
                <CardDescription>Số lượng người dùng theo vai trò</CardDescription>
              </CardHeader>
              <CardContent>
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
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={roleDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={(entry) => `${entry.name}: ${entry.value}`}
                      >
                        {roleDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Activity Log Table */}
          <Card>
            <CardHeader>
              <CardTitle>Nhật ký hoạt động (Activity Log)</CardTitle>
              <CardDescription>Các hoạt động gần đây trong hệ thống</CardDescription>
            </CardHeader>
            <CardContent>
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
