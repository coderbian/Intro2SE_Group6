"use client"

import { type ReactNode, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Button } from "../ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { LayoutDashboard, Users, Shield, FolderKanban, LogOut, Menu, Settings, Bell, ChevronDown, User } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { SettingsModal } from "../settings/SettingsModal"

interface AdminLayoutProps {
    adminEmail?: string
    onNavigate: (page: 'dashboard' | 'users' | 'roles' | 'projects') => void
    onLogout?: () => void
    children: ReactNode
    pageTitle?: string
}

export function AdminLayout({
    adminEmail,
    onNavigate,
    onLogout,
    children,
    pageTitle = "Tổng quan",
}: AdminLayoutProps) {
    const location = useLocation()
    const navigate = useNavigate()
    const currentPath = location.pathname
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
    const [isAccountOpen, setIsAccountOpen] = useState(false)
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

    const navItems = [
        { key: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard, path: '/admin/dashboard' },
        { key: 'users', label: 'Quản lý người dùng', icon: Users, path: '/admin/users' },
        { key: 'roles', label: 'Quản lý vai trò', icon: Shield, path: '/admin/roles' },
        { key: 'projects', label: 'Quản lý dự án', icon: FolderKanban, path: '/admin/projects' },
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 flex">
            {/* Sidebar */}
            <aside
                className={`${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} bg-white border-gray-200 shadow-xl border-r transition-transform duration-300 ease-in-out overflow-hidden flex flex-col fixed left-0 top-0 bottom-0 z-40 w-64`}
            >
                {/* Logo Header */}
                <div className="px-4 h-[52px] border-gray-200 border-b sticky top-0 bg-gradient-to-r from-violet-600 to-purple-600 z-10 shadow-md flex items-center">
                    <div className="flex items-center gap-2.5">
                        <div className="rounded-lg shadow-md overflow-hidden">
                            <img src="/logo.png" alt="Planora" className="w-9 h-9 object-cover" />
                        </div>
                        <div>
                            <span className="text-xl font-bold text-white drop-shadow-md">
                                Planora
                            </span>
                            <p className="text-xs text-violet-100 font-medium">Bảng điều khiển</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <div className="space-y-1.5">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            const isActive = currentPath === item.path || currentPath.startsWith(item.path)
                            return (
                                <Button
                                    key={item.key}
                                    variant={isActive ? "default" : "ghost"}
                                    className={`w-full justify-start h-9 text-sm font-semibold ${isActive
                                        ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md"
                                        : "hover:bg-violet-50"
                                        }`}
                                    onClick={() => onNavigate(item.key as 'dashboard' | 'users' | 'roles' | 'projects')}
                                >
                                    <Icon className="w-4 h-4 mr-2.5" />
                                    {item.label}
                                </Button>
                            )
                        })}
                    </div>
                </nav>

                {/* Account Section */}
                <div className="p-4 border-gray-200 bg-gradient-to-r from-violet-50 to-purple-50 border-t sticky bottom-0 z-10 shadow-md">
                    <DropdownMenu open={isAccountOpen} onOpenChange={setIsAccountOpen}>
                        <DropdownMenuTrigger asChild>
                            <button className="w-full text-left hover:bg-white/70 hover:shadow-md transition-all h-12 px-2.5 cursor-pointer rounded-md flex items-center">
                                <Avatar className="w-8 h-8 mr-2.5 ring-2 ring-violet-500 ring-offset-1">
                                    <AvatarImage src="/placeholder.svg" />
                                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white font-bold text-sm">
                                        {adminAvatarFallback}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 text-left overflow-hidden">
                                    <div className="text-sm font-semibold truncate">{adminUsername}</div>
                                    <div className="text-xs text-gray-600 truncate">{adminEmail}</div>
                                </div>
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onClick={() => navigate('/admin/profile')} className="cursor-pointer">
                                <User className="w-4 h-4 mr-2" />
                                Thông tin cá nhân
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setIsSettingsModalOpen(true)} className="cursor-pointer">
                                <Settings className="w-4 h-4 mr-2" />
                                Cài đặt
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={onLogout} className="text-red-600 cursor-pointer">
                                <LogOut className="w-4 h-4 mr-2" />
                                Đăng xuất
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </aside>

            {/* Main Content */}
            <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-0"}`}>
                {/* Top Bar */}
                <header className="bg-white/80 backdrop-blur-lg border-gray-200 border-b px-4 h-[52px] flex items-center gap-4 sticky top-0 z-30 shadow-sm">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="hover:bg-violet-50 rounded-lg p-1.5"
                        title={isSidebarOpen ? "Đóng sidebar" : "Mở sidebar"}
                    >
                        <Menu className="w-5 h-5" />
                    </Button>

                    <div className="flex-1">
                        <h2 className="text-lg font-bold text-gray-800">{pageTitle}</h2>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsSettingsModalOpen(true)}
                        title="Cài đặt"
                        className="hover:bg-violet-50 rounded-lg p-1.5"
                    >
                        <Settings className="w-4 h-4" />
                    </Button>

                    <button className="relative hover:bg-violet-50 rounded-lg p-1.5 cursor-pointer transition-colors" title="Thông báo">
                        <Bell className="w-4 h-4" />
                    </button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onLogout}
                        className="text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border-red-200 font-medium px-3 h-8 text-sm"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Đăng xuất
                    </Button>
                </header>

                <main className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 via-violet-50/20 to-gray-50">
                    {children}
                </main>
            </div>

            <SettingsModal
                open={isSettingsModalOpen}
                onOpenChange={setIsSettingsModalOpen}
                settings={settings}
                onUpdateSettings={setSettings}
            />
        </div>
    )
}
