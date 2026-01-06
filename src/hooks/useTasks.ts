import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import * as taskService from '../services/taskService';
import type { User } from './useAuth';
import type { Notification } from './useNotifications';

export type { Task, TaskProposal, Comment, Attachment } from '../services/taskService';

interface UseTasksProps {
  user: User | null;
  projectIds?: string[];
  onAddNotification?: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
}

export function useTasks({ user, projectIds = [], onAddNotification }: UseTasksProps) {
  const [tasks, setTasks] = useState<taskService.Task[]>([]);
  const [taskProposals, setTaskProposals] = useState<taskService.TaskProposal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const hasFetched = useRef(false);
  const lastProjectsKey = useRef<string>('');

  // Fetch tasks from Supabase when projectIds change
  useEffect(() => {
    const projectsKey = projectIds.join(',');

    if (!user || projectIds.length === 0) {
      setTasks([]);
      setTaskProposals([]);
      hasFetched.current = false;
      lastProjectsKey.current = '';
      return;
    }

    // Skip if already fetched for same projects
    if (hasFetched.current && lastProjectsKey.current === projectsKey) {
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [fetchedTasks, fetchedProposals] = await Promise.all([
          taskService.fetchTasks(projectIds),
          // Fetch proposals for all projects
          Promise.all(projectIds.map((id) => taskService.fetchTaskProposals(id))).then((results) =>
            results.flat()
          ),
        ]);
        setTasks(fetchedTasks);
        setTaskProposals(fetchedProposals.filter((p) => p.status === 'pending'));
        hasFetched.current = true;
        lastProjectsKey.current = projectsKey;
      } catch (error) {
        console.error('Error fetching tasks:', error);
        // Only show toast on first attempt
        if (!hasFetched.current) {
          toast.error('Không thể tải dữ liệu nhiệm vụ');
        }
        hasFetched.current = true;
        lastProjectsKey.current = projectsKey;
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.id, projectIds.join(',')]);

  const handleCreateTask = useCallback(
    async (task: Omit<taskService.Task, 'id' | 'createdAt' | 'comments' | 'attachments'>) => {
      try {
        const newTask = await taskService.createTask(task);
        setTasks((prev) => {
          const updatedTasks = [...prev, newTask];

          // If task belongs to a User Story, update parent status
          if (newTask.parentTaskId && newTask.type === 'task') {
            const parentStory = updatedTasks.find((t) => t.id === newTask.parentTaskId);
            if (parentStory && parentStory.status === 'done' && newTask.status !== 'done') {
              return updatedTasks.map((t) =>
                t.id === newTask.parentTaskId ? { ...t, status: 'in-progress' as const } : t
              );
            }
          }

          return updatedTasks;
        });

        if (task.assignees.length > 0 && user && onAddNotification) {
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
      } catch (error) {
        console.error('Error creating task:', error);
        toast.error('Không thể tạo nhiệm vụ');
        return null;
      }
    },
    [user, onAddNotification]
  );

  const handleUpdateTask = useCallback(async (taskId: string, updates: Partial<taskService.Task>) => {
    try {
      const updated = await taskService.updateTask(taskId, updates);
      setTasks((prev) => {
        const updatedTasks = prev.map((t) => (t.id === taskId ? updated : t));

        // Auto-update User Story status if a Task is updated
        if (updated.parentTaskId && updated.type === 'task') {
          const siblingTasks = updatedTasks.filter((t) => t.parentTaskId === updated.parentTaskId);
          const allDone = siblingTasks.every((t) => t.status === 'done');
          const anyInProgress = siblingTasks.some(
            (t) => t.status === 'in-progress' || t.status === 'done'
          );

          return updatedTasks.map((t) => {
            if (t.id === updated.parentTaskId) {
              if (allDone && siblingTasks.length > 0) {
                return { ...t, status: 'done' as const };
              } else if (anyInProgress) {
                return { ...t, status: 'in-progress' as const };
              } else {
                return { ...t, status: 'todo' as const };
              }
            }
            return t;
          });
        }

        return updatedTasks;
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Không thể cập nhật nhiệm vụ');
    }
  }, []);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    try {
      await taskService.deleteTask(taskId);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, deletedAt: new Date().toISOString() } : t))
      );
      toast.success('Nhiệm vụ đã được di chuyển vào thùng rác');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Không thể xóa nhiệm vụ');
    }
  }, []);

  const handleRestoreTask = useCallback(async (taskId: string) => {
    try {
      await taskService.restoreTask(taskId);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, deletedAt: undefined } : t))
      );
      toast.success('Nhiệm vụ đã được khôi phục');
    } catch (error) {
      console.error('Error restoring task:', error);
      toast.error('Không thể khôi phục nhiệm vụ');
    }
  }, []);

  const handlePermanentlyDeleteTask = useCallback(async (taskId: string) => {
    try {
      await taskService.permanentlyDeleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId && t.parentTaskId !== taskId));
      toast.success('Nhiệm vụ đã được xóa vĩnh viễn');
    } catch (error) {
      console.error('Error permanently deleting task:', error);
      toast.error('Không thể xóa vĩnh viễn nhiệm vụ');
    }
  }, []);

  const handleDeleteTasksByProject = useCallback(async (projectId: string) => {
    try {
      await taskService.deleteTasksByProject(projectId);
      setTasks((prev) => prev.filter((t) => t.projectId !== projectId));
    } catch (error) {
      console.error('Error deleting tasks by project:', error);
    }
  }, []);

  const handleAddComment = useCallback(
    async (taskId: string, comment: { userId: string; userName: string; content: string }) => {
      try {
        const newComment = await taskService.addComment(taskId, comment.userId, comment.content);
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, comments: [...t.comments, newComment] } : t
          )
        );
      } catch (error) {
        console.error('Error adding comment:', error);
        toast.error('Không thể thêm bình luận');
      }
    },
    []
  );

  const handleAddAttachment = useCallback(
    async (
      taskId: string,
      attachment: { name: string; url: string; type: string; uploadedBy: string }
    ) => {
      try {
        const newAttachment = await taskService.addAttachment(taskId, attachment.uploadedBy, {
          name: attachment.name,
          url: attachment.url,
          type: attachment.type,
        });
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, attachments: [...t.attachments, newAttachment] } : t
          )
        );
      } catch (error) {
        console.error('Error adding attachment:', error);
        toast.error('Không thể thêm tệp đính kèm');
      }
    },
    []
  );

  const handleProposeTask = useCallback(
    async (proposal: Omit<taskService.TaskProposal, 'id' | 'createdAt' | 'status'>) => {
      try {
        const newProposal = await taskService.createTaskProposal(proposal);
        setTaskProposals((prev) => [...prev, newProposal]);
        toast.success('Đề xuất nhiệm vụ đã được gửi');
      } catch (error) {
        console.error('Error proposing task:', error);
        toast.error('Không thể gửi đề xuất');
      }
    },
    []
  );

  const handleApproveProposal = useCallback(
    async (proposalId: string) => {
      if (!user) return;

      try {
        const newTask = await taskService.approveProposal(proposalId, user.id);
        setTasks((prev) => [...prev, newTask]);
        setTaskProposals((prev) =>
          prev.map((p) => (p.id === proposalId ? { ...p, status: 'approved' as const } : p))
        );
        toast.success('Đã phê duyệt đề xuất');
      } catch (error) {
        console.error('Error approving proposal:', error);
        toast.error('Không thể phê duyệt đề xuất');
      }
    },
    [user]
  );

  const handleRejectProposal = useCallback(async (proposalId: string) => {
    try {
      await taskService.rejectProposal(proposalId);
      setTaskProposals((prev) =>
        prev.map((p) => (p.id === proposalId ? { ...p, status: 'rejected' as const } : p))
      );
      toast.success('Đã từ chối đề xuất');
    } catch (error) {
      console.error('Error rejecting proposal:', error);
      toast.error('Không thể từ chối đề xuất');
    }
  }, []);

  const getActiveTasks = useCallback(() => tasks.filter((t) => !t.deletedAt), [tasks]);
  const getDeletedTasks = useCallback(() => tasks.filter((t) => t.deletedAt), [tasks]);
  const getTasksByProject = useCallback(
    (projectId: string) => tasks.filter((t) => t.projectId === projectId && !t.deletedAt),
    [tasks]
  );

  return {
    tasks,
    setTasks,
    taskProposals,
    isLoading,
    handleCreateTask,
    handleUpdateTask,
    handleDeleteTask,
    handleRestoreTask,
    handlePermanentlyDeleteTask,
    handleDeleteTasksByProject,
    handleAddComment,
    handleAddAttachment,
    handleProposeTask,
    handleApproveProposal,
    handleRejectProposal,
    getActiveTasks,
    getDeletedTasks,
    getTasksByProject,
  };
}
