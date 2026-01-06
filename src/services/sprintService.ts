/**
 * Sprint Service - Supabase CRUD operations for sprints
 */
import { getSupabaseClient } from '../lib/supabase-client';
import type { Database } from '../types/supabase';

type SprintRow = Database['public']['Tables']['sprints']['Row'];
type SprintInsert = Database['public']['Tables']['sprints']['Insert'];

export interface Sprint {
    id: string;
    name: string;
    goal: string;
    projectId: string;
    startDate: string;
    endDate?: string;
    status: 'active' | 'completed';
}

/**
 * Transform DB row to app Sprint model
 */
function transformSprint(row: SprintRow): Sprint {
    return {
        id: row.id,
        name: row.name,
        goal: row.goal || '',
        projectId: row.project_id || '',
        startDate: row.start_date || new Date().toISOString(),
        endDate: row.end_date || undefined,
        status: row.status === 'completed' ? 'completed' : 'active',
    };
}

/**
 * Fetch all sprints for given project IDs
 */
export async function fetchSprints(projectIds: string[]): Promise<Sprint[]> {
    const supabase = getSupabaseClient();

    if (projectIds.length === 0) return [];

    const { data, error } = await supabase
        .from('sprints')
        .select('*')
        .in('project_id', projectIds)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(transformSprint);
}

/**
 * Create a new sprint
 */
export async function createSprint(
    projectId: string,
    name: string,
    goal: string
): Promise<Sprint> {
    const supabase = getSupabaseClient();

    const insertData: SprintInsert = {
        project_id: projectId,
        name,
        goal,
        start_date: new Date().toISOString().split('T')[0],
        status: 'active',
    };

    const { data, error } = await supabase
        .from('sprints')
        .insert(insertData)
        .select()
        .single();

    if (error) throw error;

    return transformSprint(data);
}

/**
 * Update sprint
 */
export async function updateSprint(
    sprintId: string,
    updates: Partial<Sprint>
): Promise<Sprint> {
    const supabase = getSupabaseClient();

    const updateData: Partial<SprintRow> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.goal !== undefined) updateData.goal = updates.goal;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.endDate !== undefined) updateData.end_date = updates.endDate;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
        .from('sprints')
        .update(updateData)
        .eq('id', sprintId)
        .select()
        .single();

    if (error) throw error;

    return transformSprint(data);
}

/**
 * End a sprint
 */
export async function endSprint(sprintId: string): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('sprints')
        .update({
            status: 'completed',
            end_date: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString(),
        })
        .eq('id', sprintId);

    if (error) throw error;
}

/**
 * Get active sprint for a project
 */
export async function getActiveSprint(projectId: string): Promise<Sprint | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('sprints')
        .select('*')
        .eq('project_id', projectId)
        .eq('status', 'active')
        .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found

    return data ? transformSprint(data) : null;
}

/**
 * Get completed sprints for a project
 */
export async function getCompletedSprints(projectId: string): Promise<Sprint[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('sprints')
        .select('*')
        .eq('project_id', projectId)
        .eq('status', 'completed')
        .order('end_date', { ascending: false });

    if (error) throw error;

    return (data || []).map(transformSprint);
}

/**
 * Assign tasks to a sprint
 */
export async function assignTasksToSprint(
    sprintId: string,
    taskIds: string[]
): Promise<void> {
    const supabase = getSupabaseClient();

    if (taskIds.length === 0) return;

    const { error } = await supabase
        .from('tasks')
        .update({ sprint_id: sprintId, status: 'todo' })
        .in('id', taskIds);

    if (error) throw error;
}

/**
 * Remove tasks from sprint (move to backlog)
 */
export async function removeTasksFromSprint(sprintId: string): Promise<void> {
    const supabase = getSupabaseClient();

    // Get all incomplete tasks in this sprint
    const { data: incompleteTasks } = await supabase
        .from('tasks')
        .select('id')
        .eq('sprint_id', sprintId)
        .neq('status', 'done');

    if (incompleteTasks && incompleteTasks.length > 0) {
        const taskIds = incompleteTasks.map((t) => t.id);
        await supabase
            .from('tasks')
            .update({ sprint_id: null, status: 'backlog' })
            .in('id', taskIds);
    }

    // Clear sprint_id for completed tasks too
    await supabase
        .from('tasks')
        .update({ sprint_id: null })
        .eq('sprint_id', sprintId)
        .eq('status', 'done');
}
