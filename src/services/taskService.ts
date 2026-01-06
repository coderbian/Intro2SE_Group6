/**
 * Task Service - Supabase CRUD operations for tasks
 */
import { getSupabaseClient } from '../lib/supabase-client';
import type { Database } from '../types/supabase';

type TaskRow = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];
type CommentRow = Database['public']['Tables']['comments']['Row'];
type AttachmentRow = Database['public']['Tables']['attachments']['Row'];

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

/**
 * Transform DB row to app Task model
 */
function transformTask(
    row: TaskRow,
    assignees: string[],
    comments: Comment[],
    attachments: Attachment[],
    labels: string[]
): Task {
    return {
        id: row.id,
        projectId: row.project_id || '',
        type: (row.type as 'user-story' | 'task') || 'task',
        title: row.title,
        description: row.description || '',
        priority: (row.priority as Task['priority']) || 'medium',
        status: (row.status as Task['status']) || 'todo',
        assignees,
        deadline: row.due_date || undefined,
        labels,
        storyPoints: row.story_points || undefined,
        parentTaskId: row.parent_id || undefined,
        sprintId: row.sprint_id || undefined,
        createdBy: row.reporter_id || '',
        createdAt: row.created_at || new Date().toISOString(),
        comments,
        attachments,
        deletedAt: row.deleted_at || undefined,
    };
}

/**
 * Fetch all tasks for given project IDs
 */
export async function fetchTasks(projectIds: string[]): Promise<Task[]> {
    const supabase = getSupabaseClient();

    if (projectIds.length === 0) return [];

    const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .in('project_id', projectIds);

    if (error) throw error;

    if (!tasks || tasks.length === 0) return [];

    const taskIds = tasks.map((t) => t.id);

    // Fetch assignees
    const { data: assigneesData } = await supabase
        .from('task_assignees')
        .select('task_id, user_id')
        .in('task_id', taskIds);

    // Fetch comments with author info
    const { data: commentsData } = await supabase
        .from('comments')
        .select(`*, author:users(name)`)
        .in('task_id', taskIds)
        .is('deleted_at', null);

    // Fetch attachments
    const { data: attachmentsData } = await supabase
        .from('attachments')
        .select('*')
        .in('task_id', taskIds);

    // Fetch labels
    const { data: labelsData } = await supabase
        .from('task_labels')
        .select(`task_id, label:labels(name)`)
        .in('task_id', taskIds);

    return tasks.map((task) => {
        const taskAssignees = (assigneesData || [])
            .filter((a) => a.task_id === task.id)
            .map((a) => a.user_id);

        const taskComments: Comment[] = (commentsData || [])
            .filter((c) => c.task_id === task.id)
            .map((c) => ({
                id: c.id,
                taskId: c.task_id || '',
                userId: c.author_id || '',
                userName: (c.author as any)?.name || '',
                content: c.content,
                createdAt: c.created_at || new Date().toISOString(),
            }));

        const taskAttachments: Attachment[] = (attachmentsData || [])
            .filter((a) => a.task_id === task.id)
            .map((a) => ({
                id: a.id,
                taskId: a.task_id || '',
                name: a.name,
                url: a.url,
                type: a.type,
                uploadedBy: a.uploaded_by || '',
                uploadedAt: a.created_at || new Date().toISOString(),
            }));

        const taskLabels = (labelsData || [])
            .filter((l) => l.task_id === task.id)
            .map((l) => (l.label as any)?.name || '');

        return transformTask(task, taskAssignees, taskComments, taskAttachments, taskLabels);
    });
}

/**
 * Get next task number for a project
 */
async function getNextTaskNumber(projectId: string): Promise<number> {
    const supabase = getSupabaseClient();

    const { data } = await supabase
        .from('tasks')
        .select('task_number')
        .eq('project_id', projectId)
        .order('task_number', { ascending: false })
        .limit(1);

    return (data?.[0]?.task_number || 0) + 1;
}

/**
 * Create a new task
 */
export async function createTask(
    task: Omit<Task, 'id' | 'createdAt' | 'comments' | 'attachments'>
): Promise<Task> {
    const supabase = getSupabaseClient();

    const taskNumber = await getNextTaskNumber(task.projectId);

    const insertData: TaskInsert = {
        project_id: task.projectId,
        title: task.title,
        description: task.description,
        type: task.type,
        status: task.status,
        priority: task.priority,
        due_date: task.deadline || null,
        story_points: task.storyPoints || null,
        parent_id: task.parentTaskId || null,
        sprint_id: task.sprintId || null,
        reporter_id: task.createdBy,
        task_number: taskNumber,
    };

    const { data, error } = await supabase
        .from('tasks')
        .insert(insertData)
        .select()
        .single();

    if (error) throw error;

    // Add assignees
    if (task.assignees.length > 0) {
        const assigneesInsert = task.assignees.map((userId) => ({
            task_id: data.id,
            user_id: userId,
            assigned_by: task.createdBy,
        }));

        await supabase.from('task_assignees').insert(assigneesInsert);
    }

    return transformTask(data, task.assignees, [], [], task.labels);
}

/**
 * Update a task
 */
export async function updateTask(
    taskId: string,
    updates: Partial<Task>
): Promise<Task> {
    const supabase = getSupabaseClient();

    const updateData: TaskUpdate = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.deadline !== undefined) updateData.due_date = updates.deadline;
    if (updates.storyPoints !== undefined) updateData.story_points = updates.storyPoints;
    if (updates.sprintId !== undefined) updateData.sprint_id = updates.sprintId || null;
    if (updates.parentTaskId !== undefined) updateData.parent_id = updates.parentTaskId || null;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .select()
        .single();

    if (error) throw error;

    // Update assignees if provided
    if (updates.assignees !== undefined) {
        await supabase.from('task_assignees').delete().eq('task_id', taskId);
        if (updates.assignees.length > 0) {
            const assigneesInsert = updates.assignees.map((userId) => ({
                task_id: taskId,
                user_id: userId,
            }));
            await supabase.from('task_assignees').insert(assigneesInsert);
        }
    }

    // Fetch current task data
    const { data: assigneesData } = await supabase
        .from('task_assignees')
        .select('user_id')
        .eq('task_id', taskId);

    const { data: commentsData } = await supabase
        .from('comments')
        .select(`*, author:users(name)`)
        .eq('task_id', taskId)
        .is('deleted_at', null);

    const { data: attachmentsData } = await supabase
        .from('attachments')
        .select('*')
        .eq('task_id', taskId);

    const assignees = (assigneesData || []).map((a) => a.user_id);
    const comments: Comment[] = (commentsData || []).map((c) => ({
        id: c.id,
        taskId: c.task_id || '',
        userId: c.author_id || '',
        userName: (c.author as any)?.name || '',
        content: c.content,
        createdAt: c.created_at || new Date().toISOString(),
    }));
    const attachments: Attachment[] = (attachmentsData || []).map((a) => ({
        id: a.id,
        taskId: a.task_id || '',
        name: a.name,
        url: a.url,
        type: a.type,
        uploadedBy: a.uploaded_by || '',
        uploadedAt: a.created_at || new Date().toISOString(),
    }));

    return transformTask(data, assignees, comments, attachments, updates.labels || []);
}

/**
 * Soft delete a task
 */
export async function deleteTask(taskId: string): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('tasks')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', taskId);

    if (error) throw error;
}

/**
 * Restore a soft-deleted task
 */
export async function restoreTask(taskId: string): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('tasks')
        .update({ deleted_at: null })
        .eq('id', taskId);

    if (error) throw error;
}

/**
 * Permanently delete a task
 */
export async function permanentlyDeleteTask(taskId: string): Promise<void> {
    const supabase = getSupabaseClient();

    // Delete related data first
    await supabase.from('task_assignees').delete().eq('task_id', taskId);
    await supabase.from('task_labels').delete().eq('task_id', taskId);
    await supabase.from('attachments').delete().eq('task_id', taskId);
    await supabase.from('comments').delete().eq('task_id', taskId);

    // Delete child tasks
    await supabase.from('tasks').delete().eq('parent_id', taskId);

    // Delete the task
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);

    if (error) throw error;
}

/**
 * Delete all tasks for a project
 */
export async function deleteTasksByProject(projectId: string): Promise<void> {
    const supabase = getSupabaseClient();

    // Get all task IDs for this project
    const { data: tasks } = await supabase
        .from('tasks')
        .select('id')
        .eq('project_id', projectId);

    if (!tasks || tasks.length === 0) return;

    const taskIds = tasks.map((t) => t.id);

    // Delete related data
    await supabase.from('task_assignees').delete().in('task_id', taskIds);
    await supabase.from('task_labels').delete().in('task_id', taskIds);
    await supabase.from('attachments').delete().in('task_id', taskIds);
    await supabase.from('comments').delete().in('task_id', taskIds);

    // Delete tasks
    await supabase.from('tasks').delete().eq('project_id', projectId);
}

/**
 * Add a comment to a task
 */
export async function addComment(
    taskId: string,
    authorId: string,
    content: string
): Promise<Comment> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('comments')
        .insert({
            task_id: taskId,
            author_id: authorId,
            content,
        })
        .select(`*, author:users(name)`)
        .single();

    if (error) throw error;

    return {
        id: data.id,
        taskId: data.task_id || '',
        userId: data.author_id || '',
        userName: (data.author as any)?.name || '',
        content: data.content,
        createdAt: data.created_at || new Date().toISOString(),
    };
}

/**
 * Add an attachment to a task
 */
export async function addAttachment(
    taskId: string,
    uploadedBy: string,
    file: { name: string; url: string; type: string; fileSize?: number }
): Promise<Attachment> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('attachments')
        .insert({
            task_id: taskId,
            uploaded_by: uploadedBy,
            name: file.name,
            url: file.url,
            type: file.type,
            file_size: file.fileSize || 0,
        })
        .select()
        .single();

    if (error) throw error;

    return {
        id: data.id,
        taskId: data.task_id || '',
        name: data.name,
        url: data.url,
        type: data.type,
        uploadedBy: data.uploaded_by || '',
        uploadedAt: data.created_at || new Date().toISOString(),
    };
}

/**
 * Create a task proposal (stored as task with status='proposed')
 * Note: Since DB doesn't have 'proposed' status, we'll use a separate approach
 * by adding a custom metadata field or using activity_logs
 */
export async function createTaskProposal(
    proposal: Omit<TaskProposal, 'id' | 'createdAt' | 'status'>
): Promise<TaskProposal> {
    const supabase = getSupabaseClient();

    // For now, we'll store proposals in activity_logs with entity_type='task_proposal'
    const { data, error } = await supabase
        .from('activity_logs')
        .insert({
            project_id: proposal.projectId,
            user_id: proposal.proposedBy,
            action: 'proposed',
            entity_type: 'task_proposal',
            new_value: {
                title: proposal.title,
                description: proposal.description,
                priority: proposal.priority,
                proposedByName: proposal.proposedByName,
                status: 'pending',
            },
        })
        .select()
        .single();

    if (error) throw error;

    return {
        id: data.id,
        projectId: proposal.projectId,
        title: proposal.title,
        description: proposal.description,
        priority: proposal.priority,
        proposedBy: proposal.proposedBy,
        proposedByName: proposal.proposedByName,
        status: 'pending',
        createdAt: data.created_at || new Date().toISOString(),
    };
}

/**
 * Fetch task proposals for a project
 */
export async function fetchTaskProposals(projectId: string): Promise<TaskProposal[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('project_id', projectId)
        .eq('entity_type', 'task_proposal');

    if (error) throw error;

    return (data || []).map((row) => {
        const newValue = row.new_value as any;
        return {
            id: row.id,
            projectId: row.project_id || '',
            title: newValue?.title || '',
            description: newValue?.description || '',
            priority: newValue?.priority || 'medium',
            proposedBy: row.user_id || '',
            proposedByName: newValue?.proposedByName || '',
            status: newValue?.status || 'pending',
            createdAt: row.created_at || new Date().toISOString(),
        };
    });
}

/**
 * Approve a task proposal
 */
export async function approveProposal(proposalId: string, approvedBy: string): Promise<Task> {
    const supabase = getSupabaseClient();

    // Get proposal data
    const { data: proposal, error: fetchError } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('id', proposalId)
        .single();

    if (fetchError) throw fetchError;

    const proposalData = proposal.new_value as any;

    // Create the task
    const newTask = await createTask({
        projectId: proposal.project_id || '',
        type: 'task',
        title: proposalData.title,
        description: proposalData.description,
        priority: proposalData.priority,
        status: 'todo',
        assignees: [proposal.user_id || ''],
        labels: [],
        createdBy: approvedBy,
    });

    // Update proposal status
    await supabase
        .from('activity_logs')
        .update({
            new_value: { ...proposalData, status: 'approved' },
        })
        .eq('id', proposalId);

    return newTask;
}

/**
 * Reject a task proposal
 */
export async function rejectProposal(proposalId: string): Promise<void> {
    const supabase = getSupabaseClient();

    const { data: proposal } = await supabase
        .from('activity_logs')
        .select('new_value')
        .eq('id', proposalId)
        .single();

    const proposalData = proposal?.new_value as any;

    await supabase
        .from('activity_logs')
        .update({
            new_value: { ...proposalData, status: 'rejected' },
        })
        .eq('id', proposalId);
}
