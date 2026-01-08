import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AlertCircle, Trash2, Sparkles, Globe, Lock } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { toast } from 'sonner';
import type { Project } from '../../types';

interface ProjectSettingsProps {
  project: Project;
  onUpdateProject: (projectId: string, updates: Partial<Project>) => void;
  onDeleteProject: (projectId: string) => void;
  onMoveToTrash?: (projectId: string) => void;
}

export function ProjectSettings({
  project,
  onUpdateProject,
  onDeleteProject,
  onMoveToTrash,
}: ProjectSettingsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isEnhancingDescription, setIsEnhancingDescription] = useState(false);
  const [isEstimatingDeadline, setIsEstimatingDeadline] = useState(false);
  const [editedProject, setEditedProject] = useState({
    name: project.name,
    description: project.description,
    deadline: project.deadline,
    visibility: project.visibility || 'private' as 'public' | 'private',
  });

  const handleEnhanceDescription = async () => {
    if (!editedProject.description?.trim()) return;
    setIsEnhancingDescription(true);
    try {
      const { enhanceDescription } = await import('../../lib/aiService');
      const enhanced = await enhanceDescription(editedProject.description);
      setEditedProject({ ...editedProject, description: enhanced });
      toast.success('Đã cải thiện mô tả bằng AI!');
    } catch (error) {
      console.error('AI enhance error:', error);
      toast.error('Lỗi khi gọi AI');
    } finally {
      setIsEnhancingDescription(false);
    }
  };

  const handleEstimateDeadline = async () => {
    if (!editedProject.name?.trim() && !editedProject.description?.trim()) return;
    setIsEstimatingDeadline(true);
    try {
      const { estimateTime } = await import('../../lib/aiService');
      const days = await estimateTime(editedProject.name, editedProject.description || '');
      const suggestedDeadline = new Date();
      suggestedDeadline.setDate(suggestedDeadline.getDate() + days);
      setEditedProject({
        ...editedProject,
        deadline: suggestedDeadline.toISOString().split('T')[0],
      });
      toast.success(`AI đề xuất: ${days} ngày để hoàn thành`);
    } catch (error) {
      console.error('AI estimate error:', error);
      toast.error('Lỗi khi ước tính thời gian');
    } finally {
      setIsEstimatingDeadline(false);
    }
  };

  const handleSave = () => {
    if (!editedProject.name.trim()) {
      toast.error('Tên dự án không được để trống');
      return;
    }

    if (!editedProject.deadline) {
      toast.error('Deadline không được để trống');
      return;
    }

    onUpdateProject(project.id, editedProject);
    setIsEditing(false);
    toast.success('Cập nhật dự án thành công!');
  };

  const handleCancel = () => {
    setEditedProject({
      name: project.name,
      description: project.description,
      deadline: project.deadline,
      visibility: project.visibility || 'private',
    });
    setIsEditing(false);
  };

  const handleMoveToTrash = () => {
    if (onMoveToTrash) {
      onMoveToTrash(project.id);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Thông tin dự án</CardTitle>
              <CardDescription>
                Quản lý thông tin cơ bản của dự án
              </CardDescription>
            </div>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)}>Chỉnh sửa</Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projectName">Tên dự án *</Label>
            {isEditing ? (
              <Input
                id="projectName"
                value={editedProject.name}
                onChange={(e) => setEditedProject({ ...editedProject, name: e.target.value })}
              />
            ) : (
              <div className="text-sm py-2">{project.name}</div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Mô tả</Label>
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleEnhanceDescription}
                  disabled={isEnhancingDescription || !editedProject.description}
                  className="gap-1.5 h-7 text-xs"
                >
                  <Sparkles className="w-3 h-3" />
                  {isEnhancingDescription ? 'Đang xử lý...' : 'AI Cải thiện'}
                </Button>
              )}
            </div>
            {isEditing ? (
              <Textarea
                id="description"
                value={editedProject.description}
                onChange={(e) => setEditedProject({ ...editedProject, description: e.target.value })}
                rows={4}
                className="max-h-40 overflow-y-auto resize-none"
              />
            ) : (
              <div className="text-sm py-2 text-gray-700">
                {project.description || 'Không có mô tả'}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="deadline">Deadline *</Label>
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleEstimateDeadline}
                  disabled={isEstimatingDeadline || (!editedProject.name && !editedProject.description)}
                  className="gap-1.5 h-7 text-xs"
                >
                  <Sparkles className="w-3 h-3" />
                  {isEstimatingDeadline ? 'Đang ước tính...' : 'AI Ước tính'}
                </Button>
              )}
            </div>
            {isEditing ? (
              <Input
                id="deadline"
                type="date"
                value={editedProject.deadline || ''}
                onChange={(e) => setEditedProject({ ...editedProject, deadline: e.target.value })}
              />
            ) : (
              <div className="text-sm py-2">
                {project.deadline ? new Date(project.deadline).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                }) : 'Chưa đặt'}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Template</Label>
            <div className="text-sm py-2">
              {project.template === 'kanban' ? 'Kanban Board' : 'Scrum Board'}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Khả năng hiển thị</Label>
            {isEditing ? (
              <Select
                value={editedProject.visibility}
                onValueChange={(value: string) =>
                  setEditedProject({ ...editedProject, visibility: value as 'public' | 'private' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Riêng tư
                    </div>
                  </SelectItem>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Công khai
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="text-sm py-2 flex items-center gap-2">
                {project.visibility === 'public' ? (
                  <>
                    <Globe className="w-4 h-4 text-green-600" />
                    <span>Công khai</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-gray-500" />
                    <span>Riêng tư</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Ngày tạo</Label>
            <div className="text-sm py-2 text-gray-600">
              {new Date(project.createdAt).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
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

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Vùng nguy hiểm</CardTitle>
          <CardDescription>
            Hành động cần cân nhắc kỹ
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Chuyển dự án vào thùng rác sẽ ẩn dự án khỏi danh sách. Bạn có thể khôi phục hoặc xóa vĩnh viễn trong Thùng rác.
            </AlertDescription>
          </Alert>

          <Button
            variant="destructive"
            onClick={handleMoveToTrash}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Chuyển vào thùng rác
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
