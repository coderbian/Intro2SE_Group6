"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Plus } from "lucide-react"
import { TaskDialog } from "./TaskDialog"
import { CreateTaskDialog } from "./CreateTaskDialog"
import { TaskCard } from "./TaskCard"
import type { User, Project, Task } from "../../App"
import { canEditTask } from "../../utils/permissions"

interface KanbanViewProps {
  user: User
  project: Project
  tasks: Task[]
  isManager: boolean
  onCreateTask: (task: Omit<Task, "id" | "createdAt" | "comments" | "attachments">) => void
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void
  onDeleteTask: (taskId: string) => void
  onAddComment: (taskId: string, content: string) => void
  onAddAttachment: (taskId: string, file: { name: string; url: string; type: string }) => void
}

const columns = [
  { id: "backlog", title: "Backlog", color: "bg-gray-100" },
  { id: "todo", title: "Cần làm", color: "bg-blue-100" },
  { id: "in-progress", title: "Đang làm", color: "bg-yellow-100" },
  { id: "done", title: "Hoàn thành", color: "bg-green-100" },
]

export function KanbanView({
  user,
  project,
  tasks,
  isManager,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onAddComment,
  onAddAttachment,
}: KanbanViewProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [createColumnStatus, setCreateColumnStatus] = useState<Task["status"]>("todo")

  // Filter out subtasks (they're shown inside parent tasks)
  const mainTasks = tasks.filter((t) => !t.parentTaskId)

  const handleOpenCreate = (status: Task["status"]) => {
    setCreateColumnStatus(status)
    setIsCreateDialogOpen(true)
  }

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("taskId", taskId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDropOnColumn = (e: React.DragEvent, targetStatus: Task["status"]) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData("taskId")

    const task = tasks.find((t) => t.id === taskId)
    if (task && task.status !== targetStatus) {
      // Check if user can edit this task
      if (canEditTask(user.id, task, project)) {
        onUpdateTask(taskId, { status: targetStatus })
      }
    }
  }

  return (
    <div className="h-full p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full">
        {columns.map((column) => (
          <div key={column.id} className="flex flex-col">
            <div className={`${column.color} p-4 rounded-t-lg`}>
              <div className="flex items-center justify-between">
                <span>{column.title}</span>
                <Badge variant="secondary">{mainTasks.filter((task) => task.status === column.id).length}</Badge>
              </div>
            </div>
            <div
              className="bg-white border border-t-0 rounded-b-lg p-4 flex-1 space-y-3 overflow-y-auto"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDropOnColumn(e, column.id as Task["status"])}
            >
              {mainTasks
                .filter((task) => task.status === column.id)
                .map((task) => (
                  <div
                    key={task.id}
                    draggable={isManager || task.assignees.includes(user.id)}
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className={isManager || task.assignees.includes(user.id) ? "cursor-move" : "cursor-not-allowed"}
                  >
                    <TaskCard
                      task={task}
                      project={project}
                      allTasks={tasks}
                      onClick={() => setSelectedTask(task)}
                      onUpdateTask={onUpdateTask}
                    />
                  </div>
                ))}

              {(isManager || true) && (
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-500"
                  onClick={() => handleOpenCreate(column.id as Task["status"])}
                  disabled={!isManager}
                  title={isManager ? "Create task" : "Only managers can create tasks"}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {isManager ? "Thêm nhiệm vụ" : "Không có quyền tạo"}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedTask && (
        <TaskDialog
          task={selectedTask}
          project={project}
          user={user}
          allTasks={tasks}
          isManager={isManager}
          onClose={() => setSelectedTask(null)}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          onCreateTask={onCreateTask}
          onAddComment={onAddComment}
          onAddAttachment={onAddAttachment}
        />
      )}

      {isCreateDialogOpen && (
        <CreateTaskDialog
          project={project}
          initialStatus={createColumnStatus}
          onClose={() => setIsCreateDialogOpen(false)}
          onCreateTask={(task) => {
            onCreateTask(task)
            setIsCreateDialogOpen(false)
          }}
        />
      )}
    </div>
  )
}
