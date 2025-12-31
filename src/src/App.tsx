"use client"

import { useState, useEffect, useRef } from "react"
import { LoginPage } from "./components/auth/LoginPage"
import { RegisterPage } from "./components/auth/RegisterPage"
import { ForgotPasswordPage } from "./components/auth/ForgotPasswordPage"
import { MainLayout } from "./components/layout/MainLayout"
import { ProfilePage } from "./components/profile/ProfilePage"
import { SettingsPage } from "./components/settings/SettingsPage"
import { DashboardPage } from "./components/dashboard/DashboardPage"
import { ProjectPage } from "./components/project/ProjectPage"
import { Toaster } from "./components/ui/sonner"
import { toast } from "sonner"
import { TrashPage } from "./components/trash/TrashPage"
import { AllProjectsPage } from "./components/projects/AllProjectsPage"
import { MemberRequestsPage } from "./components/member-requests/MemberRequestsPage"
import { AdminDashboard, RoleManagement, SystemMonitoring, SystemSettings, BackupRestore } from "./components/admin"

type Page =
  | "login"
  | "register"
  | "forgot-password"
  | "dashboard"
  | "profile"
  | "settings"
  | "project"
  | "trash"
  | "projects"
  | "member-requests"
  | "admin"

type AdminPage = "users" | "roles" | "monitoring" | "settings" | "backup"

export interface User {
  id: string
  email: string
  name: string
  phone?: string
  avatar?: string
}

export interface Project {
  id: string
  name: string
  description: string
  deadline: string
  ownerId: string
  createdAt: string
  template: "kanban" | "scrum"
  members: ProjectMember[]
  deletedAt?: string
}

export interface ProjectMember {
  userId: string
  role: "manager" | "member"
  name: string
  email: string
  avatar?: string
}

export interface TaskProposal {
  id: string
  projectId: string
  title: string
  description: string
  priority: "low" | "medium" | "high" | "urgent"
  proposedBy: string
  proposedByName: string
  status: "pending" | "approved" | "rejected"
  createdAt: string
}

export interface Task {
  id: string
  projectId: string
  type: "user-story" | "task"
  title: string
  description: string
  priority: "low" | "medium" | "high" | "urgent"
  status: "backlog" | "todo" | "in-progress" | "done"
  assignees: string[]
  deadline?: string
  labels: string[]
  storyPoints?: number
  parentTaskId?: string
  sprintId?: string
  createdBy: string
  createdAt: string
  comments: Comment[]
  attachments: Attachment[]
  deletedAt?: string
}

export interface Comment {
  id: string
  taskId: string
  userId: string
  userName: string
  content: string
  createdAt: string
}

export interface Attachment {
  id: string
  taskId: string
  name: string
  url: string
  type: string
  uploadedBy: string
  uploadedAt: string
}

export interface Settings {
  theme: "light" | "dark"
  language: "vi" | "en"
  notifications: {
    taskAssigned: boolean
    taskCompleted: boolean
    projectUpdates: boolean
    emailNotifications: boolean
  }
  linkedAccounts: {
    google?: { email: string; linkedAt: string }
    facebook?: { email: string; linkedAt: string }
    github?: { email: string; linkedAt: string }
  }
}

export interface Notification {
  id: string
  userId: string
  type: "task_assigned" | "task_completed" | "member_added" | "project_update" | "task_mentioned"
  title: string
  message: string
  read: boolean
  relatedId?: string
  createdAt: string
}

export interface ProjectInvitation {
  id: string
  projectId: string
  projectName: string
  invitedEmail: string
  invitedBy: string
  status: "pending" | "accepted" | "rejected"
  createdAt: string
}

export interface JoinRequest {
  id: string
  projectId: string
  projectName: string
  userId: string
  userName: string
  userEmail: string
  status: "pending" | "approved" | "rejected"
  createdAt: string
}

export interface Sprint {
  id: string
  name: string
  goal: string
  projectId: string
  startDate: string
  endDate?: string
  status: "active" | "completed"
}

export default function App({ onEnterAdmin }: { onEnterAdmin?: (email: string, password: string) => void }) {
  console.log("App: mounted, onEnterAdmin provided:", { hasHandler: !!onEnterAdmin })
  const adminLoginHandler = (email: string, password: string) => {
    console.log("App: adminLoginHandler called", { email })

    // Validate admin credentials
    if (!email.includes("@gmail.com")) {
      toast.error("Email admin phải có đuôi @gmail.com")
      return
    }

    if (password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự")
      return
    }

    // Call prop handler if provided
    if (onEnterAdmin) {
      try {
        console.log("App: calling onEnterAdmin prop")
        onEnterAdmin(email, password)
        return
      } catch (e) {
        console.warn("App: onEnterAdmin threw", e)
      }
    }

    // Call global window handler if available
    if (typeof window !== "undefined" && (window as any).__onEnterAdmin) {
      console.log("App: calling fallback window.__onEnterAdmin")
        ; (window as any).__onEnterAdmin(email, password)
      return
    }

    // Default: show admin dashboard
    console.log("App: showing admin dashboard")
    toast.success("Đăng nhập admin thành công")

    // Store admin session
    localStorage.setItem("planora_admin", JSON.stringify({ email, loginAt: new Date().toISOString() }))

    // Set admin state and show admin page
    setAdminEmail(email)
    setCurrentPage("admin")
  }
  const [currentPage, setCurrentPage] = useState<Page>("login")
  const [user, setUser] = useState<User | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [taskProposals, setTaskProposals] = useState<TaskProposal[]>([])
  const [settings, setSettings] = useState<Settings>({
    theme: "light",
    language: "vi",
    notifications: {
      taskAssigned: true,
      taskCompleted: true,
      projectUpdates: true,
      emailNotifications: false,
    },
    linkedAccounts: {},
  })
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([])
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([])
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [adminEmail, setAdminEmail] = useState<string | null>(null)
  const [adminPage, setAdminPage] = useState<AdminPage>("monitoring")
  const eventListenerAttached = useRef(false)

  useEffect(() => {
    localStorage.clear()

    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (eventListenerAttached.current || !user) return

    const handleCreateProject = (e: CustomEvent) => {
      setProjects((prev) => {
        const newProject: Project = {
          ...(e as any).detail,
          id: Date.now().toString(),
          ownerId: user.id,
          createdAt: new Date().toISOString(),
          members: [
            {
              userId: user.id,
              role: "manager",
              name: user.name,
              email: user.email,
              avatar: user.avatar,
            },
          ],
        }
        return [...prev, newProject]
      })
    }

    window.addEventListener("createProject" as any, handleCreateProject as any)
    eventListenerAttached.current = true

    return () => {
      window.removeEventListener("createProject" as any, handleCreateProject as any)
      eventListenerAttached.current = false
    }
  }, [user])

  useEffect(() => {
    if (user) {
      localStorage.setItem("planora_user", JSON.stringify(user))
    }
  }, [user])

  useEffect(() => {
    localStorage.setItem("planora_projects", JSON.stringify(projects))
  }, [projects])

  useEffect(() => {
    localStorage.setItem("planora_tasks", JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    localStorage.setItem("planora_settings", JSON.stringify(settings))
    const isDark = settings.theme === "dark"
    if (isDark) {
      document.documentElement.classList.add("dark")
      document.documentElement.style.colorScheme = "dark"
    } else {
      document.documentElement.classList.remove("dark")
      document.documentElement.style.colorScheme = "light"
    }
  }, [settings])

  useEffect(() => {
    localStorage.setItem("planora_notifications", JSON.stringify(notifications))
  }, [notifications])

  useEffect(() => {
    localStorage.setItem("planora_invitations", JSON.stringify(invitations))
  }, [invitations])

  useEffect(() => {
    localStorage.setItem("planora_join_requests", JSON.stringify(joinRequests))
  }, [joinRequests])

  useEffect(() => {
    localStorage.setItem("planora_task_proposals", JSON.stringify(taskProposals))
  }, [taskProposals])

  // Adapter to accept generic string navigation from child components
  const navigate = (page: string) => {
    setCurrentPage(page as Page)
  }

  // Adapters for simplified child callbacks (they supply minimal data)
  const onAddCommentAdapter = (taskId: string, content: string) => {
    if (!user) return
    handleAddComment(taskId, { userId: user.id, userName: user.name, content })
  }

  const onAddAttachmentAdapter = (taskId: string, file: { name: string; url: string; type: string }) => {
    if (!user) return
    handleAddAttachment(taskId, { ...file, uploadedBy: user.id })
  }

  const handleLogin = (email: string, password: string) => {
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name: email.split("@")[0],
    }

    setUser(newUser)
    setCurrentPage("dashboard")
  }

  const handleRegister = (data: { email: string; password: string; name: string; phone?: string }) => {
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email: data.email,
      name: data.name,
      phone: data.phone,
    }

    setUser(newUser)
    setCurrentPage("dashboard")
  }

  const handleLogout = () => {
    setUser(null)
    setSelectedProjectId(null)
    localStorage.removeItem("planora_user")
    setCurrentPage("login")
  }

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser)
  }

  const handleUpdateSettings = (updatedSettings: Settings) => {
    setSettings(updatedSettings)
  }

  const handleMarkNotificationAsRead = (notificationId: string) => {
    setNotifications(notifications.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))
  }

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
  }

  const handleDeleteNotification = (notificationId: string) => {
    setNotifications(notifications.filter((n) => n.id !== notificationId))
  }

  const handleAddNotification = (notification: Omit<Notification, "id" | "createdAt">) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }
    setNotifications([newNotification, ...notifications])
  }

  const handleUpdateProject = (projectId: string, updates: Partial<Project>) => {
    setProjects(projects.map((p) => (p.id === projectId ? { ...p, ...updates } : p)))
  }

  const handleDeleteProject = (projectId: string) => {
    setProjects(projects.map((p) => (p.id === projectId ? { ...p, deletedAt: new Date().toISOString() } : p)))
    toast.success("Dự án đã được di chuyển vào thùng rác")
    if (selectedProjectId === projectId) {
      setSelectedProjectId(null)
      setCurrentPage("dashboard")
    }
  }

  const handleRestoreProject = (projectId: string) => {
    setProjects(projects.map((p) => (p.id === projectId ? { ...p, deletedAt: undefined } : p)))
    toast.success("Dự án đã được khôi phục")
  }

  const handlePermanentlyDeleteProject = (projectId: string) => {
    setProjects(projects.filter((p) => p.id !== projectId))
    setTasks(tasks.filter((t) => t.projectId !== projectId))
    toast.success("Dự án đã được xóa vĩnh viễn")
  }

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId)
    setCurrentPage("project")
  }

  const handleCreateTask = (task: Omit<Task, "id" | "createdAt" | "comments" | "attachments">) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      comments: [],
      attachments: [],
    }

    setTasks((prevTasks) => {
      const updatedTasks = [...prevTasks, newTask]

      // Nếu task mới thuộc một User Story, cập nhật lại trạng thái User Story
      if (newTask.parentTaskId && newTask.type === 'task') {
        const parentStory = updatedTasks.find(t => t.id === newTask.parentTaskId)
        // Nếu User Story đang "done" mà có task mới chưa done → chuyển về "in-progress"
        if (parentStory && parentStory.status === 'done' && newTask.status !== 'done') {
          return updatedTasks.map(t =>
            t.id === newTask.parentTaskId ? { ...t, status: 'in-progress' as const } : t
          )
        }
      }

      return updatedTasks
    })

    if (task.assignees.length > 0 && user) {
      task.assignees.forEach((assigneeId) => {
        if (assigneeId !== user.id) {
          handleAddNotification({
            userId: assigneeId,
            type: "task_assigned",
            title: "Bạn được giao một nhiệm vụ mới",
            message: `${user.name} đã giao cho bạn nhiệm vụ: "${newTask.title}"`,
            read: false,
            relatedId: newTask.id,
          })
        }
      })
    }
  }

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks((prevTasks) => {
      const updatedTasks = prevTasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t))

      // Auto-update User Story status if a Task is updated
      const updatedTask = updatedTasks.find(t => t.id === taskId)
      if (updatedTask?.parentTaskId && updatedTask.type === 'task') {
        const siblingTasks = updatedTasks.filter(t => t.parentTaskId === updatedTask.parentTaskId)
        const allDone = siblingTasks.every(t => t.status === 'done')
        const anyInProgress = siblingTasks.some(t => t.status === 'in-progress' || t.status === 'done')

        // Find and update parent User Story
        return updatedTasks.map(t => {
          if (t.id === updatedTask.parentTaskId) {
            if (allDone && siblingTasks.length > 0) {
              return { ...t, status: 'done' as const }
            } else if (anyInProgress) {
              return { ...t, status: 'in-progress' as const }
            } else {
              return { ...t, status: 'todo' as const }
            }
          }
          return t
        })
      }

      return updatedTasks
    })
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, deletedAt: new Date().toISOString() } : t)))
    toast.success("Nhiệm vụ đã được di chuyển vào thùng rác")
  }

  const handleRestoreTask = (taskId: string) => {
    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, deletedAt: undefined } : t)))
    toast.success("Nhiệm vụ đã được khôi phục")
  }

  const handlePermanentlyDeleteTask = (taskId: string) => {
    setTasks(tasks.filter((t) => t.id !== taskId && t.parentTaskId !== taskId))
    toast.success("Nhiệm vụ đã được xóa vĩnh viễn")
  }

  const handleCreateSprint = (projectId: string, name: string, goal: string, taskIds: string[]) => {
    const newSprint: Sprint = {
      id: Date.now().toString(),
      name: name || `Sprint ${sprints.filter(s => s.projectId === projectId).length + 1}`,
      goal,
      projectId,
      startDate: new Date().toISOString(),
      status: "active",
    }

    setSprints([...sprints, newSprint])

    // Update tasks with sprint ID and move to todo
    setTasks(tasks.map((t) =>
      taskIds.includes(t.id)
        ? { ...t, sprintId: newSprint.id, status: "todo" as const }
        : t
    ))

    toast.success(`Đã tạo ${newSprint.name}!`)
  }

  const handleEndSprint = (sprintId: string) => {
    // Mark sprint as completed
    setSprints(sprints.map((s) =>
      s.id === sprintId
        ? { ...s, status: "completed" as const, endDate: new Date().toISOString() }
        : s
    ))

    // Lấy danh sách User Stories trong sprint này
    const sprintUserStoryIds = tasks
      .filter(t => t.sprintId === sprintId && (t.type === 'user-story' || (!t.type && !t.parentTaskId)))
      .map(t => t.id)

    // Move incomplete tasks back to backlog and clear sprintId
    setTasks(tasks.map((t) => {
      // Xử lý User Stories và Standalone Tasks trong Sprint
      if (t.sprintId === sprintId) {
        if (t.status !== "done") {
          // Task not completed - move back to backlog
          return { ...t, sprintId: undefined, status: "backlog" as const }
        } else {
          // Task completed - just clear sprintId so it doesn't show in next sprint
          return { ...t, sprintId: undefined }
        }
      }

      // Xử lý sub-tasks của User Stories trong Sprint
      if (t.parentTaskId && sprintUserStoryIds.includes(t.parentTaskId) && t.type === 'task') {
        if (t.status !== "done") {
          // Sub-task chưa hoàn thành - reset về todo để sẵn sàng cho sprint sau
          return { ...t, status: "todo" as const }
        }
        // Sub-task đã done - giữ nguyên
      }

      return t
    }))

    toast.success("Sprint đã kết thúc! Các task chưa hoàn thành đã được chuyển về Backlog.")
  }

  const handleSendInvitation = (projectId: string, email: string) => {
    const project = projects.find((p) => p.id === projectId)
    if (!project) return

    const invitation: ProjectInvitation = {
      id: Date.now().toString(),
      projectId,
      projectName: project.name,
      invitedEmail: email,
      invitedBy: user?.id || "",
      status: "pending",
      createdAt: new Date().toISOString(),
    }

    setInvitations([...invitations, invitation])
    handleAddNotification({
      userId: "",
      type: "project_update",
      title: "Bạn được mời vào dự án",
      message: `${user?.name} đã mời bạn tham gia dự án: "${project.name}"`,
      read: false,
      relatedId: projectId,
    })
  }

  const handleAcceptInvitation = (invitationId: string) => {
    const invitation = invitations.find((i) => i.id === invitationId)
    if (!invitation || !user) return

    const project = projects.find((p) => p.id === invitation.projectId)
    if (!project) return

    const newMember = {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: "member" as const,
      avatar: user.avatar,
    }

    setProjects(projects.map((p) => (p.id === project.id ? { ...p, members: [...p.members, newMember] } : p)))

    setInvitations(invitations.map((i) => (i.id === invitationId ? { ...i, status: "accepted" } : i)))

    toast.success("Đã chấp nhận lời mời!")
  }

  const handleCreateJoinRequest = (projectId: string) => {
    if (!user) return

    const project = projects.find((p) => p.id === projectId)
    if (!project) return

    const isAlreadyMember = project.members.some((m) => m.userId === user.id) || project.ownerId === user.id
    if (isAlreadyMember) {
      toast.error("Bạn đã là thành viên của dự án này rồi")
      return
    }

    if (project.ownerId === user.id) {
      toast.error("Bạn là chủ sở hữu dự án này")
      return
    }

    const existingRequest = joinRequests.find(
      (r) => r.projectId === projectId && r.userId === user.id && r.status === "pending",
    )
    if (existingRequest) {
      toast.error("Bạn đã gửi yêu cầu tham gia dự án này rồi")
      return
    }

    const joinRequest: JoinRequest = {
      id: Date.now().toString(),
      projectId,
      projectName: project.name,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      status: "pending",
      createdAt: new Date().toISOString(),
    }

    setJoinRequests([...joinRequests, joinRequest])
    toast.success("Đã gửi yêu cầu tham gia!")
  }

  const handleApproveJoinRequest = (requestId: string) => {
    const request = joinRequests.find((r) => r.id === requestId)
    if (!request) return

    const project = projects.find((p) => p.id === request.projectId)
    if (!project) return

    const newMember = {
      userId: request.userId,
      name: request.userName,
      email: request.userEmail,
      role: "member" as const,
    }

    setProjects(projects.map((p) => (p.id === project.id ? { ...p, members: [...p.members, newMember] } : p)))

    setJoinRequests(joinRequests.map((r) => (r.id === requestId ? { ...r, status: "approved" } : r)))

    toast.success("Đã duyệt yêu cầu!")
  }

  const handleRejectJoinRequest = (requestId: string) => {
    setJoinRequests(joinRequests.map((r) => (r.id === requestId ? { ...r, status: "rejected" } : r)))
    toast.success("Đã từ chối yêu cầu!")
  }

  const handleAddComment = (taskId: string, comment: Omit<Comment, "id" | "taskId" | "createdAt">) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? {
            ...task,
            comments: [
              ...task.comments,
              {
                ...comment,
                id: Date.now().toString(),
                taskId,
                createdAt: new Date().toISOString(),
              },
            ],
          }
          : task,
      ),
    )
  }

  const handleAddAttachment = (taskId: string, attachment: Omit<Attachment, "id" | "taskId" | "uploadedAt">) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? {
            ...task,
            attachments: [
              ...task.attachments,
              {
                ...attachment,
                id: Date.now().toString(),
                taskId,
                uploadedAt: new Date().toISOString(),
              },
            ],
          }
          : task,
      ),
    )
  }

  const handleProposeTask = (
    projectId: string,
    task: Omit<TaskProposal, "id" | "createdAt" | "proposedBy" | "proposedByName" | "status">,
  ) => {
    if (!user) return

    const proposal: TaskProposal = {
      ...task,
      id: Date.now().toString(),
      projectId,
      proposedBy: user.id,
      proposedByName: user.name,
      status: "pending",
      createdAt: new Date().toISOString(),
    }

    setTaskProposals([...taskProposals, proposal])

    const project = projects.find((p) => p.id === projectId)
    if (project) {
      handleAddNotification({
        userId: project.ownerId,
        type: "project_update",
        title: "Có đề xuất nhiệm vụ mới",
        message: `${user.name} đã đề xuất tạo nhiệm vụ: "${task.title}" trong dự án "${project.name}"`,
        read: false,
        relatedId: proposal.id,
      })
    }

    toast.success("Đã gửi đề xuất nhiệm vụ!")
  }

  const handleApproveTaskProposal = (proposalId: string) => {
    const proposal = taskProposals.find((p) => p.id === proposalId)
    if (!proposal) return

    const newTask: Task = {
      id: Date.now().toString(),
      projectId: proposal.projectId,
      type: "user-story",
      title: proposal.title,
      description: proposal.description,
      priority: proposal.priority,
      status: "backlog",
      assignees: [],
      labels: [],
      createdBy: proposal.proposedBy,
      createdAt: new Date().toISOString(),
      comments: [],
      attachments: [],
    }

    setTasks([...tasks, newTask])
    setTaskProposals(taskProposals.map((p) => (p.id === proposalId ? { ...p, status: "approved" } : p)))

    handleAddNotification({
      userId: proposal.proposedBy,
      type: "project_update",
      title: "Đề xuất được chấp phát",
      message: `Đề xuất của bạn cho nhiệm vụ "${proposal.title}" đã được chấp thuận`,
      read: false,
    })

    toast.success("Đã phê duyệt đề xuất!")
  }

  const handleRejectTaskProposal = (proposalId: string) => {
    const proposal = taskProposals.find((p) => p.id === proposalId)
    if (!proposal) return

    setTaskProposals(taskProposals.map((p) => (p.id === proposalId ? { ...p, status: "rejected" } : p)))

    handleAddNotification({
      userId: proposal.proposedBy,
      type: "project_update",
      title: "Đề xuất bị từ chối",
      message: `Đề xuất của bạn cho nhiệm vụ "${proposal.title}" đã bị từ chối`,
      read: false,
    })

    toast.success("Đã từ chối đề xuất!")
  }

  if (
    isLoading ||
    (!user && currentPage !== "login" && currentPage !== "register" && currentPage !== "forgot-password" && currentPage !== "admin")
  ) {
    return (
      <>
        <LoginPage
          onLogin={handleLogin}
          onSwitchToRegister={() => setCurrentPage("register")}
          onForgotPassword={() => setCurrentPage("forgot-password")}
          onAdminLogin={adminLoginHandler}
        />
        <Toaster />
      </>
    )
  }

  if (currentPage === "register") {
    return (
      <>
        <RegisterPage onRegister={handleRegister} onSwitchToLogin={() => setCurrentPage("login")} />
        <Toaster />
      </>
    )
  }

  if (currentPage === "forgot-password") {
    return (
      <>
        <ForgotPasswordPage onBack={() => setCurrentPage("login")} />
        <Toaster />
      </>
    )
  }

  if (currentPage === "login") {
    return (
      <>
        <LoginPage
          onLogin={handleLogin}
          onSwitchToRegister={() => setCurrentPage("register")}
          onForgotPassword={() => setCurrentPage("forgot-password")}
          onAdminLogin={adminLoginHandler}
        />
        <Toaster />
      </>
    )
  }

  if (currentPage === "admin") {
    const handleAdminLogout = () => {
      console.log("Admin logout")
      setAdminEmail(null)
      setAdminPage("monitoring")
      localStorage.removeItem("planora_admin")
      toast.success("Đã đăng xuất khỏi admin")
      setCurrentPage("login")
    }

    const handleAdminNavigate = (page: 'dashboard' | 'users' | 'roles' | 'settings' | 'backup') => {
      console.log("Admin navigating to:", page)
      const pageMap: Record<string, AdminPage> = {
        dashboard: "monitoring",
        users: "users",
        roles: "roles",
        settings: "settings",
        backup: "backup"
      }
      setAdminPage(pageMap[page])
    }

    return (
      <>
        {adminPage === "users" && (
          <AdminDashboard
            adminEmail={adminEmail || undefined}
            onNavigate={handleAdminNavigate}
            onLogout={handleAdminLogout}
          />
        )}
        {adminPage === "roles" && (
          <RoleManagement
            adminEmail={adminEmail || undefined}
            onNavigate={handleAdminNavigate}
            onLogout={handleAdminLogout}
          />
        )}
        {adminPage === "monitoring" && (
          <SystemMonitoring
            adminEmail={adminEmail || undefined}
            onNavigate={handleAdminNavigate}
            onLogout={handleAdminLogout}
          />
        )}
        {adminPage === "settings" && (
          <SystemSettings
            adminEmail={adminEmail || undefined}
            onNavigate={handleAdminNavigate}
            onLogout={handleAdminLogout}
          />
        )}
        {adminPage === "backup" && (
          <BackupRestore
            adminEmail={adminEmail || undefined}
            onNavigate={handleAdminNavigate}
            onLogout={handleAdminLogout}
          />
        )}
        <Toaster />
      </>
    )
  }

  if (!user) {
    return null
  }

  return (
    <>
      <MainLayout
        user={user}
        projects={projects}
        currentPage={currentPage}
        selectedProjectId={selectedProjectId}
        settings={settings}
        notifications={notifications.filter((n) => n.userId === user.id)}
        invitations={invitations.filter((i) => i.invitedEmail === user?.email)}
        joinRequests={joinRequests.filter((r) => {
          const proj = projects.find((p) => p.id === r.projectId)
          const isManager =
            proj?.members.find((m) => m.userId === user?.id)?.role === "manager" || proj?.ownerId === user?.id
          return isManager
        })}
        onNavigate={navigate}
        onSelectProject={handleSelectProject}
        onLogout={handleLogout}
        onUpdateSettings={handleUpdateSettings}
        onMarkNotificationAsRead={handleMarkNotificationAsRead}
        onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
        onDeleteNotification={handleDeleteNotification}
        onAddNotification={handleAddNotification}
        onSendInvitation={handleSendInvitation}
        onAcceptInvitation={handleAcceptInvitation}
        onCreateJoinRequest={handleCreateJoinRequest}
        onApproveJoinRequest={handleApproveJoinRequest}
        onRejectJoinRequest={handleRejectJoinRequest}
        onRestoreProject={handleRestoreProject}
        onPermanentlyDeleteProject={handlePermanentlyDeleteProject}
        onRestoreTask={handleRestoreTask}
        onPermanentlyDeleteTask={handlePermanentlyDeleteTask}
        onEnterAdmin={onEnterAdmin}
      >
        {currentPage === "dashboard" && (
          <DashboardPage user={user} projects={projects} tasks={tasks} onSelectProject={handleSelectProject} />
        )}

        {currentPage === "profile" && <ProfilePage user={user} onUpdateUser={handleUpdateUser} />}

        {currentPage === "settings" && (
          <SettingsPage settings={settings} onUpdateSettings={handleUpdateSettings} onNavigate={navigate} />
        )}

        {currentPage === "trash" && (
          <TrashPage
            projects={projects}
            tasks={tasks}
            onRestoreProject={handleRestoreProject}
            onPermanentlyDeleteProject={handlePermanentlyDeleteProject}
            onRestoreTask={handleRestoreTask}
            onPermanentlyDeleteTask={handlePermanentlyDeleteTask}
          />
        )}

        {currentPage === "projects" && (
          <AllProjectsPage
            user={user}
            projects={projects}
            onSelectProject={handleSelectProject}
            onCreateJoinRequest={handleCreateJoinRequest}
          />
        )}

        {currentPage === "member-requests" && (
          <MemberRequestsPage
            joinRequests={joinRequests}
            onApproveJoinRequest={handleApproveJoinRequest}
            onRejectJoinRequest={handleRejectJoinRequest}
          />
        )}

        {currentPage === "project" && selectedProjectId && (
          <ProjectPage
            user={user}
            project={projects.find((p) => p.id === selectedProjectId)!}
            tasks={tasks.filter((t) => t.projectId === selectedProjectId)}
            sprints={sprints.filter((s) => s.projectId === selectedProjectId)}
            currentSprint={sprints.find((s) => s.projectId === selectedProjectId && s.status === "active")}
            onUpdateProject={handleUpdateProject}
            onDeleteProject={handleDeleteProject}
            onCreateTask={handleCreateTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onAddComment={onAddCommentAdapter}
            onAddAttachment={onAddAttachmentAdapter}
            onCreateSprint={handleCreateSprint}
            onEndSprint={handleEndSprint}
          />
        )}
      </MainLayout>
      <Toaster />
    </>
  )
}
