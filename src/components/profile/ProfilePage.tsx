import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Edit, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { User } from '../../types';

interface ProfilePageProps {
  user: User;
  onUpdateUser: (user: User) => Promise<void>;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}

export function ProfilePage({ user, onUpdateUser, onChangePassword }: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editedUser, setEditedUser] = useState(user);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSave = async () => {
    await onUpdateUser(editedUser);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedUser(user);
    setIsEditing(false);
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword) {
      toast.error('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsSubmitting(true);

    try {
      // Verify current password by re-authenticating
      // Use centralized password change function from auth hook
      const success = await onChangePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );

      if (success) {
        setIsChangingPassword(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Thông tin cá nhân</h1>
        <p className="text-gray-600 text-sm">Quản lý thông tin tài khoản của bạn</p>
      </div>

      <div className="space-y-4">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Thông tin tài khoản</CardTitle>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Chỉnh sửa
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="w-20 h-20">
                <AvatarImage src={editedUser.avatar} />
                <AvatarFallback className="text-xl">
                  {getInitials(editedUser.name)}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <div>
                  <Button variant="outline" size="sm">
                    Tải ảnh lên
                  </Button>
                  <p className="text-xs text-gray-500 mt-1">JPG, PNG. Tối đa 2MB</p>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Họ và tên</Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={editedUser.name}
                    onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                  />
                ) : (
                  <div className="text-sm py-2">{user.name}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={editedUser.email}
                    onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                  />
                ) : (
                  <div className="text-sm py-2">{user.email}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    type="tel"
                    value={editedUser.phone || ''}
                    onChange={(e) => setEditedUser({ ...editedUser, phone: e.target.value })}
                  />
                ) : (
                  <div className="text-sm py-2">{user.phone || 'Chưa cập nhật'}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label>ID Tài khoản</Label>
                <div className="text-sm py-2 text-gray-500">{user.id}</div>
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave}>Lưu thay đổi</Button>
                <Button variant="outline" onClick={handleCancel}>Hủy</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Card */}
        <Card>
          <CardHeader>
            <CardTitle>Bảo mật</CardTitle>
            <CardDescription>Quản lý mật khẩu và bảo mật tài khoản</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isChangingPassword} onOpenChange={setIsChangingPassword}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Lock className="w-4 h-4 mr-2" />
                  Đổi mật khẩu
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Đổi mật khẩu</DialogTitle>
                  <DialogDescription>
                    Nhập mật khẩu hiện tại và mật khẩu mới
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Mật khẩu mới</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmNewPassword">Xác nhận mật khẩu mới</Label>
                    <Input
                      id="confirmNewPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsChangingPassword(false)} disabled={isSubmitting}>
                    Hủy
                  </Button>
                  <Button onClick={handleChangePassword} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Đổi mật khẩu
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
