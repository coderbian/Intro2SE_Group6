"use client"

import { Badge } from "../ui/badge"
import { Clock, MessageSquare, Paperclip, CheckSquare, ChevronRight } from "lucide-react"
import { Button } from "../ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"
import type { Project, Task } from "../../App"

interface TaskCardProps {
  task: Task
  project: Project
  allTasks: Task[]
  onClick: () => void
  showStoryPoints?: boolean
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void
}

export function TaskCard({ task, project, allTasks, onClick, showStoryPoints, onUpdateTask }: TaskCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500"
      case "high":
        return "bg-orange-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "Khẩn cấp"
      case "high":
        return "Cao"
      case "medium":
        return "Trung bình"
      case "low":
        return "Thấp"
      default:
        return priority
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "backlog":
        return "Backlog"
      case "todo":
        return "Cần làm"
      case "in-progress":
        return "Đang làm"
      case "done":
        return "Hoàn thành"
      default:
        return status
    }
  }

  const subtasks = allTasks.filter((t) => t.parentTaskId === task.id)
  const completedSubtasks = subtasks.filter((t) => t.status === "done").length

  const assigneeNames = task.assignees.map((userId) => {
    const member = project.members.find((m) => m.userId === userId)
    return member?.name || "Unknown"
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    })
  }

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== "done"

  const handleStatusChange = (newStatus: Task["status"]) => {
    if (onUpdateTask) {
      onUpdateTask(task.id, { status: newStatus })
    }
  }

  return (
    <div className="bg-white border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <div className="flex items-start gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full mt-1.5 ${getPriorityColor(task.priority)}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm mb-1 break-words">{task.title}</p>
          {task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {task.labels.map((label, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {label}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {task.description && <p className="text-xs text-gray-600 mb-2 line-clamp-2">{task.description}</p>}

      <div className="flex items-center justify-between text-xs mb-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {getPriorityLabel(task.priority)}
          </Badge>
          {showStoryPoints && task.storyPoints && (
            <Badge variant="secondary" className="text-xs">
              {task.storyPoints} pts
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 text-gray-500">
          {subtasks.length > 0 && (
            <div className="flex items-center gap-1">
              <CheckSquare className="w-3 h-3" />
              <span>
                {completedSubtasks}/{subtasks.length}
              </span>
            </div>
          )}
          {task.comments.length > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              <span>{task.comments.length}</span>
            </div>
          )}
          {task.attachments.length > 0 && (
            <div className="flex items-center gap-1">
              <Paperclip className="w-3 h-3" />
              <span>{task.attachments.length}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-2 pt-2 border-t gap-2">
        <span className="text-gray-500 truncate text-xs">
          {assigneeNames.length > 0 ? assigneeNames.join(", ") : "Chưa phân công"}
        </span>
        <div className="flex items-center gap-1">
          {task.deadline && (
            <div className={`flex items-center gap-1 text-xs ${isOverdue ? "text-red-600" : "text-gray-600"}`}>
              <Clock className="w-3 h-3" />
              <span>{formatDate(task.deadline)}</span>
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-6 px-1.5" title="Update status">
                <span className="text-xs font-medium">{getStatusLabel(task.status)}</span>
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => handleStatusChange("backlog")}>Backlog</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange("todo")}>Cần làm</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange("in-progress")}>Đang làm</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange("done")}>Hoàn thành</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
