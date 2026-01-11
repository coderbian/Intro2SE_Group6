import type { Project } from "../types"

export type Permission =
  | "create_task"
  | "edit_task"
  | "delete_task"
  | "edit_project"
  | "delete_project"
  | "manage_members"
  | "change_project_settings"
  | "view_activity_log"
  | "export_data"

export interface RolePermissions {
  [key: string]: Permission[]
}

export const ROLE_PERMISSIONS: RolePermissions = {
  manager: [
    "create_task",
    "edit_task",
    "delete_task",
    "edit_project",
    "delete_project",
    "manage_members",
    "change_project_settings",
    "view_activity_log",
    "export_data",
  ],
  member: ["create_task", "edit_task"],
}

export function getUserRole(userId: string, project: Project): "manager" | "member" | null {
  const member = project.members.find((m: { userId: string }) => m.userId === userId)
  if (!member) return null
  return member.role
}

export function hasPermission(userId: string, project: Project, permission: Permission): boolean {
  const role = getUserRole(userId, project)
  if (!role) return false
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function canEditTask(userId: string, task: any, project: Project): boolean {
  const role = getUserRole(userId, project)
  if (!role) return false

  // Manager can edit any task
  if (role === "manager") return true

  // Member can only edit their own assigned tasks
  if (role === "member") {
    return task.assignees?.includes(userId) ?? false
  }

  return false
}

export function canDeleteTask(userId: string, project: Project): boolean {
  return hasPermission(userId, project, "delete_task")
}

export function canManageMembers(userId: string, project: Project): boolean {
  return hasPermission(userId, project, "manage_members")
}

export function canEditProject(userId: string, project: Project): boolean {
  return hasPermission(userId, project, "edit_project")
}

export function canDeleteProject(userId: string, project: Project): boolean {
  return hasPermission(userId, project, "delete_project")
}

export function canViewActivityLog(userId: string, project: Project): boolean {
  return hasPermission(userId, project, "view_activity_log")
}

export function canExportData(userId: string, project: Project): boolean {
  return hasPermission(userId, project, "export_data")
}
