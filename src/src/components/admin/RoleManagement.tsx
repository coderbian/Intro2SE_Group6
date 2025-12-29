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
import { SettingsModal } from "../settings/SettingsModal"

interface RoleManagementProps {
  adminEmail?: string
  onNavigate: (page: 'dashboard' | 'users' | 'roles' | 'settings' | 'backup') => void
  onLogout?: () => void
}

const roles = [
  {
    id: 1,
    name: "Admin",
    description: "CÃ³ toÃ n quyá»n truy cáº­p vÃ  quáº£n lÃ½ há»‡ thá»‘ng",
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
    description: "Quáº£n lÃ½ dá»± Ã¡n vÃ  phÃ¢n cÃ´ng nhiá»‡m vá»¥ cho thÃ nh viÃªn",
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
    description: "ThÃ nh viÃªn trong nhÃ³m, cÃ³ thá»ƒ xem vÃ  cáº­p nháº­t nhiá»‡m vá»¥",
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
    title: "Quáº£n lÃ½ Dá»± Ã¡n",
    permissions: [
      { key: "projects.createProject", label: "Táº¡o dá»± Ã¡n má»›i" },
      { key: "projects.editProject", label: "Chá»‰nh sá»­a dá»± Ã¡n" },
      { key: "projects.deleteProject", label: "XÃ³a dá»± Ã¡n" },
      { key: "projects.manageMembers", label: "ThÃªm/XÃ³a thÃ nh viÃªn" },
      { key: "projects.viewReports", label: "Xem bÃ¡o cÃ¡o" },
    ],
  },
  {
    title: "Quáº£n lÃ½ Nhiá»‡m vá»¥",
    permissions: [
      { key: "tasks.createTask", label: "Táº¡o nhiá»‡m vá»¥ má»›i" },
      { key: "tasks.editTask", label: "Chá»‰nh sá»­a nhiá»‡m vá»¥" },
      { key: "tasks.deleteTask", label: "XÃ³a nhiá»‡m vá»¥" },
      { key: "tasks.assignTask", label: "Giao nhiá»‡m vá»¥" },
      { key: "tasks.useAI", label: "Sá»­ dá»¥ng tÃ­nh nÄƒng AI (Æ¯á»›c tÃ­nh & Cáº£i thiá»‡n)" },
    ],
  },
  {
    title: "Quáº£n lÃ½ Há»‡ thá»‘ng (Admin)",
    permissions: [
      { key: "system.accessUserManagement", label: "Truy cáº­p trang Quáº£n lÃ½ ngÆ°á»i dÃ¹ng" },
      { key: "system.accessRoleManagement", label: "Truy cáº­p trang Quáº£n lÃ½ vai trÃ²" },
      { key: "system.accessSystemConfig", label: "Truy cáº­p trang Cáº¥u hÃ¬nh há»‡ thá»‘ng" },
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
                <span>GiÃ¡m sÃ¡t há»‡ thá»‘ng</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('users')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Users className="h-4 w-4" />
                <span>Quáº£n lÃ½ ngÆ°á»i dÃ¹ng</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('roles')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-100 dark:bg-gray-800 text-primary dark:text-white border border-gray-300 dark:border-gray-700"
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
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Quáº£n lÃ½ vai trÃ² vÃ  phÃ¢n quyá»n
                </h1>
                <p className="text-gray-600 text-sm">Cáº¥u hÃ¬nh quyá»n truy cáº­p cho tá»«ng vai trÃ² trong há»‡ thá»‘ng</p>
              </div>
              <Button className="gap-2 shadow-md">
                <Plus className="h-4 w-4" />
                Táº¡o vai trÃ² má»›i
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
                    Chá»‰nh sá»­a quyá»n
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
              Chi tiáº¿t quyá»n cho vai trÃ²: {selectedRole?.name}
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
              Há»§y
            </Button>
            <Button onClick={() => setSelectedRole(null)}>
              LÆ°u thay Ä‘á»•i
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
