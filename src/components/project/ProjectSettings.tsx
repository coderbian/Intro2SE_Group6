import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { AlertCircle, Trash2 } from 'lucide-react';
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
  const [editedProject, setEditedProject] = useState({
    name: project.name,
    description: project.description,
    deadline: project.deadline,
  });

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
            <Label htmlFor="description">Mô tả</Label>
            {isEditing ? (
              <Textarea
                id="description"
                value={editedProject.description}
                onChange={(e) => setEditedProject({ ...editedProject, description: e.target.value })}
                rows={4}
              />
            ) : (
              <div className="text-sm py-2 text-gray-700">
                {project.description || 'Không có mô tả'}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline *</Label>
            {isEditing ? (
              <Input
                id="deadline"
                type="date"
                value={editedProject.deadline}
                onChange={(e) => setEditedProject({ ...editedProject, deadline: e.target.value })}
              />
            ) : (
              <div className="text-sm py-2">
                {new Date(project.deadline).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
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
