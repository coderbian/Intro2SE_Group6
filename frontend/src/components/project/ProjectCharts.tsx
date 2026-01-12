"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts'
import { CheckCircle2, Clock, AlertCircle, Users, TrendingUp, ListTodo, Calendar, Download } from 'lucide-react'
import { ExportReportDialog } from "./ExportReportDialog"
import type { Task, Project } from "../../types"

interface ProjectChartsProps {
    project: Project
    tasks: Task[]
}

const STATUS_COLORS: Record<string, string> = {
    'backlog': '#6366f1',
    'todo': '#94a3b8',
    'in_progress': '#3b82f6',
    'in-progress': '#3b82f6',
    'review': '#f59e0b',
    'done': '#22c55e',
    'completed': '#22c55e',
}

const STATUS_LABELS: Record<string, string> = {
    'backlog': 'Backlog',
    'todo': 'Chờ làm',
    'in_progress': 'Đang làm',
    'in-progress': 'Đang làm',
    'review': 'Review',
    'done': 'Hoàn thành',
    'completed': 'Hoàn thành',
}

const PRIORITY_COLORS: Record<string, string> = {
    'low': '#22c55e',
    'medium': '#3b82f6',
    'high': '#f59e0b',
    'urgent': '#ef4444',
}

const PRIORITY_LABELS: Record<string, string> = {
    'low': 'Thấp',
    'medium': 'Trung bình',
    'high': 'Cao',
    'urgent': 'Khẩn cấp',
}

const STATUS_ORDER: Record<string, number> = {
    'backlog': 1,
    'todo': 2,
    'in_progress': 3,
    'in-progress': 3,
    'review': 4,
    'done': 5,
    'completed': 5,
}

export function ProjectCharts({ project, tasks }: ProjectChartsProps) {
    // Filter out deleted tasks
    const activeTasks = useMemo(() =>
        tasks.filter(t => !t.deletedAt),
        [tasks]
    )

    // Calculate statistics
    const stats = useMemo(() => {
        const total = activeTasks.length
        const completed = activeTasks.filter(t => {
            const status = t.status as string
            return status === 'done' || status === 'completed'
        }).length
        const inProgress = activeTasks.filter(t => {
            const status = t.status as string
            return status === 'in-progress' || status === 'in_progress'
        }).length
        const overdue = activeTasks.filter(t => {
            if (!t.dueDate) return false
            const status = t.status as string
            return new Date(t.dueDate) < new Date() && status !== 'done' && status !== 'completed'
        }).length

        return {
            total,
            completed,
            inProgress,
            overdue,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
        }
    }, [activeTasks])

    // Tasks by status
    const tasksByStatus = useMemo(() => {
        const statusCounts = new Map<string, number>()
        activeTasks.forEach(t => {
            const status = t.status || 'unknown'
            statusCounts.set(status, (statusCounts.get(status) || 0) + 1)
        })
        return Array.from(statusCounts.entries())
            .map(([status, count]) => ({
                name: STATUS_LABELS[status] || status,
                value: count,
                fill: STATUS_COLORS[status] || '#6b7280',
                order: STATUS_ORDER[status] || 99,
            }))
            .sort((a, b) => a.order - b.order)
    }, [activeTasks])

    // Tasks by priority
    const tasksByPriority = useMemo(() => {
        const priorityCounts = new Map<string, number>()
        activeTasks.forEach(t => {
            const priority = t.priority || 'medium'
            priorityCounts.set(priority, (priorityCounts.get(priority) || 0) + 1)
        })
        const priorityOrder = ['low', 'medium', 'high', 'urgent']
        return priorityOrder
            .filter(p => priorityCounts.has(p) || priorityCounts.get(p) !== undefined)
            .map(priority => ({
                name: PRIORITY_LABELS[priority] || priority,
                value: priorityCounts.get(priority) || 0,
                fill: PRIORITY_COLORS[priority] || '#6b7280',
            }))
            .filter(item => item.value > 0)
    }, [activeTasks])

    // Tasks by assignee
    const tasksByAssignee = useMemo(() => {
        const assigneeCounts = new Map<string, number>()
        activeTasks.forEach(t => {
            if (t.assignees && t.assignees.length > 0) {
                t.assignees.forEach(assigneeId => {
                    const member = project.members.find(m => m.userId === assigneeId)
                    const name = member?.name || 'Unknown'
                    assigneeCounts.set(name, (assigneeCounts.get(name) || 0) + 1)
                })
            } else {
                assigneeCounts.set('Chưa giao', (assigneeCounts.get('Chưa giao') || 0) + 1)
            }
        })
        return Array.from(assigneeCounts.entries())
            .map(([name, count]) => ({ name, value: count }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8) // Top 8 assignees
    }, [activeTasks, project.members])

    // Weekly progress (last 4 weeks)
    const weeklyProgress = useMemo(() => {
        const weeks: { week: string; completed: number; created: number }[] = []
        const now = new Date()

        for (let i = 3; i >= 0; i--) {
            const weekStart = new Date(now)
            weekStart.setDate(now.getDate() - (i + 1) * 7)
            const weekEnd = new Date(weekStart)
            weekEnd.setDate(weekStart.getDate() + 7)

            const completed = activeTasks.filter(t => {
                if (!t.updatedAt) return false
                const updated = new Date(t.updatedAt)
                const status = t.status as string
                return updated >= weekStart && updated < weekEnd &&
                    (status === 'done' || status === 'completed')
            }).length

            const created = activeTasks.filter(t => {
                const created = new Date(t.createdAt)
                return created >= weekStart && created < weekEnd
            }).length

            weeks.push({
                week: `Tuần ${4 - i}`,
                completed,
                created,
            })
        }
        return weeks
    }, [activeTasks])

    return (
        <div className="p-6 space-y-6">
            {/* Header with Export Button */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Biểu đồ thống kê</h2>
                    <p className="text-sm text-gray-500">Tổng quan tiến độ và phân bổ công việc</p>
                </div>
                <ExportReportDialog project={project} tasks={tasks} />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border shadow-sm bg-gradient-to-br from-blue-50 to-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                            <ListTodo className="w-4 h-4" />
                            Tổng công việc
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
                    </CardContent>
                </Card>

                <Card className="border shadow-sm bg-gradient-to-br from-green-50 to-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Hoàn thành
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-900">{stats.completed}</div>
                        <div className="text-xs text-green-600">{stats.completionRate}% hoàn thành</div>
                    </CardContent>
                </Card>

                <Card className="border shadow-sm bg-gradient-to-br from-amber-50 to-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-amber-700 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Đang làm
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-900">{stats.inProgress}</div>
                    </CardContent>
                </Card>

                <Card className="border shadow-sm bg-gradient-to-br from-red-50 to-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Quá hạn
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-900">{stats.overdue}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tasks by Status */}
                <Card className="border shadow-sm">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                        <CardTitle className="text-base font-bold">Công việc theo trạng thái</CardTitle>
                        <CardDescription>Phân bổ công việc theo tình trạng</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="h-[250px] flex items-center justify-center">
                            {tasksByStatus.length > 0 ? (
                                <ResponsiveContainer width="100%" height={tasksByStatus.length * 50 + 30}>
                                    <BarChart data={tasksByStatus} layout="vertical" margin={{ left: 10, right: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                        <XAxis type="number" />
                                        <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12 }} />
                                        <Tooltip />
                                        <Bar dataKey="value" name="Số lượng" radius={[0, 4, 4, 0]} barSize={28}>
                                            {tasksByStatus.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-gray-500 text-sm">Chưa có công việc</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Tasks by Priority */}
                <Card className="border shadow-sm">
                    <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
                        <CardTitle className="text-base font-bold">Công việc theo độ ưu tiên</CardTitle>
                        <CardDescription>Phân bổ theo mức độ quan trọng</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="h-[250px]">
                            {tasksByPriority.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={tasksByPriority}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            dataKey="value"
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                            labelLine={false}
                                        >
                                            {tasksByPriority.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                                    Chưa có công việc
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tasks by Assignee */}
                <Card className="border shadow-sm">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Công việc theo thành viên
                        </CardTitle>
                        <CardDescription>Số lượng công việc mỗi người đảm nhận</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="h-[250px]">
                            {tasksByAssignee.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={tasksByAssignee} margin={{ left: 10, right: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="value" name="Số công việc" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                                    Chưa có công việc
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Weekly Progress */}
                <Card className="border shadow-sm">
                    <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Tiến độ hàng tuần
                        </CardTitle>
                        <CardDescription>Công việc tạo mới và hoàn thành trong 4 tuần gần đây</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={weeklyProgress} margin={{ left: 0, right: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="created"
                                        name="Tạo mới"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        dot={{ fill: '#3b82f6' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="completed"
                                        name="Hoàn thành"
                                        stroke="#22c55e"
                                        strokeWidth={2}
                                        dot={{ fill: '#22c55e' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Project Info */}
            <Card className="border shadow-sm">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Thông tin dự án
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <div className="text-gray-500">Ngày tạo</div>
                            <div className="font-medium">{new Date(project.createdAt).toLocaleDateString('vi-VN')}</div>
                        </div>
                        <div>
                            <div className="text-gray-500">Deadline</div>
                            <div className="font-medium">{new Date(project.deadline).toLocaleDateString('vi-VN')}</div>
                        </div>
                        <div>
                            <div className="text-gray-500">Thành viên</div>
                            <div className="font-medium">{project.members.length} người</div>
                        </div>
                        <div>
                            <div className="text-gray-500">Template</div>
                            <div className="font-medium capitalize">{project.template}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
