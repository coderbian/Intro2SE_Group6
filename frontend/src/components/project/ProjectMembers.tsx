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
import { UserPlus, Trash2, Crown, Loader2 } from 'lucide-react'
import { toast } from "sonner"
import type { User, Project } from "../../types"
import { getSupabaseClient } from "../../lib/supabase-client"

const supabase = getSupabaseClient()

interface ProjectMembersProps {
  user: User
  project: Project
  isManager: boolean
  onUpdateProject: (projectId: string, updates: Partial<Project>) => void
  onSendInvitation: (projectId: string, email: string) => Promise<{ success: boolean; error?: string }>
}

export function ProjectMembers({ user, project, isManager, onUpdateProject, onSendInvitation }: ProjectMembersProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [emailToAdd, setEmailToAdd] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleAddMember = async () => {
    if (!emailToAdd.trim()) {
      toast.error("Vui lòng nhập email")
      return
    }

    // Không thể mời chính mình
    if (emailToAdd.trim().toLowerCase() === user.email.toLowerCase()) {
      toast.error("Bạn đã là thành viên của dự án")
      return
    }

    setIsLoading(true)

    try {
      // 1. Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(emailToAdd.trim())) {
        toast.error("Email không hợp lệ")
        setIsLoading(false)
        return
      }

      // 2. Send invitation using useProjects hook (will check if user exists)
      const inviteResult = await onSendInvitation(project.id, emailToAdd.trim())

      if (!inviteResult.success) {
        toast.error(inviteResult.error || "Không thể gửi lời mời")
        setIsLoading(false)
        return
      }

      // 3. Success toast is shown by handleSendInvitation
      // Members will be updated when invitation is accepted
      setEmailToAdd("")
      setIsAddDialogOpen(false)
    } catch (err: any) {
      console.error("Error adding member:", err)
      toast.error("Có lỗi xảy ra: " + (err.message || "Unknown error"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (userId === project.ownerId) {
      toast.error("Không thể xóa chủ sở hữu dự án!")
      return
    }

    if (!confirm("Bạn có chắc muốn xóa thành viên này?")) {
      return
    }

    try {
      // Xóa khỏi database
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', project.id)
        .eq('user_id', userId)

      if (error) throw error

      // Update UI
      const updatedMembers = project.members.filter((m) => m.userId !== userId)
      onUpdateProject(project.id, { members: updatedMembers })
      toast.success("Đã xóa thành viên!")
    } catch (err: any) {
      console.error("Error removing member:", err)
      toast.error("Không thể xóa thành viên: " + err.message)
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
                        disabled={isLoading}
                      />
                      <p className="text-xs text-gray-500">
                        Nhập email của người dùng đã đăng ký trong hệ thống
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddDialogOpen(false)}
                      disabled={isLoading}
                    >
                      Hủy
                    </Button>
                    <Button 
                      onClick={handleAddMember}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        "Thêm"
                      )}
                    </Button>
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
                    <Badge variant={isOwner ? "default" : "secondary"}>
                      {isOwner ? "Project Manager" : "Team Member"}
                    </Badge>
                    {isManager && !isOwner && !isCurrentUser && (
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveMember(member.userId)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
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