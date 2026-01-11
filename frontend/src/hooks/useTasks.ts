import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase-client';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'backlog' | 'todo' | 'in-progress' | 'done' | 'deleted';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  type?: 'task' | 'user-story' | 'bug' | 'epic';
  dueDate?: string;
  deadline?: string; // Alias for dueDate for backward compatibility
  parentTaskId?: string;
  sprintId?: string;
  projectId: string;
  createdBy: string;
  assignees: string[];
  comments: Comment[];
  attachments: Attachment[];
  labels?: string[];
  timeEstimate?: number;
  timeSpent?: number;
  storyPoints?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Comment {
  id: string;
  taskId: string;
  content: string;
  authorId: string;
  authorName?: string;
  userName?: string; // Alias for authorName
  createdAt: string;
}

export interface Attachment {
  id: string;
  taskId: string;
  name: string;
  url: string;
  type: string;
  uploadedBy: string;
  createdAt: string;
  uploadedAt?: string; // Alias for createdAt
}

export interface TaskProposal {
  id: string;
  taskId: string;
  proposedBy: string;
  changes: Partial<Task>;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskProposals, setTaskProposals] = useState<TaskProposal[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch tasks from Supabase
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTasks([]);
        setLoading(false);
        return;
      }

      // Get user's projects first
      const { data: projectMembers, error: projectError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id);

      if (projectError) throw projectError;

      const projectIds = projectMembers?.map(pm => pm.project_id) || [];

      if (projectIds.length === 0) {
        setTasks([]);
        setLoading(false);
        return;
      }

      // Fetch tasks with nested data
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          task_assignees!task_assignees_task_id_fkey (
            user_id,
            users!task_assignees_user_id_fkey (
              id,
              name,
              email
            )
          ),
          comments (
            id,
            content,
            author_id,
            created_at,
            users (
              id,
              name
            )
          ),
          attachments (
            id,
            name,
            url,
            type,
            uploaded_by,
            created_at
          )
        `)
        .in('project_id', projectIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform database format to app format
      const transformedTasks: Task[] = (data || []).map((dbTask: any) => ({
        id: dbTask.id,
        title: dbTask.title,
        description: dbTask.description || '',
        status: dbTask.status,
        priority: dbTask.priority,
        type: dbTask.type,
        dueDate: dbTask.due_date,
        parentTaskId: dbTask.parent_id,
        sprintId: dbTask.sprint_id,
        projectId: dbTask.project_id,
        createdBy: dbTask.reporter_id,
        assignees: (dbTask.task_assignees || []).map((ta: any) => ta.user_id),
        comments: (dbTask.comments || []).map((c: any) => ({
          id: c.id,
          taskId: dbTask.id,
          content: c.content,
          authorId: c.author_id,
          authorName: c.users?.name || 'Unknown',
          userName: c.users?.name || 'Unknown',
          createdAt: c.created_at,
        })),
        attachments: (dbTask.attachments || []).map((a: any) => ({
          id: a.id,
          taskId: dbTask.id,
          name: a.name,
          url: a.url,
          type: a.type,
          uploadedBy: a.uploaded_by,
          uploadedAt: a.created_at,
          createdAt: a.created_at,
        })),
        labels: dbTask.labels || [],
        storyPoints: dbTask.story_points,
        timeEstimate: dbTask.time_estimate,
        timeSpent: dbTask.time_spent,
        createdAt: dbTask.created_at,
        updatedAt: dbTask.updated_at,
        deletedAt: dbTask.deleted_at,
      }));

      setTasks(transformedTasks);
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to fetch tasks: ' + error.message);
      setLoading(false);
    }
  };

  // Setup realtime subscriptions
  useEffect(() => {
    fetchTasks();

    // Subscribe to tasks changes
    const tasksChannel = supabase
      .channel('tasks_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    // Subscribe to comments changes
    const commentsChannel = supabase
      .channel('comments_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments' },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    // Subscribe to attachments changes
    const attachmentsChannel = supabase
      .channel('attachments_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attachments' },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(attachmentsChannel);
    };
  }, []);

  // Create a new task
  const createTask = async (taskData: Omit<Task, 'id' | 'comments' | 'attachments' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to create tasks');
        return { success: false };
      }

      const newTaskId = uuidv4();
      const now = new Date().toISOString();

      // Get next task number for this project
      const { data: existingTasks, error: countError } = await supabase
        .from('tasks')
        .select('task_number')
        .eq('project_id', taskData.projectId)
        .order('task_number', { ascending: false })
        .limit(1);

      if (countError) throw countError;

      const nextTaskNumber = existingTasks && existingTasks.length > 0
        ? existingTasks[0].task_number + 1
        : 1;

      // Insert task
      const { data: newTask, error: taskError } = await supabase
        .from('tasks')
        .insert({
          id: newTaskId,
          project_id: taskData.projectId,
          task_number: nextTaskNumber,
          title: taskData.title,
          description: taskData.description,
          status: taskData.status,
          priority: taskData.priority,
          type: taskData.type || 'task',
          due_date: taskData.dueDate,
          parent_id: taskData.parentTaskId,
          sprint_id: taskData.sprintId,
          reporter_id: user.id,
          time_estimate: taskData.timeEstimate,
          time_spent: taskData.timeSpent,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (taskError) throw taskError;

      // Insert assignees
      if (taskData.assignees && taskData.assignees.length > 0) {
        const assigneesData = taskData.assignees.map(userId => ({
          task_id: newTaskId,
          user_id: userId,
          assigned_at: now,
        }));

        const { error: assigneesError } = await supabase
          .from('task_assignees')
          .insert(assigneesData);

        if (assigneesError) throw assigneesError;

        // Send notifications to assignees
        for (const assigneeId of taskData.assignees) {
          if (assigneeId !== user.id) {
            await supabase.from('notifications').insert({
              user_id: assigneeId,
              type: 'task_assigned',
              title: 'New Task Assigned',
              message: `You have been assigned to task: ${taskData.title}`,
              related_id: newTaskId,
              created_at: now,
            });
          }
        }
      }

      // Update parent task status if applicable
      if (taskData.parentTaskId) {
        await updateParentTaskStatus(taskData.parentTaskId);
      }

      toast.success('Task created successfully!');
      await fetchTasks();
      return { success: true, taskId: newTaskId };
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task: ' + error.message);
      return { success: false };
    }
  };

  // Update parent task status based on subtasks
  const updateParentTaskStatus = async (parentTaskId: string) => {
    try {
      const { data: subtasks, error } = await supabase
        .from('tasks')
        .select('status')
        .eq('parent_id', parentTaskId)
        .is('deleted_at', null);

      if (error) throw error;

      if (!subtasks || subtasks.length === 0) return;

      const allDone = subtasks.every((task: any) => task.status === 'done');
      const anyInProgress = subtasks.some((task: any) => task.status === 'in-progress');

      let newStatus: 'todo' | 'in-progress' | 'done' = 'todo';
      if (allDone) {
        newStatus = 'done';
      } else if (anyInProgress) {
        newStatus = 'in-progress';
      }

      await supabase
        .from('tasks')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', parentTaskId);

    } catch (error) {
      console.error('Error updating parent task status:', error);
    }
  };

  // Update a task
  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to update tasks');
        return { success: false };
      }

      // Optimistic update
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId
            ? { ...task, ...updates, updatedAt: new Date().toISOString() }
            : task
        )
      );

      // Prepare database updates
      const dbUpdates: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
      if (updates.sprintId !== undefined) dbUpdates.sprint_id = updates.sprintId;
      if (updates.timeEstimate !== undefined) dbUpdates.time_estimate = updates.timeEstimate;
      if (updates.timeSpent !== undefined) dbUpdates.time_spent = updates.timeSpent;
      if (updates.storyPoints !== undefined) dbUpdates.story_points = updates.storyPoints;

      const { error } = await supabase
        .from('tasks')
        .update(dbUpdates)
        .eq('id', taskId);

      if (error) throw error;

      // Update assignees if provided
      if (updates.assignees !== undefined) {
        // Delete existing assignees
        await supabase
          .from('task_assignees')
          .delete()
          .eq('task_id', taskId);

        // Insert new assignees
        if (updates.assignees.length > 0) {
          const assigneesData = updates.assignees.map(userId => ({
            task_id: taskId,
            user_id: userId,
            assigned_at: new Date().toISOString(),
          }));

          await supabase
            .from('task_assignees')
            .insert(assigneesData);
        }
      }

      // Get parent task ID for status update
      const { data: taskData } = await supabase
        .from('tasks')
        .select('parent_id')
        .eq('id', taskId)
        .single();

      if (taskData?.parent_id) {
        await updateParentTaskStatus(taskData.parent_id);
      }

      // Toast is shown by the caller (TaskDialog)
      await fetchTasks();
      return { success: true };
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task: ' + error.message);
      await fetchTasks(); // Rollback
      return { success: false };
    }
  };

  // Soft delete a task
  const deleteTask = async (taskId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to delete tasks');
        return { success: false };
      }

      // Optimistic update
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId
            ? { ...task, status: 'deleted' as const, deletedAt: new Date().toISOString() }
            : task
        )
      );

      const now = new Date().toISOString();
      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'deleted',
          deleted_at: now,
          updated_at: now,
        })
        .eq('id', taskId);

      if (error) throw error;

      toast.success('Task moved to trash');
      await fetchTasks();
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task: ' + error.message);
      await fetchTasks(); // Rollback
      return { success: false };
    }
  };

  // Restore a deleted task
  const restoreTask = async (taskId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to restore tasks');
        return { success: false };
      }

      // Optimistic update
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId
            ? { ...task, status: 'todo' as const, deletedAt: undefined }
            : task
        )
      );

      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'todo',
          deleted_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (error) throw error;

      toast.success('Task restored successfully');
      await fetchTasks();
      return { success: true };
    } catch (error: any) {
      console.error('Error restoring task:', error);
      toast.error('Failed to restore task: ' + error.message);
      await fetchTasks(); // Rollback
      return { success: false };
    }
  };

  // Permanently delete a task
  const permanentlyDeleteTask = async (taskId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to permanently delete tasks');
        return { success: false };
      }

      // Optimistic update
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));

      // Delete assignees first (foreign key constraint)
      await supabase
        .from('task_assignees')
        .delete()
        .eq('task_id', taskId);

      // Delete comments
      await supabase
        .from('comments')
        .delete()
        .eq('task_id', taskId);

      // Delete attachments
      await supabase
        .from('attachments')
        .delete()
        .eq('task_id', taskId);

      // Delete the task
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      toast.success('Task permanently deleted');
      await fetchTasks();
      return { success: true };
    } catch (error: any) {
      console.error('Error permanently deleting task:', error);
      toast.error('Failed to permanently delete task: ' + error.message);
      await fetchTasks(); // Rollback
      return { success: false };
    }
  };

  // Add a comment to a task
  const addComment = async (taskId: string, content: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to add comments');
        return { success: false };
      }

      const newComment = {
        id: uuidv4(),
        task_id: taskId,
        content,
        author_id: user.id,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('comments')
        .insert(newComment);

      if (error) throw error;

      toast.success('Comment added successfully');
      await fetchTasks();
      return { success: true };
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment: ' + error.message);
      return { success: false };
    }
  };

  // Add an attachment to a task
  const addAttachment = async (taskId: string, file: File) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to add attachments');
        return { success: false };
      }

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `task-attachments/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      // Insert attachment record
      const newAttachment = {
        id: uuidv4(),
        task_id: taskId,
        name: file.name,
        url: publicUrl,
        type: file.type,
        file_size: file.size,
        uploaded_by: user.id,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('attachments')
        .insert(newAttachment);

      if (error) throw error;

      toast.success('Attachment added successfully');
      await fetchTasks();
      return { success: true };
    } catch (error: any) {
      console.error('Error adding attachment:', error);
      toast.error('Failed to add attachment: ' + error.message);
      return { success: false };
    }
  };

  // Add an attachment by URL (for links/external images)
  const addAttachmentByUrl = async (taskId: string, attachment: { name: string; url: string; type: string }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Bạn cần đăng nhập để thêm tài liệu');
        return { success: false };
      }

      // Insert attachment record
      const newAttachment = {
        id: uuidv4(),
        task_id: taskId,
        name: attachment.name,
        url: attachment.url,
        type: attachment.type,
        file_size: 0, // URL-based attachments don't have file size
        uploaded_by: user.id,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('attachments')
        .insert(newAttachment);

      if (error) throw error;

      toast.success('Đã thêm tài liệu đính kèm!');
      await fetchTasks();
      return { success: true };
    } catch (error: any) {
      console.error('Error adding attachment by URL:', error);
      toast.error('Lỗi khi thêm tài liệu: ' + error.message);
      return { success: false };
    }
  };

  // Delete an attachment
  const deleteAttachment = async (attachmentId: string) => {
    try {
      const { error } = await supabase
        .from('attachments')
        .delete()
        .eq('id', attachmentId);

      if (error) throw error;

      toast.success('Đã xóa tài liệu!');
      await fetchTasks();
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting attachment:', error);
      toast.error('Lỗi khi xóa tài liệu: ' + error.message);
      return { success: false };
    }
  };

  // Task Proposals (kept in memory for now, can migrate to DB later)
  const proposeTaskChange = async (taskId: string, changes: Partial<Task>, reason?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to propose changes');
        return { success: false };
      }

      const newProposal: TaskProposal = {
        id: uuidv4(),
        taskId,
        proposedBy: user.id,
        changes,
        reason,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      setTaskProposals(prev => [...prev, newProposal]);
      toast.success('Proposal submitted successfully');
      return { success: true, proposalId: newProposal.id };
    } catch (error: any) {
      console.error('Error proposing task change:', error);
      toast.error('Failed to propose change: ' + error.message);
      return { success: false };
    }
  };

  const approveProposal = async (proposalId: string) => {
    const proposal = taskProposals.find(p => p.id === proposalId);
    if (!proposal) return { success: false };

    const result = await updateTask(proposal.taskId, proposal.changes);

    if (result.success) {
      setTaskProposals(prev =>
        prev.map(p =>
          p.id === proposalId ? { ...p, status: 'approved' as const } : p
        )
      );
      toast.success('Proposal approved and applied');
    }

    return result;
  };

  const rejectProposal = (proposalId: string) => {
    setTaskProposals(prev =>
      prev.map(p =>
        p.id === proposalId ? { ...p, status: 'rejected' as const } : p
      )
    );
    toast.success('Proposal rejected');
    return { success: true };
  };

  return {
    tasks,
    taskProposals,
    loading,
    createTask,
    updateTask,
    deleteTask,
    restoreTask,
    permanentlyDeleteTask,
    addComment,
    addAttachment,
    addAttachmentByUrl,
    deleteAttachment,
    proposeTaskChange,
    approveProposal,
    rejectProposal,
  };
};
