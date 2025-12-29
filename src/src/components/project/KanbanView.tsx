"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Plus, CheckSquare } from "lucide-react"
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
    <div className="h-full p-6 lg:p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 h-full">
        {columns.map((column) => (
          <div key={column.id} className="flex flex-col min-h-0 bg-white rounded-2xl shadow-lg border-2 hover:shadow-xl transition-shadow">
            <div className={`${column.color} px-6 py-5 rounded-t-2xl border-b-2`}>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-base lg:text-lg">{column.title}</h3>
                <Badge variant="secondary" className="bg-white text-gray-800 font-bold px-3 py-1 text-sm shadow-sm">
                  {mainTasks.filter((task) => task.status === column.id).length}
                </Badge>
              </div>
            </div>
            <div
              className="flex-1 p-4 space-y-3 overflow-y-auto min-h-0"
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
                    className={`${isManager || task.assignees.includes(user.id) ? "cursor-move hover:scale-[1.02] transition-transform" : "cursor-not-allowed opacity-75"}`}
                  >
                    <TaskCard
                      task={task}
                      project={project}
                      allTasks={tasks}
                      user={user}
                      onClick={() => setSelectedTask(task)}
                      onUpdateTask={onUpdateTask}
                    />
                  </div>
                ))}

              {mainTasks.filter((task) => task.status === column.id).length === 0 && (
                <div className="text-center py-16 text-gray-400">
                  <div className="mb-3">
                    <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                      <CheckSquare className="w-8 h-8 text-gray-300" />
                    </div>
                  </div>
                  <p className="text-sm font-semibold">Không có nhiệm vụ</p>
                </div>
              )}

              {(isManager || true) && (
                <Button
                  variant="ghost"
                  className="w-full justify-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-all mt-auto py-7 rounded-xl font-semibold"
                  onClick={() => handleOpenCreate(column.id as Task["status"])}
                  disabled={!isManager}
                  title={isManager ? "Tạo nhiệm vụ mới" : "Chỉ quản lý mới có thể tạo nhiệm vụ"}
                >
                  <Plus className="w-5 h-5 mr-2" />
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
          mode="task"
          currentUserId={user.id}
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
