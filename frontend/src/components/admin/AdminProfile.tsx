"use client"

import { useState } from "react"
import { User, Mail, Shield, Calendar, Loader2, Save, Lock, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { AdminLayout } from "../layout/AdminLayout"
import { getSupabaseClient } from "../../lib/supabase-client"

interface AdminProfileProps {
    adminEmail?: string
    onNavigate: (page: 'dashboard' | 'users' | 'roles' | 'projects') => void
    onLogout?: () => void
}

export function AdminProfile({ adminEmail, onNavigate, onLogout }: AdminProfileProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const adminUsername = adminEmail ? adminEmail.split('@')[0] : 'Admin'
    const adminAvatarFallback = adminUsername.substring(0, 2).toUpperCase()

    const [formData, setFormData] = useState({
        name: adminUsername,
        email: adminEmail || '',
    })

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    })

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 500))
            toast.success('Đã lưu thông tin thành công')
            setIsEditing(false)
        } catch {
            toast.error('Không thể lưu thông tin')
        } finally {
            setIsSaving(false)
        }
    }

    const handleChangePassword = async () => {
        // Validate
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            toast.error('Vui lòng điền đầy đủ thông tin')
            return
        }

        if (passwordData.newPassword.length < 6) {
            toast.error('Mật khẩu mới phải có ít nhất 6 ký tự')
            return
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp')
            return
        }

        setIsChangingPassword(true)
        try {
            const supabase = getSupabaseClient()
            const { error } = await supabase.auth.updateUser({
                password: passwordData.newPassword
            })

            if (error) throw error

            toast.success('Đã đổi mật khẩu thành công')
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Không thể đổi mật khẩu'
            toast.error(message)
        } finally {
            setIsChangingPassword(false)
        }
    }

    return (
        <AdminLayout
            adminEmail={adminEmail}
            onNavigate={onNavigate}
            onLogout={onLogout}
            pageTitle="Thông tin cá nhân"
        >
            <div className="container mx-auto px-4 lg:px-6 py-6 max-w-3xl space-y-6">
                {/* Profile Card */}
                <Card className="border shadow-md">
                    <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 border-b">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16 ring-4 ring-violet-200">
                                    <AvatarImage src="/placeholder.svg" />
                                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white font-bold text-xl">
                                        {adminAvatarFallback}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="text-xl font-bold text-gray-900">{formData.name}</CardTitle>
                                    <CardDescription className="text-sm">{formData.email}</CardDescription>
                                    <Badge className="mt-2 bg-violet-100 text-violet-700 hover:bg-violet-100">
                                        <Shield className="w-3 h-3 mr-1" />
                                        Quản trị viên
                                    </Badge>
                                </div>
                            </div>
                            {!isEditing ? (
                                <Button
                                    variant="outline"
                                    onClick={() => setIsEditing(true)}
                                    className="border-violet-200 text-violet-700 hover:bg-violet-50"
                                >
                                    Chỉnh sửa
                                </Button>
                            ) : (
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                                        Hủy
                                    </Button>
                                    <Button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="bg-violet-600 hover:bg-violet-700"
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                        Lưu
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-6">
                            {/* Name Field */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-gray-700">
                                    <User className="w-4 h-4" />
                                    Họ và tên
                                </Label>
                                {isEditing ? (
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                ) : (
                                    <div className="p-2 bg-gray-50 rounded-md text-gray-900">{formData.name}</div>
                                )}
                            </div>

                            {/* Email Field */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-gray-700">
                                    <Mail className="w-4 h-4" />
                                    Email
                                </Label>
                                <div className="p-2 bg-gray-50 rounded-md text-gray-900">{formData.email}</div>
                                <p className="text-xs text-gray-500">Email không thể thay đổi</p>
                            </div>

                            {/* Role Field */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-gray-700">
                                    <Shield className="w-4 h-4" />
                                    Vai trò
                                </Label>
                                <div className="p-2 bg-gray-50 rounded-md text-gray-900">Quản trị viên (Admin)</div>
                            </div>

                            {/* Created Date */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-gray-700">
                                    <Calendar className="w-4 h-4" />
                                    Ngày tạo tài khoản
                                </Label>
                                <div className="p-2 bg-gray-50 rounded-md text-gray-900">
                                    {new Date().toLocaleDateString('vi-VN')}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Change Password Card */}
                <Card className="border shadow-md">
                    <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b">
                        <div className="flex items-center gap-2">
                            <Lock className="w-5 h-5 text-orange-600" />
                            <div>
                                <CardTitle className="text-lg font-bold text-gray-900">Đổi mật khẩu</CardTitle>
                                <CardDescription>Cập nhật mật khẩu đăng nhập của bạn</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            {/* Current Password */}
                            <div className="space-y-2">
                                <Label className="text-gray-700">Mật khẩu hiện tại</Label>
                                <div className="relative">
                                    <Input
                                        type={showCurrentPassword ? "text" : "password"}
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        placeholder="Nhập mật khẩu hiện tại"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* New Password */}
                            <div className="space-y-2">
                                <Label className="text-gray-700">Mật khẩu mới</Label>
                                <div className="relative">
                                    <Input
                                        type={showNewPassword ? "text" : "password"}
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <Label className="text-gray-700">Xác nhận mật khẩu mới</Label>
                                <div className="relative">
                                    <Input
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        placeholder="Nhập lại mật khẩu mới"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <Button
                                onClick={handleChangePassword}
                                disabled={isChangingPassword}
                                className="w-full bg-orange-600 hover:bg-orange-700"
                            >
                                {isChangingPassword ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Đang đổi mật khẩu...
                                    </>
                                ) : (
                                    <>
                                        <Lock className="w-4 h-4 mr-2" />
                                        Đổi mật khẩu
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    )
}
