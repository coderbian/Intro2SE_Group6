import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { User } from './useAuth';

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
  onAddNotification?: (notification: { userId: string; type: string; title: string; message: string; read: boolean; relatedId?: string }) => void;
}

export function useTasks({ user, onAddNotification }: UseTasksProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskProposals, setTaskProposals] = useState<TaskProposal[]>([]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('planora_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('planora_task_proposals', JSON.stringify(taskProposals));
  }, [taskProposals]);

  const handleCreateTask = (task: Omit<Task, 'id' | 'createdAt' | 'comments' | 'attachments'>) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      comments: [],
      attachments: [],
    };

    setTasks((prevTasks) => {
      const updatedTasks = [...prevTasks, newTask];

      // Nếu task mới thuộc một User Story, cập nhật lại trạng thái User Story
      if (newTask.parentTaskId && newTask.type === 'task') {
        const parentStory = updatedTasks.find((t) => t.id === newTask.parentTaskId);
        // Nếu User Story đang "done" mà có task mới chưa done → chuyển về "in-progress"
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
  };

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks((prevTasks) => {
      const updatedTasks = prevTasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t));

      // Auto-update User Story status if a Task is updated
      const updatedTask = updatedTasks.find((t) => t.id === taskId);
      if (updatedTask?.parentTaskId && updatedTask.type === 'task') {
        const siblingTasks = updatedTasks.filter((t) => t.parentTaskId === updatedTask.parentTaskId);
        const allDone = siblingTasks.every((t) => t.status === 'done');
        const anyInProgress = siblingTasks.some((t) => t.status === 'in-progress' || t.status === 'done');

        // Find and update parent User Story
        return updatedTasks.map((t) => {
          if (t.id === updatedTask.parentTaskId) {
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
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, deletedAt: new Date().toISOString() } : t)));
    toast.success('Nhiệm vụ đã được di chuyển vào thùng rác');
  };

  const handleRestoreTask = (taskId: string) => {
    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, deletedAt: undefined } : t)));
    toast.success('Nhiệm vụ đã được khôi phục');
  };

  const handlePermanentlyDeleteTask = (taskId: string) => {
    setTasks(tasks.filter((t) => t.id !== taskId && t.parentTaskId !== taskId));
    toast.success('Nhiệm vụ đã được xóa vĩnh viễn');
  };

  const handleDeleteTasksByProject = (projectId: string) => {
    setTasks(tasks.filter((t) => t.projectId !== projectId));
  };

  const handleAddComment = (
    taskId: string,
    comment: { userId: string; userName: string; content: string }
  ) => {
    const newComment: Comment = {
      id: Date.now().toString(),
      taskId,
      ...comment,
      createdAt: new Date().toISOString(),
    };

    setTasks(
      tasks.map((t) => (t.id === taskId ? { ...t, comments: [...t.comments, newComment] } : t))
    );
  };

  const handleAddAttachment = (
    taskId: string,
    attachment: { name: string; url: string; type: string; uploadedBy: string }
  ) => {
    const newAttachment: Attachment = {
      id: Date.now().toString(),
      taskId,
      ...attachment,
      uploadedAt: new Date().toISOString(),
    };

    setTasks(
      tasks.map((t) =>
        t.id === taskId ? { ...t, attachments: [...t.attachments, newAttachment] } : t
      )
    );
  };

  const handleProposeTask = (proposal: Omit<TaskProposal, 'id' | 'createdAt' | 'status'>) => {
    const newProposal: TaskProposal = {
      ...proposal,
      id: Date.now().toString(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setTaskProposals([...taskProposals, newProposal]);
    toast.success('Đề xuất nhiệm vụ đã được gửi');
  };

  const handleApproveProposal = (proposalId: string) => {
    const proposal = taskProposals.find((p) => p.id === proposalId);
    if (!proposal || !user) return;

    // Create task from proposal
    handleCreateTask({
      projectId: proposal.projectId,
      type: 'task',
      title: proposal.title,
      description: proposal.description,
      priority: proposal.priority,
      status: 'todo',
      assignees: [proposal.proposedBy],
      labels: [],
      createdBy: user.id,
    });

    setTaskProposals(taskProposals.map((p) => (p.id === proposalId ? { ...p, status: 'approved' } : p)));
    toast.success('Đã phê duyệt đề xuất');
  };

  const handleRejectProposal = (proposalId: string) => {
    setTaskProposals(taskProposals.map((p) => (p.id === proposalId ? { ...p, status: 'rejected' } : p)));
    toast.success('Đã từ chối đề xuất');
  };

  const getActiveTasks = () => tasks.filter((t) => !t.deletedAt);
  const getDeletedTasks = () => tasks.filter((t) => t.deletedAt);
  const getTasksByProject = (projectId: string) => tasks.filter((t) => t.projectId === projectId && !t.deletedAt);

  return {
    tasks,
    setTasks,
    taskProposals,
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
