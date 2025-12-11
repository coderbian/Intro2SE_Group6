"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Settings, Users, AlertCircle } from 'lucide-react'
import { KanbanView } from "./KanbanView"
import { ScrumView } from "./ScrumView"
import { ProjectSettings } from "./ProjectSettings"
import { ProjectMembers } from "./ProjectMembers"
import { Alert, AlertDescription } from "../ui/alert"
import type { User, Project, Task } from "../../App"

interface ProjectPageProps {
  user: User
  project: Project
  tasks: Task[]
  onUpdateProject: (projectId: string, updates: Partial<Project>) => void
  onDeleteProject: (projectId: string) => void
  onCreateTask: (task: Omit<Task, "id" | "createdAt" | "comments" | "attachments">) => void
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void
  onDeleteTask: (taskId: string) => void
  onAddComment: (taskId: string, content: string) => void
  onAddAttachment: (taskId: string, file: { name: string; url: string; type: string }) => void
}

export function ProjectPage({
  user,
  project,
  tasks,
  onUpdateProject,
  onDeleteProject,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onAddComment,
  onAddAttachment,
}: ProjectPageProps) {
  const [activeTab, setActiveTab] = useState("board")

  const userMember = project.members.find((m) => m.userId === user.id)
  const isManager = userMember?.role === "manager"
  const isMember = userMember?.role === "member"

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Project Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-1">{project.name}</h1>
            {project.description && <p className="text-sm text-gray-600">{project.description}</p>}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Deadline: {new Date(project.deadline).toLocaleDateString("vi-VN")}
            </span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
              {isManager ? "Project Manager" : "Team Member"}
            </span>
          </div>
        </div>
      </div>

      {/* Permission Warning for Members */}
      {isMember && (
        <Alert className="mx-6 mt-4 bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Bạn có quyền hạn chế như thành viên. Liên hệ quản lý dự án để nhận quyền cao hơn.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="bg-white border-b px-6">
          <TabsList className="border-0">
            <TabsTrigger value="board">Bảng</TabsTrigger>
            <TabsTrigger value="members">
              <Users className="w-4 h-4 mr-2" />
              Thành viên ({project.members.length})
            </TabsTrigger>
            {isManager && (
              <TabsTrigger value="settings">
                <Settings className="w-4 h-4 mr-2" />
                Cài đặt
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto">
          <TabsContent value="board" className="m-0 h-full">
            {project.template === "kanban" ? (
              <KanbanView
                user={user}
                project={project}
                tasks={tasks}
                isManager={isManager}
                onCreateTask={onCreateTask}
                onUpdateTask={onUpdateTask}
                onDeleteTask={onDeleteTask}
                onAddComment={onAddComment}
                onAddAttachment={onAddAttachment}
              />
            ) : (
              <ScrumView
                user={user}
                project={project}
                tasks={tasks}
                isManager={isManager}
                onCreateTask={onCreateTask}
                onUpdateTask={onUpdateTask}
                onDeleteTask={onDeleteTask}
                onAddComment={onAddComment}
                onAddAttachment={onAddAttachment}
              />
            )}
          </TabsContent>

          <TabsContent value="members" className="m-0">
            <ProjectMembers user={user} project={project} isManager={isManager} onUpdateProject={onUpdateProject} />
          </TabsContent>

          {isManager && (
            <TabsContent value="settings" className="m-0">
              <ProjectSettings project={project} onUpdateProject={onUpdateProject} onDeleteProject={onDeleteProject} />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  )
}
