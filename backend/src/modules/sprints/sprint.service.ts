import { getSupabaseAdminClient } from '../../config/supabase.js';
import logger from '../../utils/logger.js';
import type { Tables, TablesInsert, TablesUpdate } from '../../types/database.js';
import type { ServiceResult } from '../../types/index.js';

const supabase = getSupabaseAdminClient();

export interface SprintWithTasks extends Tables<'sprints'> {
  tasks?: Tables<'tasks'>[];
}

/**
 * Get sprints by project
 */
export async function getSprintsByProject(
  projectId: string,
  status?: 'active' | 'completed'
): Promise<ServiceResult<SprintWithTasks[]>> {
  try {
    let query = supabase
      .from('sprints')
      .select('*')
      .eq('project_id', projectId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: sprints, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: sprints || [] };
  } catch (error) {
    logger.error('Error getting sprints', { error, projectId });
    return { success: false, error: 'Failed to fetch sprints' };
  }
}

/**
 * Get sprint by ID
 */
export async function getSprintById(sprintId: string): Promise<ServiceResult<SprintWithTasks>> {
  try {
    const { data: sprint, error } = await supabase
      .from('sprints')
      .select('*')
      .eq('id', sprintId)
      .single();

    if (error || !sprint) {
      return { success: false, error: 'Sprint not found', statusCode: 404 };
    }

    // Get tasks in this sprint
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('sprint_id', sprintId)
      .is('deleted_at', null);

    return {
      success: true,
      data: {
        ...sprint,
        tasks: tasks || [],
      },
    };
  } catch (error) {
    logger.error('Error getting sprint', { error, sprintId });
    return { success: false, error: 'Failed to fetch sprint' };
  }
}

/**
 * Get current active sprint for a project
 */
export async function getCurrentSprint(projectId: string): Promise<ServiceResult<SprintWithTasks | null>> {
  try {
    const { data: sprint, error } = await supabase
      .from('sprints')
      .select('*')
      .eq('project_id', projectId)
      .eq('status', 'active')
      .single();

    if (error?.code === 'PGRST116') {
      // No active sprint found
      return { success: true, data: null };
    }

    if (error) throw error;

    // Get tasks in this sprint
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('sprint_id', sprint.id)
      .is('deleted_at', null);

    return {
      success: true,
      data: {
        ...sprint,
        tasks: tasks || [],
      },
    };
  } catch (error) {
    logger.error('Error getting current sprint', { error, projectId });
    return { success: false, error: 'Failed to fetch current sprint' };
  }
}

/**
 * Create a new sprint
 */
export async function createSprint(
  projectId: string,
  sprintData: {
    name: string;
    goal?: string;
    start_date?: string;
    end_date?: string;
    task_ids?: string[];
  }
): Promise<ServiceResult<SprintWithTasks>> {
  try {
    // Check if there's already an active sprint
    const { data: existingActive } = await supabase
      .from('sprints')
      .select('id')
      .eq('project_id', projectId)
      .eq('status', 'active')
      .single();

    if (existingActive) {
      return {
        success: false,
        error: 'There is already an active sprint. End it before creating a new one.',
        statusCode: 400,
      };
    }

    // Create sprint
    const { data: sprint, error } = await supabase
      .from('sprints')
      .insert({
        project_id: projectId,
        name: sprintData.name,
        goal: sprintData.goal,
        start_date: sprintData.start_date || new Date().toISOString(),
        end_date: sprintData.end_date,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;

    // Add tasks to sprint if provided
    if (sprintData.task_ids && sprintData.task_ids.length > 0) {
      await supabase
        .from('tasks')
        .update({ sprint_id: sprint.id, status: 'todo' })
        .in('id', sprintData.task_ids);
    }

    return await getSprintById(sprint.id);
  } catch (error) {
    logger.error('Error creating sprint', { error, projectId });
    return { success: false, error: 'Failed to create sprint' };
  }
}

/**
 * Update sprint
 */
export async function updateSprint(
  sprintId: string,
  updates: TablesUpdate<'sprints'>
): Promise<ServiceResult<SprintWithTasks>> {
  try {
    const { error } = await supabase
      .from('sprints')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', sprintId);

    if (error) throw error;

    return await getSprintById(sprintId);
  } catch (error) {
    logger.error('Error updating sprint', { error, sprintId });
    return { success: false, error: 'Failed to update sprint' };
  }
}

/**
 * End sprint
 */
export async function endSprint(
  sprintId: string,
  moveIncompleteToBacklog: boolean = true
): Promise<ServiceResult<SprintWithTasks>> {
  try {
    // Get sprint details first
    const { data: sprint, error: fetchError } = await supabase
      .from('sprints')
      .select('*')
      .eq('id', sprintId)
      .single();

    if (fetchError || !sprint) {
      return { success: false, error: 'Sprint not found', statusCode: 404 };
    }

    if (sprint.status === 'completed') {
      return { success: false, error: 'Sprint is already completed', statusCode: 400 };
    }

    // End the sprint
    const { error: updateError } = await supabase
      .from('sprints')
      .update({
        status: 'completed',
        end_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', sprintId);

    if (updateError) throw updateError;

    // Handle incomplete tasks
    if (moveIncompleteToBacklog) {
      // Move incomplete tasks back to backlog
      await supabase
        .from('tasks')
        .update({ sprint_id: null, status: 'backlog' })
        .eq('sprint_id', sprintId)
        .neq('status', 'done');
    }

    // Clear sprint_id for completed tasks
    await supabase
      .from('tasks')
      .update({ sprint_id: null })
      .eq('sprint_id', sprintId)
      .eq('status', 'done');

    return await getSprintById(sprintId);
  } catch (error) {
    logger.error('Error ending sprint', { error, sprintId });
    return { success: false, error: 'Failed to end sprint' };
  }
}

/**
 * Add tasks to sprint
 */
export async function addTasksToSprint(
  sprintId: string,
  taskIds: string[]
): Promise<ServiceResult<void>> {
  try {
    const { error } = await supabase
      .from('tasks')
      .update({ sprint_id: sprintId, status: 'todo' })
      .in('id', taskIds);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    logger.error('Error adding tasks to sprint', { error, sprintId });
    return { success: false, error: 'Failed to add tasks to sprint' };
  }
}

/**
 * Remove tasks from sprint
 */
export async function removeTasksFromSprint(
  sprintId: string,
  taskIds: string[]
): Promise<ServiceResult<void>> {
  try {
    const { error } = await supabase
      .from('tasks')
      .update({ sprint_id: null, status: 'backlog' })
      .in('id', taskIds)
      .eq('sprint_id', sprintId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    logger.error('Error removing tasks from sprint', { error, sprintId });
    return { success: false, error: 'Failed to remove tasks from sprint' };
  }
}

/**
 * Delete sprint
 */
export async function deleteSprint(sprintId: string): Promise<ServiceResult<void>> {
  try {
    // Move all tasks back to backlog first
    await supabase
      .from('tasks')
      .update({ sprint_id: null, status: 'backlog' })
      .eq('sprint_id', sprintId);

    const { error } = await supabase
      .from('sprints')
      .delete()
      .eq('id', sprintId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    logger.error('Error deleting sprint', { error, sprintId });
    return { success: false, error: 'Failed to delete sprint' };
  }
}

/**
 * Get sprint statistics
 */
export async function getSprintStats(sprintId: string): Promise<ServiceResult<{
  total: number;
  backlog: number;
  todo: number;
  inProgress: number;
  done: number;
  totalPoints: number;
  completedPoints: number;
}>> {
  try {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('status, story_points')
      .eq('sprint_id', sprintId)
      .is('deleted_at', null);

    if (error) throw error;

    const stats = {
      total: tasks?.length || 0,
      backlog: 0,
      todo: 0,
      inProgress: 0,
      done: 0,
      totalPoints: 0,
      completedPoints: 0,
    };

    (tasks || []).forEach((task) => {
      switch (task.status) {
        case 'backlog':
          stats.backlog++;
          break;
        case 'todo':
          stats.todo++;
          break;
        case 'in-progress':
          stats.inProgress++;
          break;
        case 'done':
          stats.done++;
          stats.completedPoints += task.story_points || 0;
          break;
      }
      stats.totalPoints += task.story_points || 0;
    });

    return { success: true, data: stats };
  } catch (error) {
    logger.error('Error getting sprint stats', { error, sprintId });
    return { success: false, error: 'Failed to fetch sprint statistics' };
  }
}

export default {
  getSprintsByProject,
  getSprintById,
  getCurrentSprint,
  createSprint,
  updateSprint,
  endSprint,
  addTasksToSprint,
  removeTasksFromSprint,
  deleteSprint,
  getSprintStats,
};
