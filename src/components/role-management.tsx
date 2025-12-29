"use client"

import { useState } from "react"
import { LayoutDashboard, Users, Shield, Settings, Database, LogOut, Plus, Edit, User, ShieldCheck } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SettingsModal } from "../src/components/settings/SettingsModal"

interface RoleManagementProps {
  adminEmail?: string // added adminEmail prop
  onNavigate: (page: 'dashboard' | 'users' | 'roles' | 'settings' | 'backup') => void
  onLogout?: () => void // Added onLogout prop
}

const roles = [
  {
    id: 1,
    name: "Admin",
    description: "Có toàn quyền truy cập và quản lý hệ thống",
    permissions: {
      projects: {
        createProject: true,
        editProject: true,
        deleteProject: true,
        manageMembers: true,
        viewReports: true,
      },
      tasks: {
        createTask: true,
        editTask: true,
        deleteTask: true,
        assignTask: true,
        useAI: true,
      },
      system: {
        accessUserManagement: true,
        accessRoleManagement: true,
        accessSystemConfig: true,
      },
    },
  },
  {
    id: 2,
    name: "Project Manager",
    description: "Quản lý dự án và phân công nhiệm vụ cho thành viên",
    permissions: {
      projects: {
        createProject: true,
        editProject: true,
        deleteProject: false,
        manageMembers: true,
        viewReports: true,
      },
      tasks: {
        createTask: true,
        editTask: true,
        deleteTask: true,
        assignTask: true,
        useAI: true,
      },
      system: {
        accessUserManagement: false,
        accessRoleManagement: false,
        accessSystemConfig: false,
      },
    },
  },
  {
    id: 3,
    name: "Team Member",
    description: "Thành viên trong nhóm, có thể xem và cập nhật nhiệm vụ",
    permissions: {
      projects: {
        createProject: false,
        editProject: false,
        deleteProject: false,
        manageMembers: false,
        viewReports: false,
      },
      tasks: {
        createTask: false,
        editTask: true,
        deleteTask: false,
        assignTask: false,
        useAI: false,
      },
      system: {
        accessUserManagement: false,
        accessRoleManagement: false,
        accessSystemConfig: false,
      },
    },
  },
]

const permissionGroups = [
  {
    title: "Quản lý Dự án",
    permissions: [
      { key: "projects.createProject", label: "Tạo dự án mới" },
      { key: "projects.editProject", label: "Chỉnh sửa dự án" },
      { key: "projects.deleteProject", label: "Xóa dự án" },
      { key: "projects.manageMembers", label: "Thêm/Xóa thành viên" },
      { key: "projects.viewReports", label: "Xem báo cáo" },
    ],
  },
  {
    title: "Quản lý Nhiệm vụ",
    permissions: [
      { key: "tasks.createTask", label: "Tạo nhiệm vụ mới" },
      { key: "tasks.editTask", label: "Chỉnh sửa nhiệm vụ" },
      { key: "tasks.deleteTask", label: "Xóa nhiệm vụ" },
      { key: "tasks.assignTask", label: "Giao nhiệm vụ" },
      { key: "tasks.useAI", label: "Sử dụng tính năng AI (Ước tính & Cải thiện)" },
    ],
  },
  {
    title: "Quản lý Hệ thống (Admin)",
    permissions: [
      { key: "system.accessUserManagement", label: "Truy cập trang Quản lý người dùng" },
      { key: "system.accessRoleManagement", label: "Truy cập trang Quản lý vai trò" },
      { key: "system.accessSystemConfig", label: "Truy cập trang Cấu hình hệ thống" },
    ],
  },
]

export function RoleManagement({ adminEmail, onNavigate, onLogout }: RoleManagementProps) {
  const [activeNav, setActiveNav] = useState("roles")
  const [selectedRole, setSelectedRole] = useState<typeof roles[0] | null>(null)
  const [editedPermissions, setEditedPermissions] = useState<any>(null)
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

  const handleEditPermissions = (role: typeof roles[0]) => {
    setSelectedRole(role)
    setEditedPermissions(JSON.parse(JSON.stringify(role.permissions)))
  }

  const handleTogglePermission = (path: string) => {
    if (!editedPermissions) return
    
    const keys = path.split('.')
    const newPermissions = { ...editedPermissions }
    
    if (keys.length === 2) {
      newPermissions[keys[0]][keys[1]] = !newPermissions[keys[0]][keys[1]]
    }
    
    setEditedPermissions(newPermissions)
  }

  const getPermissionValue = (path: string) => {
    if (!editedPermissions) return false
    const keys = path.split('.')
    if (keys.length === 2) {
      return editedPermissions[keys[0]]?.[keys[1]] || false
    }
    return false
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
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Users className="h-4 w-4" />
                <span>Quản lý người dùng</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('roles')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-100 dark:bg-gray-800 text-primary dark:text-white border border-gray-300 dark:border-gray-700"
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

        {/* Profile Dropdown Menu */}
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
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Quản lý vai trò và phân quyền
                </h1>
                <p className="text-gray-600 text-sm">Cấu hình quyền truy cập cho từng vai trò trong hệ thống</p>
              </div>
              <Button className="gap-2 shadow-md">
                <Plus className="h-4 w-4" />
                Tạo vai trò mới
              </Button>
            </div>
          </div>

          {/* Role Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => (
              <Card key={role.id} className="border shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-blue-50/30">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                  <CardTitle className="text-xl text-gray-900">{role.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <Button 
                    variant="outline" 
                    className="w-full gap-2"
                    onClick={() => handleEditPermissions(role)}
                  >
                    <Edit className="h-4 w-4" />
                    Chỉnh sửa quyền
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Permission Edit Modal */}
      <Dialog open={selectedRole !== null} onOpenChange={(open) => !open && setSelectedRole(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-2xl text-gray-900 dark:text-white">
              Chi tiết quyền cho vai trò: {selectedRole?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {permissionGroups.map((group) => (
              <div key={group.title} className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  {group.title}
                </h3>
                <div className="space-y-3">
                  {group.permissions.map((permission) => (
                    <div 
                      key={permission.key} 
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Label 
                        htmlFor={permission.key} 
                        className="text-sm font-medium cursor-pointer flex-1 text-gray-700 dark:text-gray-300"
                      >
                        {permission.label}
                      </Label>
                      <Switch
                        id={permission.key}
                        checked={getPermissionValue(permission.key)}
                        onCheckedChange={() => handleTogglePermission(permission.key)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={() => setSelectedRole(null)}>
              Hủy
            </Button>
            <Button onClick={() => setSelectedRole(null)}>
              Lưu thay đổi
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SettingsModal
        open={isSettingsModalOpen}
        onOpenChange={setIsSettingsModalOpen}
        settings={settings}
        onUpdateSettings={setSettings}
      />
    </div>
  )
}
