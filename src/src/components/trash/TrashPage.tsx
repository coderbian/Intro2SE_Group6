"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Alert, AlertDescription } from "../ui/alert"
import { Trash2, RotateCcw, AlertTriangle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog"
import { toast } from "sonner@2.0.3"
import type { Project, Task } from "../../App"

interface TrashPageProps {
  projects: Project[]
  tasks: Task[]
  onRestoreProject: (projectId: string) => void
  onPermanentlyDeleteProject: (projectId: string) => void
  onRestoreTask: (taskId: string) => void
  onPermanentlyDeleteTask: (taskId: string) => void
}

export function TrashPage({
  projects,
  tasks,
  onRestoreProject,
  onPermanentlyDeleteProject,
  onRestoreTask,
  onPermanentlyDeleteTask,
}: TrashPageProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "project" | "task"; id: string } | null>(null)

  const deletedProjects = projects.filter((p) => p.deletedAt)
  const deletedTasks = tasks.filter((t) => t.deletedAt)

  const handlePermanentDelete = (type: "project" | "task", id: string) => {
    if (type === "project") {
      onPermanentlyDeleteProject(id)
    } else {
      onPermanentlyDeleteTask(id)
    }
    setDeleteConfirm(null)
    toast.success("Đã xóa vĩnh viễn")
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Trash2 className="w-5 h-5 text-red-600" />
          <h1 className="text-2xl font-bold">Thùng rác</h1>
        </div>
        <p className="text-gray-600 text-sm">Quản lý các dự án và nhiệm vụ đã xóa. Chúng sẽ bị xóa vĩnh viễn sau 30 ngày.</p>
      </div>

      {deletedProjects.length === 0 && deletedTasks.length === 0 && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertDescription className="text-blue-900">Thùng rác trống</AlertDescription>
        </Alert>
      )}

      {/* Deleted Projects */}
      {deletedProjects.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Dự án đã xóa ({deletedProjects.length})</h2>
          <div className="grid gap-4">
            {deletedProjects.map((project) => (
              <Card key={project.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{project.name}</CardTitle>
                      <CardDescription>{project.description}</CardDescription>
                    </div>
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                      {project.template === "kanban" ? "Kanban" : "Scrum"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Xóa vào: {new Date(project.deletedAt!).toLocaleDateString("vi-VN")}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => onRestoreProject(project.id)}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Khôi phục
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteConfirm({ type: "project", id: project.id })}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Xóa vĩnh viễn
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Deleted Tasks */}
      {deletedTasks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Nhiệm vụ đã xóa ({deletedTasks.length})</h2>
          <div className="grid gap-4">
            {deletedTasks.map((task) => (
              <Card key={task.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{task.title}</CardTitle>
                      <CardDescription>{task.description}</CardDescription>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        task.priority === "urgent"
                          ? "bg-red-100 text-red-700"
                          : task.priority === "high"
                            ? "bg-orange-100 text-orange-700"
                            : task.priority === "medium"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Xóa vào: {new Date(task.deletedAt!).toLocaleDateString("vi-VN")}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => onRestoreTask(task.id)}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Khôi phục
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteConfirm({ type: "task", id: task.id })}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Xóa vĩnh viễn
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Alert className="mt-8 border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-900">
          Các mục bị xóa sẽ tự động xóa vĩnh viễn sau 30 ngày nếu không được khôi phục.
        </AlertDescription>
      </Alert>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa vĩnh viễn?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể được hoàn tác. Vật phẩm sẽ bị xóa vĩnh viễn khỏi hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction
            onClick={() => deleteConfirm && handlePermanentDelete(deleteConfirm.type, deleteConfirm.id)}
            className="bg-red-600 hover:bg-red-700"
          >
            Xóa vĩnh viễn
          </AlertDialogAction>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
