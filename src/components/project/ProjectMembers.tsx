"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Avatar, AvatarFallback } from "../ui/avatar"
import { Badge } from "../ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { UserPlus, Trash2, Crown, MoreVertical, Shield, User } from 'lucide-react'
import { toast } from "sonner"
import type { User as UserType, Project } from "../../types"

interface ProjectMembersProps {
  user: UserType
  project: Project
  isManager: boolean
  onUpdateProject: (projectId: string, updates: Partial<Project>) => void
}

export function ProjectMembers({ user, project, isManager, onUpdateProject }: ProjectMembersProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [emailToAdd, setEmailToAdd] = useState("")

  const handleAddMember = () => {
    if (!emailToAdd.trim()) {
      toast.error("Vui lòng nhập email")
      return
    }

    const mockUser = {
      userId: Math.random().toString(36).substr(2, 9),
      name: emailToAdd.split("@")[0],
      email: emailToAdd,
      role: "member" as const,
    }

    const updatedMembers = [...project.members, mockUser]
    onUpdateProject(project.id, { members: updatedMembers })

    setEmailToAdd("")
    setIsAddDialogOpen(false)
    toast.success(`Đã thêm ${mockUser.name} vào dự án!`)
  }

  const handleRemoveMember = (userId: string) => {
    if (userId === project.ownerId) {
      toast.error("Không thể xóa chủ sở hữu dự án!")
      return
    }

    if (confirm("Bạn có chắc muốn xóa thành viên này?")) {
      const updatedMembers = project.members.filter((m) => m.userId !== userId)
      onUpdateProject(project.id, { members: updatedMembers })
      toast.success("Đã xóa thành viên!")
    }
  }

  const handleChangeRole = async (userId: string, newRole: 'manager' | 'member') => {
    if (userId === project.ownerId) {
      toast.error("Không thể thay đổi quyền của chủ sở hữu dự án!")
      return
    }

    try {
      const { updateMemberRole } = await import('../../services/projectService')
      await updateMemberRole(project.id, userId, newRole)

      // Update local state
      const updatedMembers = project.members.map((m) =>
        m.userId === userId ? { ...m, role: newRole } : m
      )
      onUpdateProject(project.id, { members: updatedMembers })
      toast.success(newRole === 'manager' ? 'Đã thăng cấp thành Project Manager!' : 'Đã chuyển về Team Member!')
    } catch (error) {
      console.error('Error updating member role:', error)
      toast.error('Không thể thay đổi quyền thành viên')
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Thành viên dự án</CardTitle>
              <CardDescription>Quản lý người tham gia vào dự án</CardDescription>
            </div>
            {isManager && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Thêm thành viên
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Thêm thành viên mới</DialogTitle>
                    <DialogDescription>Nhập email để mời người dùng vào dự án</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        value={emailToAdd}
                        onChange={(e) => setEmailToAdd(e.target.value)}
                      />
                      <p className="text-xs text-gray-500">Demo: Nhập bất kỳ email nào để mô phỏng thêm thành viên</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Hủy
                    </Button>
                    <Button onClick={handleAddMember}>Thêm</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {project.members.map((member) => {
              const isOwner = member.userId === project.ownerId
              const isCurrentUser = member.userId === user.id

              return (
                <div key={member.userId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span>{member.name}</span>
                        {isOwner && (
                          <span title="Project Manager">
                            <Crown className="w-4 h-4 text-yellow-600" />
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-600">{member.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={member.role === 'manager' ? "default" : "secondary"}>
                      {member.role === 'manager' ? "Project Manager" : "Team Member"}
                    </Badge>
                    {isManager && !isOwner && !isCurrentUser && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {member.role === 'member' ? (
                            <DropdownMenuItem onClick={() => handleChangeRole(member.userId, 'manager')}>
                              <Shield className="w-4 h-4 mr-2 text-blue-600" />
                              Thăng cấp làm PM
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleChangeRole(member.userId, 'member')}>
                              <User className="w-4 h-4 mr-2" />
                              Chuyển về Team Member
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleRemoveMember(member.userId)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Xóa khỏi dự án
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {project.members.length === 1 && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">Chỉ có bạn trong dự án này</p>
              <p className="text-xs mt-1">Thêm thành viên để cộng tác hiệu quả hơn</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Hướng dẫn quyền hạn</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Crown className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Project Manager</p>
                <p className="text-xs text-gray-600">Có thể tạo/sửa/xóa nhiệm vụ, quản lý thành viên, xóa dự án</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <UserPlus className="w-5 h-5 text-gray-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Team Member</p>
                <p className="text-xs text-gray-600">Có thể tạo/sửa nhiệm vụ, xem dự án</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
