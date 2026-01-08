import { getSupabaseAdminClient } from '../../config/supabase.js';
import logger from '../../utils/logger.js';
import type { Tables, TablesInsert, TablesUpdate } from '../../types/database.js';
import type { ServiceResult, TaskWithRelations, CommentWithAuthor } from '../../types/index.js';

const supabase = getSupabaseAdminClient();

/**
 * Get tasks by project
 */
export async function getTasksByProject(
  projectId: string,
  filters?: {
    status?: string;
    priority?: string;
    assigneeId?: string;
    sprintId?: string;
    parentId?: string;
    type?: string;
    includeDeleted?: boolean;
  }
): Promise<ServiceResult<TaskWithRelations[]>> {
  try {
    let query = supabase
      .from('tasks')
      .select(`
        *,
        reporter:users!tasks_reporter_id_fkey(id, email, name, avatar_url),
        task_assignees(
          user_id,
          user:users(id, email, name, avatar_url)
        ),
        task_labels(
          label:labels(id, name, color)
        ),
        comments(
          *,
          author:users!comments_author_id_fkey(id, email, name, avatar_url)
        ),
        attachments(*)
      `)
      .eq('project_id', projectId);

    if (!filters?.includeDeleted) {
      query = query.is('deleted_at', null);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters?.assigneeId) {
      query = query.contains('task_assignees', [{ user_id: filters.assigneeId }]);
    }
    if (filters?.sprintId) {
      query = query.eq('sprint_id', filters.sprintId);
    }
    if (filters?.parentId !== undefined) {
      if (filters.parentId === null) {
        query = query.is('parent_id', null);
      } else {
        query = query.eq('parent_id', filters.parentId);
      }
    }
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    const { data: tasks, error } = await query.order('position_index', { ascending: true });

    if (error) throw error;

    // Transform data
    const transformedTasks: TaskWithRelations[] = (tasks || []).map((task: any) => ({
      ...task,
      reporter: task.reporter,
      assignees: (task.task_assignees || []).map((ta: any) => ({
        userId: ta.user_id,
        user: ta.user,
      })),
      labels: (task.task_labels || []).map((tl: any) => tl.label).filter(Boolean),
      comments: (task.comments || []).map((c: any) => ({
        ...c,
        author: c.author,
      })),
      attachments: task.attachments || [],
    }));

    return { success: true, data: transformedTasks };
  } catch (error) {
    logger.error('Error getting tasks by project', { error, projectId });
    return { success: false, error: 'Failed to fetch tasks' };
  }
}

/**
 * Get task by ID
 */
export async function getTaskById(taskId: string): Promise<ServiceResult<TaskWithRelations>> {
  try {
    const { data: task, error } = await supabase
      .from('tasks')
      .select(`
        *,
        reporter:users!tasks_reporter_id_fkey(id, email, name, avatar_url),
        task_assignees(
          user_id,
          user:users(id, email, name, avatar_url)
        ),
        task_labels(
          label:labels(id, name, color)
        ),
        comments(
          *,
          author:users!comments_author_id_fkey(id, email, name, avatar_url)
        ),
        attachments(*)
      `)
      .eq('id', taskId)
      .single();

    if (error || !task) {
      return { success: false, error: 'Task not found', statusCode: 404 };
    }

    const transformedTask: TaskWithRelations = {
      ...task,
      reporter: (task as any).reporter,
      assignees: ((task as any).task_assignees || []).map((ta: any) => ({
        userId: ta.user_id,
        user: ta.user,
      })),
      labels: ((task as any).task_labels || []).map((tl: any) => tl.label).filter(Boolean),
      comments: ((task as any).comments || []).map((c: any) => ({
        ...c,
        author: c.author,
      })),
      attachments: (task as any).attachments || [],
    };

    return { success: true, data: transformedTask };
  } catch (error) {
    logger.error('Error getting task', { error, taskId });
    return { success: false, error: 'Failed to fetch task' };
  }
}

/**
 * Get next task number for a project
 */
async function getNextTaskNumber(projectId: string): Promise<number> {
  const { data } = await supabase
    .from('tasks')
    .select('task_number')
    .eq('project_id', projectId)
    .order('task_number', { ascending: false })
    .limit(1)
    .single();

  return (data?.task_number || 0) + 1;
}

/**
 * Create a new task
 */
export async function createTask(
  projectId: string,
  reporterId: string,
  taskData: {
    title: string;
    description?: string;
    type?: string;
    status?: string;
    priority?: string;
    assignees?: string[];
    labels?: string[];
    due_date?: string | null;
    story_points?: number | null;
    parent_id?: string | null;
    sprint_id?: string | null;
    time_estimate?: number | null;
  }
): Promise<ServiceResult<TaskWithRelations>> {
  try {
    const taskNumber = await getNextTaskNumber(projectId);

    // Create task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        project_id: projectId,
        reporter_id: reporterId,
        title: taskData.title,
        description: taskData.description,
        type: taskData.type || 'task',
        status: taskData.status || 'backlog',
        priority: taskData.priority || 'medium',
        due_date: taskData.due_date,
        story_points: taskData.story_points,
        parent_id: taskData.parent_id,
        sprint_id: taskData.sprint_id,
        time_estimate: taskData.time_estimate,
        task_number: taskNumber,
      })
      .select()
      .single();

    if (taskError) throw taskError;

    // Add assignees
    if (taskData.assignees && taskData.assignees.length > 0) {
      const assigneeRecords = taskData.assignees.map(userId => ({
        task_id: task.id,
        user_id: userId,
        assigned_by: reporterId,
      }));

      await supabase.from('task_assignees').insert(assigneeRecords);
    }

    // Add labels
    if (taskData.labels && taskData.labels.length > 0) {
      const labelRecords = taskData.labels.map(labelId => ({
        task_id: task.id,
        label_id: labelId,
      }));

      await supabase.from('task_labels').insert(labelRecords);
    }

    return await getTaskById(task.id);
  } catch (error) {
    logger.error('Error creating task', { error, projectId });
    return { success: false, error: 'Failed to create task' };
  }
}

/**
 * Update task
 */
export async function updateTask(
  taskId: string,
  updates: Partial<{
    title: string;
    description: string | null;
    type: string;
    status: string;
    priority: string;
    assignees: string[];
    labels: string[];
    due_date: string | null;
    story_points: number | null;
    parent_id: string | null;
    sprint_id: string | null;
    time_estimate: number | null;
    time_spent: number | null;
    position_index: number;
  }>,
  updaterId?: string
): Promise<ServiceResult<TaskWithRelations>> {
  try {
    // Separate relational updates
    const { assignees, labels, ...taskUpdates } = updates;

    // Update task fields
    if (Object.keys(taskUpdates).length > 0) {
      const { error } = await supabase
        .from('tasks')
        .update({ ...taskUpdates, updated_at: new Date().toISOString() })
        .eq('id', taskId);

      if (error) throw error;
    }

    // Update assignees if provided
    if (assignees !== undefined) {
      // Remove existing assignees
      await supabase.from('task_assignees').delete().eq('task_id', taskId);

      // Add new assignees
      if (assignees.length > 0) {
        const assigneeRecords = assignees.map(userId => ({
          task_id: taskId,
          user_id: userId,
          assigned_by: updaterId,
        }));

        await supabase.from('task_assignees').insert(assigneeRecords);
      }
    }

    // Update labels if provided
    if (labels !== undefined) {
      // Remove existing labels
      await supabase.from('task_labels').delete().eq('task_id', taskId);

      // Add new labels
      if (labels.length > 0) {
        const labelRecords = labels.map(labelId => ({
          task_id: taskId,
          label_id: labelId,
        }));

        await supabase.from('task_labels').insert(labelRecords);
      }
    }

    return await getTaskById(taskId);
  } catch (error) {
    logger.error('Error updating task', { error, taskId });
    return { success: false, error: 'Failed to update task' };
  }
}

/**
 * Soft delete task
 */
export async function deleteTask(taskId: string): Promise<ServiceResult<void>> {
  try {
    const { error } = await supabase
      .from('tasks')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', taskId);

    if (error) throw error;

    // Also soft delete child tasks
    await supabase
      .from('tasks')
      .update({ deleted_at: new Date().toISOString() })
      .eq('parent_id', taskId);

    return { success: true };
  } catch (error) {
    logger.error('Error deleting task', { error, taskId });
    return { success: false, error: 'Failed to delete task' };
  }
}

/**
 * Restore deleted task
 */
export async function restoreTask(taskId: string): Promise<ServiceResult<TaskWithRelations>> {
  try {
    const { error } = await supabase
      .from('tasks')
      .update({ deleted_at: null, updated_at: new Date().toISOString() })
      .eq('id', taskId);

    if (error) throw error;

    return await getTaskById(taskId);
  } catch (error) {
    logger.error('Error restoring task', { error, taskId });
    return { success: false, error: 'Failed to restore task' };
  }
}

/**
 * Permanently delete task
 */
export async function permanentlyDeleteTask(taskId: string): Promise<ServiceResult<void>> {
  try {
    // Delete related data
    await supabase.from('task_assignees').delete().eq('task_id', taskId);
    await supabase.from('task_labels').delete().eq('task_id', taskId);
    await supabase.from('attachments').delete().eq('task_id', taskId);
    await supabase.from('comments').delete().eq('task_id', taskId);
    
    // Delete child tasks first
    const { data: children } = await supabase
      .from('tasks')
      .select('id')
      .eq('parent_id', taskId);

    if (children) {
      for (const child of children) {
        await permanentlyDeleteTask(child.id);
      }
    }

    const { error } = await supabase.from('tasks').delete().eq('id', taskId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    logger.error('Error permanently deleting task', { error, taskId });
    return { success: false, error: 'Failed to permanently delete task' };
  }
}

/**
 * Move task (change status/position)
 */
export async function moveTask(
  taskId: string,
  status: string,
  positionIndex?: number
): Promise<ServiceResult<TaskWithRelations>> {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (positionIndex !== undefined) {
      updateData.position_index = positionIndex;
    }

    const { error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId);

    if (error) throw error;

    return await getTaskById(taskId);
  } catch (error) {
    logger.error('Error moving task', { error, taskId });
    return { success: false, error: 'Failed to move task' };
  }
}

/**
 * Add comment to task
 */
export async function addComment(
  taskId: string,
  authorId: string,
  content: string,
  parentId?: string
): Promise<ServiceResult<CommentWithAuthor>> {
  try {
    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        task_id: taskId,
        author_id: authorId,
        content,
        parent_id: parentId,
      })
      .select(`
        *,
        author:users!comments_author_id_fkey(id, email, name, avatar_url)
      `)
      .single();

    if (error) throw error;

    return {
      success: true,
      data: {
        ...comment,
        author: (comment as any).author,
      },
    };
  } catch (error) {
    logger.error('Error adding comment', { error, taskId });
    return { success: false, error: 'Failed to add comment' };
  }
}

/**
 * Update comment
 */
export async function updateComment(
  commentId: string,
  content: string
): Promise<ServiceResult<CommentWithAuthor>> {
  try {
    const { data: comment, error } = await supabase
      .from('comments')
      .update({
        content,
        is_edited: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', commentId)
      .select(`
        *,
        author:users!comments_author_id_fkey(id, email, name, avatar_url)
      `)
      .single();

    if (error) throw error;

    return {
      success: true,
      data: {
        ...comment,
        author: (comment as any).author,
      },
    };
  } catch (error) {
    logger.error('Error updating comment', { error, commentId });
    return { success: false, error: 'Failed to update comment' };
  }
}

/**
 * Delete comment
 */
export async function deleteComment(commentId: string): Promise<ServiceResult<void>> {
  try {
    const { error } = await supabase
      .from('comments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', commentId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    logger.error('Error deleting comment', { error, commentId });
    return { success: false, error: 'Failed to delete comment' };
  }
}

/**
 * Get deleted tasks (trash)
 */
export async function getDeletedTasks(projectId: string): Promise<ServiceResult<TaskWithRelations[]>> {
  try {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select(`
        *,
        reporter:users!tasks_reporter_id_fkey(id, email, name, avatar_url)
      `)
      .eq('project_id', projectId)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });

    if (error) throw error;

    return {
      success: true,
      data: (tasks || []).map((task: any) => ({
        ...task,
        reporter: task.reporter,
        assignees: [],
        labels: [],
        comments: [],
        attachments: [],
      })),
    };
  } catch (error) {
    logger.error('Error getting deleted tasks', { error, projectId });
    return { success: false, error: 'Failed to fetch deleted tasks' };
  }
}

export default {
  getTasksByProject,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  restoreTask,
  permanentlyDeleteTask,
  moveTask,
  addComment,
  updateComment,
  deleteComment,
  getDeletedTasks,
};
