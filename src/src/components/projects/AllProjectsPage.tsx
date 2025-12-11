"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Input } from "../ui/input"
import { Search, FolderKanban, Users, Calendar, LogIn } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog"
import { toast } from "sonner@2.0.3"
import type { Project, User } from "../../App"

interface AllProjectsPageProps {
  user: User
  projects: Project[]
  onSelectProject: (projectId: string) => void
  onCreateJoinRequest: (projectId: string) => void
}

export function AllProjectsPage({ user, projects, onSelectProject, onCreateJoinRequest }: AllProjectsPageProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  const userProjectIds = new Set(
    projects.filter((p) => p.members.some((m) => m.userId === user.id) || p.ownerId === user.id).map((p) => p.id),
  )
  const availableProjects = projects.filter((p) => !p.deletedAt && !userProjectIds.has(p.id))

  const filteredProjects = availableProjects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="mb-2">Khám phá dự án</h1>
        <p className="text-gray-600">Xem tất cả các dự án hiện có và tham gia vào những dự án bạn quan tâm</p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Tìm kiếm dự án..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderKanban className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600">
              {availableProjects.length === 0 ? "Không có dự án nào khả dụng" : "Không tìm thấy dự án phù hợp"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedProject(project)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {project.description || "Không có mô tả"}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{project.template}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    {project.members.length} thành viên
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    Deadline: {new Date(project.deadline).toLocaleDateString("vi-VN")}
                  </div>
                  <Button
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      onCreateJoinRequest(project.id)
                      toast.success("Đã gửi yêu cầu tham gia dự án")
                    }}
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Yêu cầu tham gia
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Project Detail Modal */}
      {selectedProject && (
        <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedProject.name}</DialogTitle>
              <DialogDescription>{selectedProject.description}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-2">Thông tin dự án</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Loại:</span>
                    <Badge>{selectedProject.template}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Thành viên:</span>
                    <span>{selectedProject.members.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Deadline:</span>
                    <span>{new Date(selectedProject.deadline).toLocaleDateString("vi-VN")}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Thành viên hiện tại</h4>
                <div className="space-y-2">
                  {selectedProject.members.slice(0, 5).map((member) => (
                    <div key={member.userId} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                      <Badge variant="secondary">{member.role}</Badge>
                    </div>
                  ))}
                  {selectedProject.members.length > 5 && (
                    <p className="text-xs text-gray-500">+{selectedProject.members.length - 5} thành viên khác</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={() => {
                    onCreateJoinRequest(selectedProject.id)
                    setSelectedProject(null)
                    toast.success("Đã gửi yêu cầu tham gia dự án")
                  }}
                  className="flex-1"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Yêu cầu tham gia
                </Button>
                <Button variant="outline" onClick={() => setSelectedProject(null)} className="flex-1">
                  Đóng
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
