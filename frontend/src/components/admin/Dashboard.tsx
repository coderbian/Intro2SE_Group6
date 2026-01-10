"use client"

import { useState, useEffect } from "react"
import { LayoutDashboard, Users, Shield, FolderKanban, LogOut, Settings, Activity, Loader2, TrendingUp, CheckCircle2, Clock, FolderOpen } from 'lucide-react'
import { toast } from 'sonner'
import { getActivityLogs, getSystemStats, getDetailedStats, type ActivityLog, type SystemStats, type DetailedStats } from '@/services/adminService'
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
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar, XAxis, YAxis, LineChart, Line, CartesianGrid, Tooltip } from "recharts"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SettingsModal } from "../settings/SettingsModal"

interface DashboardProps {
    adminEmail?: string
    onNavigate: (page: 'dashboard' | 'users' | 'roles' | 'projects') => void
    onLogout?: () => void
}

const STATUS_COLORS: Record<string, string> = {
    'todo': '#94a3b8',
    'in_progress': '#3b82f6',
    'in-progress': '#3b82f6',
    'review': '#f59e0b',
    'done': '#22c55e',
    'completed': '#22c55e',
    'unknown': '#6b7280',
}

const STATUS_LABELS: Record<string, string> = {
    'todo': 'Chờ làm',
    'in_progress': 'Đang làm',
    'in-progress': 'Đang làm',
    'review': 'Review',
    'done': 'Hoàn thành',
    'completed': 'Hoàn thành',
    'unknown': 'Khác',
}

const ROLE_COLORS: Record<string, string> = {
    'admin': '#8b5cf6',
    'user': '#06b6d4',
}

export function Dashboard({ adminEmail, onNavigate, onLogout }: DashboardProps) {
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

    // Data states
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
    const [stats, setStats] = useState<SystemStats | null>(null)
    const [detailedStats, setDetailedStats] = useState<DetailedStats | null>(null)
    const [loading, setLoading] = useState(true)

    // Fetch all data
    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true)
                const [logsData, statsData, detailedData] = await Promise.all([
                    getActivityLogs(10),
                    getSystemStats(),
                    getDetailedStats()
                ])
                setActivityLogs(logsData)
                setStats(statsData)
                setDetailedStats(detailedData)
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Đã xảy ra lỗi'
                toast.error(message)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    // Helper functions
    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    }

    const getActionLabel = (action: string) => {
        const labels: Record<string, string> = {
            'created': 'Tạo mới',
            'updated': 'Cập nhật',
            'deleted': 'Xóa',
            'moved': 'Di chuyển',
            'assigned': 'Giao nhiệm vụ',
            'login': 'Đăng nhập',
            'logout': 'Đăng xuất',
        }
        return labels[action.toLowerCase()] || action
    }

    const adminUsername = adminEmail ? adminEmail.split('@')[0] : 'Admin'
    const adminAvatarFallback = adminUsername.substring(0, 2).toUpperCase()

    // Prepare chart data
    const taskStatusData = detailedStats?.tasksByStatus.map(item => ({
        name: STATUS_LABELS[item.status] || item.status,
        value: item.count,
        fill: STATUS_COLORS[item.status] || '#6b7280',
    })) || []

    const userRoleData = detailedStats?.usersByRole.map(item => ({
        name: item.role === 'admin' ? 'Admin' : 'Thành viên',
        value: item.count,
        fill: ROLE_COLORS[item.role] || '#6b7280',
    })) || []

    const monthlyData = detailedStats?.monthlyData || []

    const completionRate = detailedStats?.totalStats.totalTasks
        ? Math.round((detailedStats.totalStats.completedTasks / detailedStats.totalStats.totalTasks) * 100)
        : 0

    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar */}
            <aside className="w-64 border-r border-border bg-card flex flex-col">
                <div className="h-[52px] flex items-center px-4 border-b border-border">
                    <h1 className="text-lg font-bold text-primary">Planora Admin</h1>
                </div>

                <nav className="flex-1 py-4">
                    <ul className="space-y-1 px-3">
                        <li>
                            <button
                                onClick={() => onNavigate('dashboard')}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-100 dark:bg-gray-800 text-primary dark:text-white border border-gray-300 dark:border-gray-700"
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                <span>Tổng quan</span>
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
                                onClick={() => onNavigate('projects')}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            >
                                <FolderKanban className="h-4 w-4" />
                                <span>Quản lý dự án</span>
                            </button>
                        </li>
                    </ul>
                </nav>

                <div className="p-3 border-t border-border">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-accent transition-colors">
                                <Avatar className="h-7 w-7">
                                    <AvatarImage src="/placeholder.svg" alt="User" />
                                    <AvatarFallback className="text-xs">{adminAvatarFallback}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 text-left">
                                    <div className="text-xs font-medium text-foreground">{adminUsername}</div>
                                    <div className="text-[11px] text-muted-foreground">{adminEmail}</div>
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
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2.5 rounded-xl shadow-md">
                            <LayoutDashboard className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Tổng quan hệ thống
                            </h1>
                            <p className="text-gray-600 text-sm">Xem thống kê và hoạt động gần đây</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : (
                        <>
                            {/* Stats Cards */}
                            <div className="grid grid-cols-4 gap-4 mb-6">
                                <Card className="border border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-blue-600" />
                                            <CardTitle className="text-sm text-blue-700">Người dùng</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-blue-700">{stats?.totalUsers || 0}</div>
                                        <p className="text-xs text-blue-600">{stats?.activeUsers || 0} đang hoạt động</p>
                                    </CardContent>
                                </Card>

                                <Card className="border border-orange-200 bg-gradient-to-br from-orange-50 to-white">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center gap-2">
                                            <FolderOpen className="w-4 h-4 text-orange-600" />
                                            <CardTitle className="text-sm text-orange-700">Dự án</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-orange-700">{stats?.totalProjects || 0}</div>
                                    </CardContent>
                                </Card>

                                <Card className="border border-purple-200 bg-gradient-to-br from-purple-50 to-white">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-purple-600" />
                                            <CardTitle className="text-sm text-purple-700">Tổng tasks</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-purple-700">{stats?.totalTasks || 0}</div>
                                    </CardContent>
                                </Card>

                                <Card className="border border-green-200 bg-gradient-to-br from-green-50 to-white">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                                            <CardTitle className="text-sm text-green-700">Hoàn thành</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-green-700">{completionRate}%</div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Charts Row */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                {/* Tasks by Status */}
                                <Card className="border shadow-sm">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-bold">Tasks theo trạng thái</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[180px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={taskStatusData} layout="vertical">
                                                    <XAxis type="number" hide />
                                                    <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 11 }} />
                                                    <Tooltip />
                                                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                                        {taskStatusData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* User Roles */}
                                <Card className="border shadow-sm">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-bold">Phân bổ vai trò</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[180px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={userRoleData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={40}
                                                        outerRadius={65}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {userRoleData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                    <Legend wrapperStyle={{ fontSize: 11 }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Monthly Trend */}
                                <Card className="border shadow-sm">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-green-600" />
                                            <CardTitle className="text-sm font-bold">Xu hướng 6 tháng</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[180px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={monthlyData}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                                                    <YAxis tick={{ fontSize: 10 }} />
                                                    <Tooltip />
                                                    <Line type="monotone" dataKey="projects" name="Dự án" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                                                    <Line type="monotone" dataKey="users" name="Users" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Activity Logs */}
                            <Card className="border shadow-sm">
                                <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b pb-3">
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-gray-600" />
                                        <CardTitle className="text-sm font-bold">Hoạt động gần đây</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-3 px-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[100px]">Thời gian</TableHead>
                                                <TableHead>Người dùng</TableHead>
                                                <TableHead>Hành động</TableHead>
                                                <TableHead>Đối tượng</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {activityLogs.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                                                        Chưa có hoạt động nào
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                activityLogs.slice(0, 8).map((log) => (
                                                    <TableRow key={log.id}>
                                                        <TableCell className="text-muted-foreground text-xs">
                                                            {formatTime(log.created_at)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Avatar className="h-6 w-6">
                                                                    <AvatarFallback className="text-[10px]">
                                                                        {log.user_name?.charAt(0) || 'U'}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <span className="text-sm">{log.user_name || 'System'}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="secondary" className="text-xs">
                                                                {getActionLabel(log.action)}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-sm text-muted-foreground">
                                                            {log.entity_type}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </>
                    )}
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
