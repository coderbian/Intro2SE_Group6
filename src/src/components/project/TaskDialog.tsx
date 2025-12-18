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
      <DialogContent className="max-w-[95vw] lg:max-w-7xl max-h-[95vh] overflow-hidden flex flex-col p-0">
        {/* Header cải tiến */}
        <DialogHeader className="px-6 lg:px-8 py-5 border-b bg-gradient-to-r from-gray-50 to-white shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <Input
                  value={editedTask.title}
                  onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                  className="text-xl lg:text-2xl font-semibold mb-3 border-2 focus:border-blue-500 h-12"
                  placeholder="Tên nhiệm vụ..."
                />
              ) : (
                <DialogTitle className="text-xl lg:text-2xl font-bold mb-3 leading-tight">{task.title}</DialogTitle>
              )}
              <div className="flex flex-wrap items-center gap-2 lg:gap-3 text-xs lg:text-sm text-gray-600">
                <span className="font-medium">Tạo bởi {project.members.find(m => m.userId === task.createdBy)?.name || 'Unknown'}</span>
                <span className="text-gray-400">•</span>
                <span>{formatDateTime(task.createdAt)}</span>
              </div>
            </div>
            {isManager && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {isEditing ? (
                  <>
                    <Button size="sm" onClick={handleSave} className="gap-2">
                      <Check className="w-4 h-4" />
                      Lưu
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                      Hủy
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="gap-2">
                      <Edit className="w-4 h-4" />
                      Sửa
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleDelete} className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                      Xóa
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6">
          <div className="grid lg:grid-cols-[1fr_350px] xl:grid-cols-[1fr_400px] gap-6 lg:gap-10">
            {/* Main Content */}
            <div className="space-y-8">
              {/* Description */}
              <div className="space-y-4">
                <Label className="text-base lg:text-lg font-bold text-gray-800">Mô tả</Label>
                {isEditing ? (
                  <Textarea
                    value={editedTask.description}
                    onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                    rows={10}
                    className="resize-none border-2 focus:border-blue-500 text-sm lg:text-base min-h-[200px]"
                    placeholder="Nhập mô tả chi tiết..."
                  />
                ) : (
                  <div className="text-sm lg:text-base text-gray-700 whitespace-pre-wrap bg-gray-50 p-6 rounded-xl border-2 leading-relaxed min-h-[150px]">
                    {task.description || 'Không có mô tả'}
                  </div>
                )}
              </div>

              {/* Tabs for Subtasks, Comments, Attachments */}
              <Tabs defaultValue="subtasks" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 h-auto p-1.5 bg-gray-100">
                  <TabsTrigger value="subtasks" className="gap-1.5 lg:gap-2 py-3 px-2 lg:px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <CheckSquare className="w-4 h-4 lg:w-5 lg:h-5" />
                    <span className="text-xs lg:text-sm font-medium">Nhiệm vụ con</span>
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 lg:px-2 text-xs font-bold bg-blue-100 text-blue-700">
                      {subtasks.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="comments" className="gap-1.5 lg:gap-2 py-3 px-2 lg:px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <MessageSquare className="w-4 h-4 lg:w-5 lg:h-5" />
                    <span className="text-xs lg:text-sm font-medium">Bình luận</span>
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 lg:px-2 text-xs font-bold bg-blue-100 text-blue-700">
                      {task.comments.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="attachments" className="gap-1.5 lg:gap-2 py-3 px-2 lg:px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <Paperclip className="w-4 h-4 lg:w-5 lg:h-5" />
                    <span className="text-xs lg:text-sm font-medium">Tài liệu</span>
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 lg:px-2 text-xs font-bold bg-blue-100 text-blue-700">
                      {task.attachments.length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>

                {/* Subtasks Tab */}
                <TabsContent value="subtasks" className="space-y-5 mt-0">
                  <div className="flex gap-3">
                    <Input
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      placeholder="Nhập tên nhiệm vụ con..."
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                      className="flex-1"
                    />
                    <Button onClick={handleAddSubtask} className="gap-2 px-4">
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">Thêm</span>
                    </Button>
                  </div>

                  {subtasks.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
                      <CheckSquare className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-sm text-gray-500 font-medium">
                        Chưa có nhiệm vụ con nào
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Thêm nhiệm vụ con để chia nhỏ công việc
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {subtasks.map((subtask) => (
                        <div
                          key={subtask.id}
                          className="flex items-center gap-3 p-4 bg-white border rounded-lg hover:shadow-sm transition-shadow"
                        >
                          <input
                            type="checkbox"
                            checked={subtask.status === 'done'}
                            onChange={() => onUpdateTask(subtask.id, {
                              status: subtask.status === 'done' ? 'todo' : 'done',
                            })}
                            className="w-5 h-5 rounded cursor-pointer"
                          />
                          <span className={`flex-1 text-sm ${subtask.status === 'done' ? 'line-through text-gray-400' : 'text-gray-700 font-medium'}`}>
                            {subtask.title}
                          </span>
                          {isManager && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onDeleteTask(subtask.id)}
                              className="hover:bg-red-50 hover:text-red-600"
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
                <TabsContent value="comments" className="space-y-4 mt-4">
                  <div className="flex gap-3">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Nhập bình luận của bạn..."
                      rows={3}
                      className="flex-1 resize-none"
                    />
                    <Button onClick={handleAddComment} className="self-end px-6">
                      Gửi
                    </Button>
                  </div>

                  {task.comments.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
                      <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-sm text-gray-500 font-medium">
                        Chưa có bình luận nào
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Hãy là người đầu tiên bình luận
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {task.comments.map((comment) => (
                        <div key={comment.id} className="bg-white border p-4 rounded-lg">
                          <div className="flex items-center gap-3 mb-2">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="text-sm font-semibold bg-blue-100 text-blue-700">
                                {comment.userName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <span className="text-sm font-semibold">{comment.userName}</span>
                              <span className="text-xs text-gray-500 ml-2">
                                {formatDateTime(comment.createdAt)}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed text-gray-700 ml-11">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Attachments Tab */}
                <TabsContent value="attachments" className="space-y-4 mt-4">
                  <div className="flex gap-2">
                    <Input
                      value={attachmentUrl}
                      onChange={(e) => setAttachmentUrl(e.target.value)}
                      placeholder="Nhập URL tài liệu (link hoặc hình ảnh)..."
                      className="flex-1"
                    />
                    <Button onClick={handleAddAttachment} className="gap-2 px-4">
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">Thêm</span>
                    </Button>
                  </div>

                  {task.attachments.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
                      <Paperclip className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-sm text-gray-500 font-medium">
                        Chưa có tài liệu đính kèm
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Thêm link hoặc hình ảnh liên quan
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {task.attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center gap-3 p-4 bg-white border rounded-lg hover:shadow-sm transition-shadow"
                        >
                          {attachment.type === 'image' ? (
                            <ImageIcon className="w-6 h-6 text-blue-600 flex-shrink-0" />
                          ) : (
                            <FileText className="w-6 h-6 text-gray-600 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-blue-600 hover:underline block truncate"
                            >
                              {attachment.name}
                            </a>
                            <p className="text-xs text-gray-500 mt-0.5">
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
            <div className="space-y-6 bg-gradient-to-b from-gray-50 to-white p-6 rounded-xl border-2 shadow-sm">
              {/* Status */}
              <div className="space-y-3">
                <Label className="text-sm lg:text-base font-bold text-gray-800 flex items-center gap-2">
                  Trạng thái
                </Label>
                {isEditing ? (
                  <Select
                    value={editedTask.status}
                    onValueChange={(value) => setEditedTask({ ...editedTask, status: value as Task['status'] })}
                  >
                    <SelectTrigger className="w-full h-11 border-2">
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
                  <Badge variant="secondary" className="text-sm lg:text-base px-4 py-2 w-full justify-center">
                    {getStatusLabel(task.status)}
                  </Badge>
                )}
              </div>

              <Separator className="bg-gray-300" />

              {/* Priority */}
              <div className="space-y-3">
                <Label className="text-sm lg:text-base font-bold text-gray-800">Ưu tiên</Label>
                {isEditing ? (
                  <Select
                    value={editedTask.priority}
                    onValueChange={(value) => setEditedTask({ ...editedTask, priority: value as Task['priority'] })}
                  >
                    <SelectTrigger className="w-full h-11 border-2">
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
                  <Badge className="text-sm lg:text-base px-4 py-2 w-full justify-center">
                    {getPriorityLabel(task.priority)}
                  </Badge>
                )}
              </div>

              <Separator className="bg-gray-300" />

              {/* Deadline */}
              <div className="space-y-3">
                <Label className="text-sm lg:text-base font-bold text-gray-800">Deadline</Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={editedTask.deadline || ''}
                    onChange={(e) => setEditedTask({ ...editedTask, deadline: e.target.value })}
                    className="w-full h-11 border-2"
                  />
                ) : task.deadline ? (
                  <div className={`flex items-center justify-center gap-2 text-sm lg:text-base px-4 py-3 rounded-lg font-semibold ${isOverdue ? 'bg-red-100 text-red-700 border-2 border-red-300' : 'bg-blue-100 text-blue-700 border-2 border-blue-300'}`}>
                    <Clock className="w-5 h-5" />
                    <span>{new Date(task.deadline).toLocaleDateString('vi-VN')}</span>
                    {isOverdue && <AlertCircle className="w-5 h-5" />}
                  </div>
                ) : (
                  <span className="text-sm lg:text-base text-gray-500 italic block text-center py-3">Chưa đặt deadline</span>
                )}
              </div>

              <Separator className="bg-gray-300" />

              {/* Assignees */}
              <div className="space-y-3">
                <Label className="text-sm lg:text-base font-bold text-gray-800">Người thực hiện</Label>
                {isEditing ? (
                  <div className="flex flex-wrap gap-2">
                    {project.members.map((member) => (
                      <Badge
                        key={member.userId}
                        variant={editedTask.assignees.includes(member.userId) ? 'default' : 'outline'}
                        className="cursor-pointer hover:scale-105 transition-transform px-3 py-1.5 text-sm"
                        onClick={() => toggleAssignee(member.userId)}
                      >
                        {member.name}
                      </Badge>
                    ))}
                  </div>
                ) : task.assignees.length > 0 ? (
                  <div className="space-y-3">
                    {task.assignees.map((userId) => {
                      const member = project.members.find(m => m.userId === userId);
                      return member ? (
                        <div key={userId} className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 hover:shadow-sm transition-shadow">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="text-base font-bold bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                              {member.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm lg:text-base font-semibold text-gray-800">{member.name}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                ) : (
                  <span className="text-sm lg:text-base text-gray-500 italic block text-center py-3">Chưa phân công</span>
                )}
              </div>

              {task.storyPoints && (
                <>
                  <Separator className="bg-gray-300" />
                  <div className="space-y-3">
                    <Label className="text-sm lg:text-base font-bold text-gray-800">Story Points</Label>
                    <Badge variant="secondary" className="text-sm lg:text-base px-4 py-2 w-full justify-center font-bold">
                      {task.storyPoints} điểm
                    </Badge>
                  </div>
                </>
              )}

              {task.labels.length > 0 && (
                <>
                  <Separator className="bg-gray-300" />
                  <div className="space-y-3">
                    <Label className="text-sm lg:text-base font-bold text-gray-800">Nhãn</Label>
                    <div className="flex flex-wrap gap-2">
                      {task.labels.map((label, idx) => (
                        <Badge key={idx} variant="outline" className="px-3 py-1.5 text-sm border-2">
                          {label}
                        </Badge>
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
