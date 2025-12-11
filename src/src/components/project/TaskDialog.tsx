import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Separator } from '../ui/separator';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { 
  Clock, MessageSquare, Paperclip, Plus, X, Trash2, Edit, 
  Check, CheckSquare, Link as LinkIcon, FileText, Image as ImageIcon,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import type { User, Project, Task } from '../../App';

interface TaskDialogProps {
  task: Task;
  project: Project;
  user: User;
  allTasks: Task[];
  isManager: boolean;
  onClose: () => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  onCreateTask: (task: Omit<Task, 'id' | 'createdAt' | 'comments' | 'attachments'>) => void;
  onAddComment: (taskId: string, content: string) => void;
  onAddAttachment: (taskId: string, file: { name: string; url: string; type: string }) => void;
}

export function TaskDialog({
  task,
  project,
  user,
  allTasks,
  isManager,
  onClose,
  onUpdateTask,
  onDeleteTask,
  onCreateTask,
  onAddComment,
  onAddAttachment,
}: TaskDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(task);
  const [newComment, setNewComment] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  const subtasks = allTasks.filter(t => t.parentTaskId === task.id);

  const handleSave = () => {
    onUpdateTask(task.id, editedTask);
    setIsEditing(false);
    toast.success('Cập nhật thành công!');
  };

  const handleDelete = () => {
    if (confirm('Bạn có chắc muốn xóa nhiệm vụ này?')) {
      onDeleteTask(task.id);
      onClose();
      toast.success('Đã xóa nhiệm vụ!');
    }
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      onAddComment(task.id, newComment);
      setNewComment('');
      toast.success('Đã thêm bình luận!');
    }
  };

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      onCreateTask({
        projectId: task.projectId,
        title: newSubtask,
        description: '',
        priority: task.priority,
        status: 'todo',
        assignees: task.assignees,
        labels: [],
        parentTaskId: task.id,
        createdBy: user.id,
      });
      setNewSubtask('');
      toast.success('Đã thêm nhiệm vụ con!');
    }
  };

  const handleAddAttachment = () => {
    if (attachmentUrl.trim()) {
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(attachmentUrl);
      const fileName = attachmentUrl.split('/').pop() || 'file';
      
      onAddAttachment(task.id, {
        name: fileName,
        url: attachmentUrl,
        type: isImage ? 'image' : 'link',
      });
      setAttachmentUrl('');
      toast.success('Đã thêm tài liệu đính kèm!');
    }
  };

  const toggleAssignee = (userId: string) => {
    const newAssignees = editedTask.assignees.includes(userId)
      ? editedTask.assignees.filter(id => id !== userId)
      : [...editedTask.assignees, userId];
    
    setEditedTask({ ...editedTask, assignees: newAssignees });
  };

  const getPriorityLabel = (priority: string) => {
    const labels = {
      low: 'Thấp',
      medium: 'Trung bình',
      high: 'Cao',
      urgent: 'Khẩn cấp',
    };
    return labels[priority as keyof typeof labels] || priority;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      backlog: 'Backlog',
      todo: 'Cần làm',
      'in-progress': 'Đang làm',
      done: 'Hoàn thành',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done';

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isEditing ? (
                <Input
                  value={editedTask.title}
                  onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                  className="text-xl mb-2"
                />
              ) : (
                <DialogTitle className="text-xl">{task.title}</DialogTitle>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Tạo bởi {project.members.find(m => m.userId === task.createdBy)?.name || 'Unknown'}</span>
                <span>•</span>
                <span>{formatDateTime(task.createdAt)}</span>
              </div>
            </div>
            {isManager && (
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Button size="sm" onClick={handleSave}>
                      <Check className="w-4 h-4 mr-2" />
                      Lưu
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                      Hủy
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Sửa
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleDelete}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Xóa
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <div className="space-y-2">
                <Label>Mô tả</Label>
                {isEditing ? (
                  <Textarea
                    value={editedTask.description}
                    onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                    rows={6}
                  />
                ) : (
                  <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                    {task.description || 'Không có mô tả'}
                  </div>
                )}
              </div>

              {/* Tabs for Subtasks, Comments, Attachments */}
              <Tabs defaultValue="subtasks">
                <TabsList>
                  <TabsTrigger value="subtasks">
                    <CheckSquare className="w-4 h-4 mr-2" />
                    Nhiệm vụ con ({subtasks.length})
                  </TabsTrigger>
                  <TabsTrigger value="comments">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Bình luận ({task.comments.length})
                  </TabsTrigger>
                  <TabsTrigger value="attachments">
                    <Paperclip className="w-4 h-4 mr-2" />
                    Tài liệu ({task.attachments.length})
                  </TabsTrigger>
                </TabsList>

                {/* Subtasks Tab */}
                <TabsContent value="subtasks" className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      placeholder="Thêm nhiệm vụ con..."
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                    />
                    <Button onClick={handleAddSubtask}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {subtasks.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      Chưa có nhiệm vụ con nào
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {subtasks.map((subtask) => (
                        <div
                          key={subtask.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <input
                            type="checkbox"
                            checked={subtask.status === 'done'}
                            onChange={() => onUpdateTask(subtask.id, {
                              status: subtask.status === 'done' ? 'todo' : 'done',
                            })}
                            className="w-4 h-4"
                          />
                          <span className={`flex-1 text-sm ${subtask.status === 'done' ? 'line-through text-gray-500' : ''}`}>
                            {subtask.title}
                          </span>
                          {isManager && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onDeleteTask(subtask.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Comments Tab */}
                <TabsContent value="comments" className="space-y-3">
                  <div className="flex gap-2">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Thêm bình luận..."
                      rows={2}
                    />
                    <Button onClick={handleAddComment}>Gửi</Button>
                  </div>

                  {task.comments.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      Chưa có bình luận nào
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {task.comments.map((comment) => (
                        <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs">
                                {comment.userName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{comment.userName}</span>
                            <span className="text-xs text-gray-500">
                              {formatDateTime(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Attachments Tab */}
                <TabsContent value="attachments" className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={attachmentUrl}
                      onChange={(e) => setAttachmentUrl(e.target.value)}
                      placeholder="URL tài liệu (link hoặc hình ảnh)..."
                    />
                    <Button onClick={handleAddAttachment}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {task.attachments.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      Chưa có tài liệu đính kèm
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {task.attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          {attachment.type === 'image' ? (
                            <ImageIcon className="w-5 h-5 text-blue-600" />
                          ) : (
                            <FileText className="w-5 h-5 text-gray-600" />
                          )}
                          <div className="flex-1">
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              {attachment.name}
                            </a>
                            <p className="text-xs text-gray-500">
                              {formatDateTime(attachment.uploadedAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Status */}
              <div className="space-y-2">
                <Label>Trạng thái</Label>
                {isEditing ? (
                  <Select
                    value={editedTask.status}
                    onValueChange={(value) => setEditedTask({ ...editedTask, status: value as Task['status'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="backlog">Backlog</SelectItem>
                      <SelectItem value="todo">Cần làm</SelectItem>
                      <SelectItem value="in-progress">Đang làm</SelectItem>
                      <SelectItem value="done">Hoàn thành</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="secondary">{getStatusLabel(task.status)}</Badge>
                )}
              </div>

              <Separator />

              {/* Priority */}
              <div className="space-y-2">
                <Label>Ưu tiên</Label>
                {isEditing ? (
                  <Select
                    value={editedTask.priority}
                    onValueChange={(value) => setEditedTask({ ...editedTask, priority: value as Task['priority'] })}
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
                ) : (
                  <Badge>{getPriorityLabel(task.priority)}</Badge>
                )}
              </div>

              <Separator />

              {/* Deadline */}
              <div className="space-y-2">
                <Label>Deadline</Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={editedTask.deadline || ''}
                    onChange={(e) => setEditedTask({ ...editedTask, deadline: e.target.value })}
                  />
                ) : task.deadline ? (
                  <div className={`flex items-center gap-2 text-sm ${isOverdue ? 'text-red-600' : ''}`}>
                    <Clock className="w-4 h-4" />
                    <span>{new Date(task.deadline).toLocaleDateString('vi-VN')}</span>
                    {isOverdue && <AlertCircle className="w-4 h-4" />}
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">Chưa đặt deadline</span>
                )}
              </div>

              <Separator />

              {/* Assignees */}
              <div className="space-y-2">
                <Label>Người thực hiện</Label>
                {isEditing ? (
                  <div className="flex flex-wrap gap-2">
                    {project.members.map((member) => (
                      <Badge
                        key={member.userId}
                        variant={editedTask.assignees.includes(member.userId) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleAssignee(member.userId)}
                      >
                        {member.name}
                      </Badge>
                    ))}
                  </div>
                ) : task.assignees.length > 0 ? (
                  <div className="space-y-2">
                    {task.assignees.map((userId) => {
                      const member = project.members.find(m => m.userId === userId);
                      return member ? (
                        <div key={userId} className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs">
                              {member.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{member.name}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">Chưa phân công</span>
                )}
              </div>

              {task.storyPoints && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Story Points</Label>
                    <Badge variant="secondary">{task.storyPoints} điểm</Badge>
                  </div>
                </>
              )}

              {task.labels.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Nhãn</Label>
                    <div className="flex flex-wrap gap-2">
                      {task.labels.map((label, idx) => (
                        <Badge key={idx} variant="outline">{label}</Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
