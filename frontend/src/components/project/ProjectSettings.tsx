import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { AlertCircle, Trash2, Sparkles } from 'lucide-react';
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
    });
    setIsEditing(false);
  };

  const handleMoveToTrash = () => {
    if (onMoveToTrash) {
      onMoveToTrash(project.id);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* General Settings */}
      <Card className="shadow-md border-2 border-blue-100 hover:shadow-xl transition-shadow">
        <CardHeader className="border-b-2 border-blue-100 bg-gradient-to-r from-blue-50 via-white to-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Sparkles className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">Thông tin dự án</CardTitle>
                <CardDescription className="text-sm mt-0.5 text-gray-600">
                  Quản lý thông tin cơ bản của dự án
                </CardDescription>
              </div>
            </div>
            {!isEditing && (
              <Button size="sm" onClick={() => setIsEditing(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">Chỉnh sửa</Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div className="space-y-2">
            <Label htmlFor="projectName" className="text-sm font-semibold text-gray-700">Tên dự án *</Label>
            {isEditing ? (
              <Input
                id="projectName"
                value={editedProject.name}
                onChange={(e) => setEditedProject({ ...editedProject, name: e.target.value })}
                className="border-2 focus:border-blue-500"
              />
            ) : (
              <div className="text-sm py-1.5 px-2.5 bg-gray-50 rounded-lg border border-gray-200">{project.name}</div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description" className="text-sm font-semibold text-gray-700">Mô tả</Label>
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleEnhanceDescription}
                  disabled={isEnhancingDescription || !editedProject.description}
                  className="gap-1.5 h-7 text-xs border-purple-200 hover:bg-purple-50"
                >
                  <Sparkles className="w-3 h-3 text-purple-600" />
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
                className="max-h-32 overflow-y-auto resize-none border-2 focus:border-blue-500 text-sm"
              />
            ) : (
              <div className="text-sm py-1.5 px-2.5 bg-gray-50 rounded-lg border border-gray-200 text-gray-700 min-h-[60px]">
                {project.description || 'Không có mô tả'}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="deadline" className="text-sm font-semibold text-gray-700">Deadline *</Label>
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleEstimateDeadline}
                  disabled={isEstimatingDeadline || (!editedProject.name && !editedProject.description)}
                  className="gap-1.5 h-7 text-xs border-purple-200 hover:bg-purple-50"
                >
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  {isEstimatingDeadline ? 'Đang ước tính...' : 'AI Ước tính'}
                </Button>
              )}
            </div>
            {isEditing ? (
              <Input
                id="deadline"
                type="date"
                value={editedProject.deadline}
                onChange={(e) => setEditedProject({ ...editedProject, deadline: e.target.value })}
                className="border-2 focus:border-blue-500"
              />
            ) : (
              <div className="text-sm py-1.5 px-2.5 bg-gray-50 rounded-lg border border-gray-200">
                {new Date(project.deadline).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Template</Label>
            <div className="text-sm py-1.5 px-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 font-medium text-blue-700">
              {project.template === 'kanban' ? 'Kanban Board' : 'Scrum Board'}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Ngày tạo</Label>
            <div className="text-sm py-1.5 px-2.5 bg-gray-50 rounded-lg border border-gray-200 text-gray-600">
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
            <div className="flex gap-2 pt-3 border-t border-gray-200">
              <Button size="sm" onClick={handleSave} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg">Lưu thay đổi</Button>
              <Button size="sm" variant="outline" onClick={handleCancel} className="border-2">Hủy</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-2 border-red-200 shadow-md hover:shadow-xl transition-shadow">
        <CardHeader className="border-b-2 border-red-100 bg-gradient-to-r from-red-50 via-white to-red-50 py-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-red-600">Vùng nguy hiểm</CardTitle>
              <CardDescription className="text-sm mt-0.5 text-gray-600">
                Hành động cần cân nhắc kỹ
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 p-4">
          <Alert className="border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 py-2">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-xs text-gray-700">
              Chuyển dự án vào thùng rác sẽ ẩn dự án khỏi danh sách. Bạn có thể khôi phục hoặc xóa vĩnh viễn trong Thùng rác.
            </AlertDescription>
          </Alert>

          <Button
            size="sm"
            variant="destructive"
            onClick={handleMoveToTrash}
            className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-lg gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Chuyển vào thùng rác
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
