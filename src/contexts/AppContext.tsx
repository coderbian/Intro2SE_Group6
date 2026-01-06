import { createContext, useContext, ReactNode, useState, useEffect } from "react"
import { useAuth } from "../hooks/useAuth"
import { useProjects } from "../hooks/useProjects"
import { useNotifications } from "../hooks/useNotifications"
import { useTasks } from "../hooks/useTasks"
import { useSprints } from "../hooks/useSprints"
import { useSettings } from "../hooks/useSettings"
import { useInvitations } from "../hooks/useInvitations"
import { useJoinRequests } from "../hooks/useJoinRequests"
import { useTaskProposals } from "../hooks/useTaskProposals"

interface AppContextType {
  auth: ReturnType<typeof useAuth>
  projects: ReturnType<typeof useProjects>
  tasks: ReturnType<typeof useTasks>
  sprints: ReturnType<typeof useSprints>
  settings: ReturnType<typeof useSettings>
  notifications: ReturnType<typeof useNotifications>
  invitations: ReturnType<typeof useInvitations>
  joinRequests: ReturnType<typeof useJoinRequests>
  taskProposals: ReturnType<typeof useTaskProposals>
  isLoading: boolean
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)

  // Initialize hooks
  const auth = useAuth()
  const notifications = useNotifications()
  const settings = useSettings()
  
  // Wrapper to match expected signature
  const addNotification = (notification: { userId: string; type: string; title: string; message: string; read: boolean; relatedId?: string }) => {
    notifications.handleAddNotification(notification as any)
  }
  
  const projects = useProjects({ user: auth.user, onAddNotification: addNotification })
  const tasks = useTasks({ user: auth.user, onAddNotification: addNotification })
  const sprints = useSprints({ tasks: tasks.tasks, setTasks: tasks.setTasks })
  const invitations = useInvitations(auth.user, projects.projects, projects.setProjects, notifications.handleAddNotification)
  const joinRequests = useJoinRequests(auth.user, projects.projects, projects.setProjects)
  const taskProposals = useTaskProposals(auth.user, projects.projects, tasks.tasks, tasks.setTasks, notifications.handleAddNotification)

  // Clear localStorage and set loading false on mount
  useEffect(() => {
    localStorage.clear()
    setIsLoading(false)
  }, [])

  const value: AppContextType = {
    auth,
    projects,
    tasks,
    sprints,
    settings,
    notifications,
    invitations,
    joinRequests,
    taskProposals,
    isLoading,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useApp must be used within AppProvider")
  }
  return context
}
