import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Sparkles, X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import type { Project, Task } from '../../App';

interface CreateTaskDialogProps {
  project: Project;
  initialStatus: Task['status'];
  isScrum?: boolean;
  onClose: () => void;
  onCreateTask: (task: Omit<Task, 'id' | 'createdAt' | 'comments' | 'attachments'>) => void;
}

export function CreateTaskDialog({
  project,
  initialStatus,
  isScrum,
  onClose,
  onCreateTask,
}: CreateTaskDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    status: initialStatus,
    assignees: [] as string[],
    deadline: '',
    labels: [] as string[],
    storyPoints: 5,
  });
  const [newLabel, setNewLabel] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast.error('Vui lòng nhập tên nhiệm vụ');
      return;
    }

    onCreateTask({
      projectId: project.id,
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      status: formData.status,
      assignees: formData.assignees,
      deadline: formData.deadline || undefined,
      labels: formData.labels,
      storyPoints: isScrum ? formData.storyPoints : undefined,
      createdBy: project.ownerId, // This should be current user
    });
  };

  const handleEnhanceDescription = () => {
    setIsEnhancing(true);
    
    // Mock AI enhancement
    setTimeout(() => {
      const enhanced = `### Mô tả chi tiết\n\n${formData.description}\n\n### Yêu cầu\n- Phân tích và hiểu rõ yêu cầu nghiệp vụ\n- Thiết kế giải pháp phù hợp\n- Implement và test kỹ lưỡng\n\n### Tiêu chí hoàn thành\n- Code được review và approve\n- Test cases pass 100%\n- Documentation đầy đủ`;
      
      setFormData({ ...formData, description: enhanced });
      setIsEnhancing(false);
      toast.success('Đã cải thiện mô tả bằng AI!');
    }, 1500);
  };

  const handleEstimateTime = () => {
    setIsEstimating(true);
    
    // Mock AI time estimation
    setTimeout(() => {
      const days = Math.floor(Math.random() * 10) + 3;
      const suggestedDeadline = new Date();
      suggestedDeadline.setDate(suggestedDeadline.getDate() + days);
      
      setFormData({
        ...formData,
        deadline: suggestedDeadline.toISOString().split('T')[0],
      });
      
      setIsEstimating(false);
      toast.success(`AI đề xuất: ${days} ngày để hoàn thành`);
    }, 1500);
  };

  const handleAddLabel = () => {
    if (newLabel.trim() && !formData.labels.includes(newLabel.trim())) {
      setFormData({
        ...formData,
        labels: [...formData.labels, newLabel.trim()],
      });
      setNewLabel('');
    }
  };

  const handleRemoveLabel = (label: string) => {
    setFormData({
      ...formData,
      labels: formData.labels.filter(l => l !== label),
    });
  };

  const toggleAssignee = (userId: string) => {
    if (formData.assignees.includes(userId)) {
      setFormData({
        ...formData,
        assignees: formData.assignees.filter(id => id !== userId),
      });
    } else {
      setFormData({
        ...formData,
        assignees: [...formData.assignees, userId],
      });
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo {isScrum ? 'User Story' : 'nhiệm vụ'} mới</DialogTitle>
          <DialogDescription>
            Nhập thông tin chi tiết cho {isScrum ? 'user story' : 'nhiệm vụ'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Tên {isScrum ? 'User Story' : 'nhiệm vụ'} *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={isScrum ? 'Là [ai], tôi muốn [gì]...' : 'Nhập tên nhiệm vụ'}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Mô tả</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleEnhanceDescription}
                disabled={isEnhancing || !formData.description}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isEnhancing ? 'Đang xử lý...' : 'AI Cải thiện văn phong'}
              </Button>
            </div>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả chi tiết về nhiệm vụ"
              rows={5}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Mức độ ưu tiên</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as Task['priority'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Thấp</SelectItem>
                  <SelectItem value="medium">Trung bình</SelectItem>
                  <SelectItem value="high">Cao</SelectItem>
                  <SelectItem value="urgent">Khẩn cấp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isScrum && (
              <div className="space-y-2">
                <Label htmlFor="storyPoints">Story Points</Label>
                <Select
                  value={formData.storyPoints.toString()}
                  onValueChange={(value) => setFormData({ ...formData, storyPoints: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="8">8</SelectItem>
                    <SelectItem value="13">13</SelectItem>
                    <SelectItem value="21">21</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="deadline">Deadline</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleEstimateTime}
                disabled={isEstimating || !formData.description}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isEstimating ? 'Đang ước tính...' : 'AI Ước tính thời gian'}
              </Button>
            </div>
            <Input
              id="deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Người thực hiện</Label>
            <div className="flex flex-wrap gap-2">
              {project.members.map((member) => (
                <Badge
                  key={member.userId}
                  variant={formData.assignees.includes(member.userId) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleAssignee(member.userId)}
                >
                  {member.name}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newLabel">Nhãn</Label>
            <div className="flex gap-2">
              <Input
                id="newLabel"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Thêm nhãn (VD: Frontend, Backend)"
                onKeyPress={(e) => e.key === 'Enter' && handleAddLabel()}
              />
              <Button type="button" onClick={handleAddLabel}>Thêm</Button>
            </div>
            {formData.labels.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.labels.map((label) => (
                  <Badge key={label} variant="secondary">
                    {label}
                    <X
                      className="w-3 h-3 ml-1 cursor-pointer"
                      onClick={() => handleRemoveLabel(label)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleSubmit}>Tạo nhiệm vụ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
