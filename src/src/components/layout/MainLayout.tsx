"use client"

import { type ReactNode, useState, useRef } from "react"
import { Button } from "../ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { LayoutDashboard, FolderKanban, User, LogOut, Plus, ChevronDown, Menu, X, Settings, Bell, Trash2, Globe, Users, ShieldCheck } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Alert, AlertDescription } from "../ui/alert"
import type { User as UserType, Project, Notification, ProjectInvitation, JoinRequest } from "../../App"
import { SettingsModal } from "../settings/SettingsModal"
import { NotificationList } from "../notifications/NotificationList"

interface MainLayoutProps {
  user: UserType
  projects: Project[]
  currentPage: string
  selectedProjectId: string | null
  settings: any
  notifications: Notification[]
  invitations: ProjectInvitation[]
  joinRequests: JoinRequest[]
  onAddNotification: (notification: any) => void
  onSendInvitation: (projectId: string, email: string) => void
  onAcceptInvitation: (invitationId: string) => void
  onCreateJoinRequest: (projectId: string) => void
  onApproveJoinRequest: (requestId: string) => void
  onRejectJoinRequest: (requestId: string) => void
  onNavigate: (page: string) => void
  onSelectProject: (projectId: string) => void
  onLogout: () => void
  onUpdateSettings: (settings: any) => void
  onMarkNotificationAsRead: (notificationId: string) => void
  onMarkAllNotificationsAsRead: () => void
  onDeleteNotification: (notificationId: string) => void
  onRestoreProject: (projectId: string) => void
  onPermanentlyDeleteProject: (projectId: string) => void
  onRestoreTask: (taskId: string) => void
  onPermanentlyDeleteTask: (taskId: string) => void
  onEnterAdmin?: (email: string, password: string) => void
  children: ReactNode
}

export function MainLayout({
  user,
  projects,
  currentPage,
  selectedProjectId,
  settings,
  notifications,
  onNavigate,
  onSelectProject,
  onLogout,
  onUpdateSettings,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  onDeleteNotification,
  children,
}: MainLayoutProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    deadline: "",
    template: "kanban" as "kanban" | "scrum",
  })
  const sidebarRef = useRef<HTMLDivElement>(null)

  const templateDescriptions = {
    kanban: "Quản lý công việc trực quan với bảng Kanban. Tốt để theo dõi tiến độ một cách linh hoạt.",
    scrum: "Tiếp cận Agile với Sprint. Lý tưởng cho các dự án lặp lại với những khúc nước ngắn.",
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleCreateProject = () => {
    if (newProject.name && newProject.deadline) {
      window.dispatchEvent(new CustomEvent("createProject", { detail: newProject }))
      setIsCreateDialogOpen(false)
      setNewProject({
        name: "",
        description: "",
        deadline: "",
        template: "kanban",
      })
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const activeProjects = projects.filter((p) => !p.deletedAt)
  const deletedItemsCount = projects.filter((p) => p.deletedAt).length

  return (
    <div className={`min-h-screen ${settings.theme === "dark" ? "dark bg-slate-950" : "bg-gray-50"} flex`}>
      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`${
          isSidebarOpen ? "" : "hidden"
        } ${settings.theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"} border-r transition-all duration-300 overflow-hidden flex flex-col fixed left-0 top-0 bottom-0 z-40 w-64`}
      >
        {/* Sticky header */}
        <div
          className={`p-4 ${settings.theme === "dark" ? "border-slate-800" : "border-gray-200"} border-b sticky top-0 bg-inherit z-10`}
        >
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <span className={`text-xl font-bold ${settings.theme === "dark" ? "text-white" : "text-gray-900"}`}>
              Planora
            </span>
          </div>
        </div>

        {/* Scrollable projects section */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Button
            variant={currentPage === "dashboard" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => onNavigate("dashboard")}
          >
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Tổng quan
          </Button>

          <Button
            variant={currentPage === "projects" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => onNavigate("projects")}
          >
            <Globe className="w-4 h-4 mr-2" />
            Khám phá dự án
          </Button>

          <Button
            variant={currentPage === "member-requests" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => onNavigate("member-requests")}
          >
            <Users className="w-4 h-4 mr-2" />
            Yêu cầu tham gia
          </Button>

          <div className="pt-4">
            <div className="flex items-center justify-between mb-2 px-2">
              <span className={`text-sm ${settings.theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>Dự án</span>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md !bg-white dark:!bg-gray-900" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
                  <DialogHeader>
                    <DialogTitle className="text-black dark:text-white">Tạo dự án mới</DialogTitle>
                    <DialogDescription className="text-gray-600 dark:text-gray-400">Nhập thông tin để tạo dự án mới</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="projectName" className="text-black dark:text-gray-200">Tên dự án *</Label>
                      <Input
                        id="projectName"
                        value={newProject.name}
                        onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                        placeholder="Nhập tên dự án"
                        className="bg-white dark:bg-gray-800 text-black dark:text-white border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-black dark:text-gray-200">Mô tả</Label>
                      <Textarea
                        id="description"
                        value={newProject.description}
                        onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                        placeholder="Mô tả ngắn về dự án"
                        rows={3}
                        className="bg-white dark:bg-gray-800 text-black dark:text-white border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deadline" className="text-black dark:text-gray-200">Deadline *</Label>
                      <Input
                        id="deadline"
                        type="date"
                        value={newProject.deadline}
                        onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                        className="bg-white dark:bg-gray-800 text-black dark:text-white border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="template" className="text-black dark:text-gray-200">Template</Label>
                      <Select
                        value={newProject.template}
                        onValueChange={(value: string) =>
                          setNewProject({ ...newProject, template: value as "kanban" | "scrum" })
                        }
                      >
                        <SelectTrigger className="bg-white dark:bg-gray-800 text-black dark:text-white border-gray-300 dark:border-gray-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kanban">Kanban</SelectItem>
                          <SelectItem value="scrum">Scrum</SelectItem>
                        </SelectContent>
                      </Select>
                      <Alert className="mt-2 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                        <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
                          {templateDescriptions[newProject.template]}
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Hủy
                    </Button>
                    <Button onClick={handleCreateProject}>Tạo dự án</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-1">
              {activeProjects.length === 0 ? (
                <div
                  className={`text-sm px-2 py-4 text-center ${settings.theme === "dark" ? "text-gray-500" : "text-gray-400"}`}
                >
                  Chưa có dự án nào
                </div>
              ) : (
                activeProjects.map((project) => (
                  <Button
                    key={project.id}
                    variant={selectedProjectId === project.id ? "secondary" : "ghost"}
                    className="w-full justify-start text-sm"
                    onClick={() => onSelectProject(project.id)}
                  >
                    <FolderKanban className="w-4 h-4 mr-2" />
                    <span className="truncate">{project.name}</span>
                  </Button>
                ))
              )}
            </div>
          </div>
        </nav>

        {/* Sticky bottom sections */}
        <div
          className={`${settings.theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"} border-t space-y-2 p-4 sticky bottom-16 z-10`}
        >
          <Button
            variant={currentPage === "trash" ? "secondary" : "ghost"}
            className="w-full justify-start text-sm"
            onClick={() => onNavigate("trash")}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            <span className="flex-1 text-left">Thùng rác</span>
            {deletedItemsCount > 0 && (
              <span className="text-xs bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                {deletedItemsCount}
              </span>
            )}
          </Button>
        </div>

        {/* Sticky account section */}
        <div
          className={`p-4 ${settings.theme === "dark" ? "border-slate-800 bg-slate-800" : "border-gray-200 bg-gray-50"} border-t sticky bottom-0 z-10`}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start">
                <Avatar className="w-8 h-8 mr-2">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left overflow-hidden">
                  <div className="text-sm truncate">{user.name}</div>
                  <div className={`text-xs ${settings.theme === "dark" ? "text-gray-400" : "text-gray-500"} truncate`}>
                    {user.email}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => onNavigate("profile")}>
                <User className="w-4 h-4 mr-2" />
                Thông tin cá nhân
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsSettingsModalOpen(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Cài đặt
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-0"}`}>
        {/* Sticky Top Bar */}
        <header
          className={`${settings.theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"} border-b px-4 py-3 flex items-center gap-4 sticky top-0 z-30`}
        >
          <Button variant="ghost" size="sm" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <div className="flex-1" />

          <Button variant="ghost" size="sm" onClick={() => setIsSettingsModalOpen(true)} title="Settings">
            <Settings className="w-5 h-5" />
          </Button>

          <DropdownMenu open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative" title="Notifications">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96 p-0">
              <NotificationList
                notifications={notifications}
                onMarkAsRead={onMarkNotificationAsRead}
                onMarkAllAsRead={onMarkAllNotificationsAsRead}
                onDelete={onDeleteNotification}
                theme={settings.theme}
              />
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            className="text-red-600 hover:text-red-700 bg-transparent"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Đăng xuất
          </Button>
        </header>

        <main className={`flex-1 overflow-auto ${settings.theme === "dark" ? "bg-slate-950" : "bg-gray-50"}`}>
          {children}
        </main>
      </div>

      <SettingsModal
        open={isSettingsModalOpen}
        onOpenChange={setIsSettingsModalOpen}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
      />
    </div>
  )
}
