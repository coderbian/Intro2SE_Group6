import { getSupabaseAdminClient } from '../../config/supabase.js';
import logger from '../../utils/logger.js';
import type { Tables, TablesInsert, TablesUpdate } from '../../types/database.js';
import type { ServiceResult } from '../../types/index.js';

const supabase = getSupabaseAdminClient();

/**
 * Get labels by project
 */
export async function getLabelsByProject(projectId: string): Promise<ServiceResult<Tables<'labels'>[]>> {
  try {
    const { data: labels, error } = await supabase
      .from('labels')
      .select('*')
      .eq('project_id', projectId)
      .order('name', { ascending: true });

    if (error) throw error;

    return { success: true, data: labels || [] };
  } catch (error) {
    logger.error('Error getting labels', { error, projectId });
    return { success: false, error: 'Failed to fetch labels' };
  }
}

/**
 * Get label by ID
 */
export async function getLabelById(labelId: string): Promise<ServiceResult<Tables<'labels'>>> {
  try {
    const { data: label, error } = await supabase
      .from('labels')
      .select('*')
      .eq('id', labelId)
      .single();

    if (error || !label) {
      return { success: false, error: 'Label not found', statusCode: 404 };
    }

    return { success: true, data: label };
  } catch (error) {
    logger.error('Error getting label', { error, labelId });
    return { success: false, error: 'Failed to fetch label' };
  }
}

/**
 * Create label
 */
export async function createLabel(
  labelData: TablesInsert<'labels'>
): Promise<ServiceResult<Tables<'labels'>>> {
  try {
    // Check if label with same name already exists in project
    const { data: existing } = await supabase
      .from('labels')
      .select('id')
      .eq('project_id', labelData.project_id)
      .ilike('name', labelData.name)
      .single();

    if (existing) {
      return { success: false, error: 'Label with this name already exists', statusCode: 400 };
    }

    const { data: label, error } = await supabase
      .from('labels')
      .insert(labelData)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: label };
  } catch (error) {
    logger.error('Error creating label', { error });
    return { success: false, error: 'Failed to create label' };
  }
}

/**
 * Update label
 */
export async function updateLabel(
  labelId: string,
  updates: TablesUpdate<'labels'>
): Promise<ServiceResult<Tables<'labels'>>> {
  try {
    const { data: label, error } = await supabase
      .from('labels')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', labelId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: label };
  } catch (error) {
    logger.error('Error updating label', { error, labelId });
    return { success: false, error: 'Failed to update label' };
  }
}

/**
 * Delete label
 */
export async function deleteLabel(labelId: string): Promise<ServiceResult<void>> {
  try {
    // Remove label from all tasks first
    await supabase
      .from('task_labels')
      .delete()
      .eq('label_id', labelId);

    const { error } = await supabase
      .from('labels')
      .delete()
      .eq('id', labelId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    logger.error('Error deleting label', { error, labelId });
    return { success: false, error: 'Failed to delete label' };
  }
}

/**
 * Get tasks by label
 */
export async function getTasksByLabel(labelId: string): Promise<ServiceResult<Tables<'tasks'>[]>> {
  try {
    const { data: taskLabels, error: taskLabelsError } = await supabase
      .from('task_labels')
      .select('task_id')
      .eq('label_id', labelId);

    if (taskLabelsError) throw taskLabelsError;

    if (!taskLabels || taskLabels.length === 0) {
      return { success: true, data: [] };
    }

    const taskIds = taskLabels.map((tl) => tl.task_id);

    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .in('id', taskIds)
      .is('deleted_at', null);

    if (tasksError) throw tasksError;

    return { success: true, data: tasks || [] };
  } catch (error) {
    logger.error('Error getting tasks by label', { error, labelId });
    return { success: false, error: 'Failed to fetch tasks' };
  }
}

/**
 * Get label usage count
 */
export async function getLabelUsageCount(labelId: string): Promise<ServiceResult<number>> {
  try {
    const { count, error } = await supabase
      .from('task_labels')
      .select('*', { count: 'exact', head: true })
      .eq('label_id', labelId);

    if (error) throw error;

    return { success: true, data: count || 0 };
  } catch (error) {
    logger.error('Error getting label usage count', { error, labelId });
    return { success: false, error: 'Failed to fetch usage count' };
  }
}

export default {
  getLabelsByProject,
  getLabelById,
  createLabel,
  updateLabel,
  deleteLabel,
  getTasksByLabel,
  getLabelUsageCount,
};
