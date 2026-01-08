import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { User } from './useAuth';
import type { Notification } from './useNotifications';
import { tasksApi, commentsApi, attachmentsApi } from '../services/apiClient';

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  taskId: string;
  name: string;
  url: string;
  type: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  type: 'user-story' | 'task';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'backlog' | 'todo' | 'in-progress' | 'done';
  assignees: string[];
  deadline?: string;
  labels: string[];
  storyPoints?: number;
  parentTaskId?: string;
  sprintId?: string;
  createdBy: string;
  createdAt: string;
  comments: Comment[];
  attachments: Attachment[];
  deletedAt?: string;
}

export interface TaskProposal {
  id: string;
  projectId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  proposedBy: string;
  proposedByName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface UseTasksProps {
  user: User | null;
  onAddNotification?: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
}

export function useTasks({ user, onAddNotification }: UseTasksProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskProposals, setTaskProposals] = useState<TaskProposal[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch tasks for a specific project
  const fetchTasksForProject = useCallback(async (projectId: string) => {
    try {
      setIsLoading(true);
      const response = await tasksApi.getAll(projectId);
      if (response.success) {
        // Update tasks for this project only
        setTasks(prev => {
          const otherTasks = prev.filter(t => t.projectId !== projectId);
          return [...otherTasks, ...response.data];
        });
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      toast.error('Không thể tải danh sách task');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create task
  const handleCreateTask = useCallback(async (
    task: Omit<Task, 'id' | 'createdAt' | 'comments' | 'attachments'>
  ) => {
    if (!user) return null;

    try {
      const response = await tasksApi.create(task.projectId, {
        ...task,
        createdBy: user.id,
      });

      if (response.success) {
        const newTask = response.data;
        setTasks(prev => [...prev, newTask]);
        toast.success('Task đã được tạo thành công');

        // Notify assignees
        if (task.assignees.length > 0 && onAddNotification) {
          task.assignees.forEach((assigneeId) => {
            if (assigneeId !== user.id) {
              onAddNotification({
                userId: assigneeId,
                type: 'task_assigned',
                title: 'Bạn được giao một nhiệm vụ mới',
                message: `${user.name} đã giao cho bạn nhiệm vụ: "${newTask.title}"`,
                read: false,
                relatedId: newTask.id,
              });
            }
          });
        }

        return newTask;
      }
    } catch (error: any) {
      console.error('Failed to create task:', error);
      toast.error(error.message || 'Không thể tạo task');
      return null;
    }
  }, [user, onAddNotification]);

  // Update task
  const handleUpdateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const response = await tasksApi.update(task.projectId, taskId, updates);
      if (response.success) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...response.data } : t));
        toast.success('Task đã được cập nhật');
      }
    } catch (error: any) {
      console.error('Failed to update task:', error);
      toast.error(error.message || 'Không thể cập nhật task');
    }
  }, [tasks]);

  // Delete task
  const handleDeleteTask = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const response = await tasksApi.delete(task.projectId, taskId);
      if (response.success) {
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, deletedAt: new Date().toISOString() } : t
        ));
        toast.success('Task đã được di chuyển vào thùng rác');
      }
    } catch (error: any) {
      console.error('Failed to delete task:', error);
      toast.error(error.message || 'Không thể xóa task');
    }
  }, [tasks]);

  // Restore task
  const handleRestoreTask = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const response = await tasksApi.update(task.projectId, taskId, { deletedAt: null });
      if (response.success) {
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, deletedAt: undefined } : t
        ));
        toast.success('Task đã được khôi phục');
      }
    } catch (error: any) {
      console.error('Failed to restore task:', error);
      toast.error(error.message || 'Không thể khôi phục task');
    }
  }, [tasks]);

  // Permanently delete task
  const handlePermanentlyDeleteTask = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const response = await tasksApi.delete(task.projectId, taskId);
      if (response.success) {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        toast.success('Task đã được xóa vĩnh viễn');
      }
    } catch (error: any) {
      console.error('Failed to permanently delete task:', error);
      toast.error(error.message || 'Không thể xóa task');
    }
  }, [tasks]);

  // Assign user to task
  const handleAssignUser = useCallback(async (taskId: string, userId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const response = await tasksApi.assignUser(task.projectId, taskId, userId);
      if (response.success) {
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, assignees: [...t.assignees, userId] } : t
        ));
        toast.success('Đã gán người dùng vào task');
      }
    } catch (error: any) {
      console.error('Failed to assign user:', error);
      toast.error(error.message || 'Không thể gán người dùng');
    }
  }, [tasks]);

  // Unassign user from task
  const handleUnassignUser = useCallback(async (taskId: string, userId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const response = await tasksApi.unassignUser(task.projectId, taskId, userId);
      if (response.success) {
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, assignees: t.assignees.filter(id => id !== userId) } : t
        ));
        toast.success('Đã bỏ gán người dùng khỏi task');
      }
    } catch (error: any) {
      console.error('Failed to unassign user:', error);
      toast.error(error.message || 'Không thể bỏ gán người dùng');
    }
  }, [tasks]);

  // Add comment
  const handleAddComment = useCallback(async (taskId: string, content: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !user) return null;

    try {
      const response = await commentsApi.create(task.projectId, taskId, content);
      if (response.success) {
        const newComment = response.data;
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, comments: [...t.comments, newComment] } : t
        ));
        return newComment;
      }
    } catch (error: any) {
      console.error('Failed to add comment:', error);
      toast.error(error.message || 'Không thể thêm bình luận');
      return null;
    }
  }, [tasks, user]);

  // Update comment
  const handleUpdateComment = useCallback(async (taskId: string, commentId: string, content: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const response = await commentsApi.update(task.projectId, taskId, commentId, content);
      if (response.success) {
        setTasks(prev => prev.map(t => 
          t.id === taskId ? {
            ...t,
            comments: t.comments.map(c => c.id === commentId ? { ...c, content } : c)
          } : t
        ));
        toast.success('Bình luận đã được cập nhật');
      }
    } catch (error: any) {
      console.error('Failed to update comment:', error);
      toast.error(error.message || 'Không thể cập nhật bình luận');
    }
  }, [tasks]);

  // Delete comment
  const handleDeleteComment = useCallback(async (taskId: string, commentId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const response = await commentsApi.delete(task.projectId, taskId, commentId);
      if (response.success) {
        setTasks(prev => prev.map(t => 
          t.id === taskId ? {
            ...t,
            comments: t.comments.filter(c => c.id !== commentId)
          } : t
        ));
        toast.success('Bình luận đã được xóa');
      }
    } catch (error: any) {
      console.error('Failed to delete comment:', error);
      toast.error(error.message || 'Không thể xóa bình luận');
    }
  }, [tasks]);

  // Upload attachment
  const handleUploadAttachment = useCallback(async (taskId: string, file: File) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !user) return null;

    try {
      const response = await attachmentsApi.upload(task.projectId, taskId, file);
      if (response.success) {
        const newAttachment = response.data;
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, attachments: [...t.attachments, newAttachment] } : t
        ));
        toast.success('File đã được tải lên');
        return newAttachment;
      }
    } catch (error: any) {
      console.error('Failed to upload attachment:', error);
      toast.error(error.message || 'Không thể tải file');
      return null;
    }
  }, [tasks, user]);

  // Delete attachment
  const handleDeleteAttachment = useCallback(async (taskId: string, attachmentId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const response = await attachmentsApi.delete(task.projectId, taskId, attachmentId);
      if (response.success) {
        setTasks(prev => prev.map(t => 
          t.id === taskId ? {
            ...t,
            attachments: t.attachments.filter(a => a.id !== attachmentId)
          } : t
        ));
        toast.success('File đã được xóa');
      }
    } catch (error: any) {
      console.error('Failed to delete attachment:', error);
      toast.error(error.message || 'Không thể xóa file');
    }
  }, [tasks]);

  // Task proposals (localStorage for now)
  const handleCreateTaskProposal = useCallback((proposal: Omit<TaskProposal, 'id' | 'createdAt' | 'status'>) => {
    if (!user) return null;

    const newProposal: TaskProposal = {
      ...proposal,
      id: Date.now().toString(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setTaskProposals(prev => [...prev, newProposal]);
    toast.success('Đề xuất task đã được gửi');
    return newProposal;
  }, [user]);

  const handleApproveTaskProposal = useCallback(async (proposalId: string) => {
    const proposal = taskProposals.find(p => p.id === proposalId);
    if (!proposal) return;

    const taskData = {
      projectId: proposal.projectId,
      type: 'task' as const,
      title: proposal.title,
      description: proposal.description,
      priority: proposal.priority,
      status: 'backlog' as const,
      assignees: [],
      labels: [],
      createdBy: proposal.proposedBy,
    };

    const newTask = await handleCreateTask(taskData);
    if (newTask) {
      setTaskProposals(prev => prev.map(p => 
        p.id === proposalId ? { ...p, status: 'approved' as const } : p
      ));
      toast.success('Đề xuất đã được chấp nhận và tạo task');
    }
  }, [taskProposals, handleCreateTask]);

  const handleRejectTaskProposal = useCallback((proposalId: string) => {
    setTaskProposals(prev => prev.map(p => 
      p.id === proposalId ? { ...p, status: 'rejected' as const } : p
    ));
    toast.success('Đề xuất đã bị từ chối');
  }, []);

  // Delete related tasks when project is deleted
  const deleteRelatedTasks = useCallback((projectId: string) => {
    setTasks(prev => prev.filter(t => t.projectId !== projectId));
  }, []);

  return {
    tasks,
    setTasks,
    taskProposals,
    isLoading,
    fetchTasksForProject,
    handleCreateTask,
    handleUpdateTask,
    handleDeleteTask,
    handleRestoreTask,
    handlePermanentlyDeleteTask,
    handleAssignUser,
    handleUnassignUser,
    handleAddComment,
    handleUpdateComment,
    handleDeleteComment,
    handleUploadAttachment,
    handleDeleteAttachment,
    handleCreateTaskProposal,
    handleApproveTaskProposal,
    handleRejectTaskProposal,
    deleteRelatedTasks,
  };
}
