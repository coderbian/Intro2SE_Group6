/**
 * Project Service - Supabase CRUD operations for projects
 */
import { getSupabaseClient } from '../lib/supabase-client';
import type { Database } from '../types/supabase';

type ProjectRow = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
type ProjectUpdate = Database['public']['Tables']['projects']['Update'];
type ProjectMemberRow = Database['public']['Tables']['project_members']['Row'];
type JoinRequestRow = Database['public']['Tables']['join_requests']['Row'];

export interface Project {
    id: string;
    name: string;
    description: string;
    deadline: string | null;
    ownerId: string;
    createdAt: string;
    template: 'kanban' | 'scrum';
    visibility: 'public' | 'private';
    members: ProjectMember[];
    deletedAt?: string;
}

export interface ProjectMember {
    userId: string;
    role: 'manager' | 'member';
    name: string;
    email: string;
    avatar?: string;
}

export interface ProjectInvitation {
    id: string;
    projectId: string;
    projectName: string;
    invitedEmail: string;
    invitedBy: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
}

export interface JoinRequest {
    id: string;
    projectId: string;
    projectName: string;
    userId: string;
    userName: string;
    userEmail: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
}

// Helper to transform DB row to app model
function transformProject(
    row: ProjectRow,
    members: Array<ProjectMemberRow & { user?: { name: string; email: string; avatar_url: string | null } }>
): Project {
    return {
        id: row.id,
        name: row.name,
        description: row.description || '',
        deadline: row.deadline,
        ownerId: row.owner_id || '',
        createdAt: row.created_at || new Date().toISOString(),
        template: (row.template as 'kanban' | 'scrum') || 'kanban',
        visibility: (row.visibility as 'public' | 'private') || 'private',
        members: members.map((m) => ({
            userId: m.user_id,
            role: m.role as 'manager' | 'member',
            name: m.user?.name || '',
            email: m.user?.email || '',
            avatar: m.user?.avatar_url || undefined,
        })),
        deletedAt: row.deleted_at || undefined,
    };
}

/**
 * Fetch all public projects (for Explore Projects feature)
 * TODO: Currently fetching all projects. Add visibility filter when UI supports public/private setting.
 */
export async function fetchAllProjects(): Promise<Project[]> {
    const supabase = getSupabaseClient();

    // Fetch all non-deleted projects (TODO: filter by visibility='public' when implemented)
    const { data: projects, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .is('deleted_at', null);

    console.log('[fetchAllProjects] Fetched projects:', projects?.length || 0, projects);
    console.log('[fetchAllProjects] Error:', projectError);

    if (projectError) {
        console.error('[fetchAllProjects] Query failed:', projectError.message, projectError.details, projectError.hint);
        throw projectError;
    }

    if (!projects || projects.length === 0) return [];

    const projectIds = projects.map((p) => p.id);

    // Fetch all members for these projects
    const { data: allMembers, error: membersError } = await supabase
        .from('project_members')
        .select(`
      *,
      user:users(name, email, avatar_url)
    `)
        .in('project_id', projectIds);

    if (membersError) throw membersError;

    return projects.map((project) => {
        const projectMembers = (allMembers || []).filter((m) => m.project_id === project.id);
        return transformProject(project, projectMembers as any);
    });
}

/**
 * Fetch all projects where user is a member
 */
export async function fetchProjects(userId: string): Promise<Project[]> {
    const supabase = getSupabaseClient();

    // Get projects where user is a member
    const { data: memberProjects, error: memberError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', userId);

    if (memberError) throw memberError;

    const projectIds = memberProjects?.map((m) => m.project_id) || [];
    if (projectIds.length === 0) return [];

    // Fetch projects with members
    const { data: projects, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .in('id', projectIds);

    if (projectError) throw projectError;

    // Fetch all members for these projects
    const { data: allMembers, error: membersError } = await supabase
        .from('project_members')
        .select(`
      *,
      user:users(name, email, avatar_url)
    `)
        .in('project_id', projectIds);

    if (membersError) throw membersError;

    return (projects || []).map((project) => {
        const projectMembers = (allMembers || []).filter((m) => m.project_id === project.id);
        return transformProject(project, projectMembers as any);
    });
}

/**
 * Create a new project
 */
export async function createProject(
    project: Omit<Project, 'id' | 'createdAt' | 'members'>,
    userId: string,
    userName: string,
    userEmail: string,
    userAvatar?: string
): Promise<Project> {
    const supabase = getSupabaseClient();

    // Generate a project key from name
    const key = project.name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 5) + Date.now().toString().slice(-4);

    const insertData: ProjectInsert = {
        name: project.name,
        description: project.description,
        deadline: project.deadline,
        owner_id: userId,
        template: project.template,
        visibility: project.visibility || 'private',
        key,
    };

    const { data, error } = await supabase
        .from('projects')
        .insert(insertData)
        .select()
        .single();

    if (error) throw error;

    // Add owner as a manager member
    const { error: memberError } = await supabase
        .from('project_members')
        .insert({
            project_id: data.id,
            user_id: userId,
            role: 'manager',
        });

    if (memberError) throw memberError;

    return {
        id: data.id,
        name: data.name,
        description: data.description || '',
        deadline: data.deadline,
        ownerId: data.owner_id || '',
        createdAt: data.created_at || new Date().toISOString(),
        template: (data.template as 'kanban' | 'scrum') || 'kanban',
        visibility: (data.visibility as 'public' | 'private') || 'private',
        members: [
            {
                userId,
                role: 'manager',
                name: userName,
                email: userEmail,
                avatar: userAvatar,
            },
        ],
        deletedAt: undefined,
    };
}

/**
 * Update a project
 */
export async function updateProject(
    projectId: string,
    updates: Partial<Project>
): Promise<Project> {
    const supabase = getSupabaseClient();

    const updateData: ProjectUpdate = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.deadline !== undefined) updateData.deadline = updates.deadline;
    if (updates.template !== undefined) updateData.template = updates.template;
    if (updates.visibility !== undefined) updateData.visibility = updates.visibility;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', projectId)
        .select()
        .single();

    if (error) throw error;

    // Fetch members
    const { data: members } = await supabase
        .from('project_members')
        .select(`*, user:users(name, email, avatar_url)`)
        .eq('project_id', projectId);

    return transformProject(data, (members || []) as any);
}

/**
 * Soft delete a project
 */
export async function deleteProject(projectId: string): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('projects')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', projectId);

    if (error) throw error;
}

/**
 * Restore a soft-deleted project
 */
export async function restoreProject(projectId: string): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('projects')
        .update({ deleted_at: null })
        .eq('id', projectId);

    if (error) throw error;
}

/**
 * Permanently delete a project
 */
export async function permanentlyDeleteProject(projectId: string): Promise<void> {
    const supabase = getSupabaseClient();

    // Delete project members first
    await supabase.from('project_members').delete().eq('project_id', projectId);

    // Delete the project
    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

    if (error) throw error;
}

/**
 * Add a member to a project
 */
export async function addProjectMember(
    projectId: string,
    userId: string,
    role: 'manager' | 'member' = 'member'
): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('project_members')
        .insert({
            project_id: projectId,
            user_id: userId,
            role,
        });

    if (error) throw error;
}

/**
 * Remove a member from a project
 */
export async function removeProjectMember(
    projectId: string,
    userId: string
): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId);

    if (error) throw error;
}

/**
 * Send an invitation to join a project
 */
export async function sendInvitation(
    projectId: string,
    email: string,
    invitedBy: string
): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase.from('join_requests').insert({
        project_id: projectId,
        email,
        invited_by: invitedBy,
        request_type: 'invite',
        status: 'pending',
    });

    if (error) throw error;
}

/**
 * Fetch pending invitations for a user by email
 */
export async function fetchInvitations(userEmail: string): Promise<ProjectInvitation[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('join_requests')
        .select(`*, project:projects(name)`)
        .eq('email', userEmail)
        .eq('request_type', 'invite')
        .eq('status', 'pending');

    if (error) throw error;

    return (data || []).map((row) => ({
        id: row.id,
        projectId: row.project_id || '',
        projectName: (row.project as any)?.name || '',
        invitedEmail: row.email || '',
        invitedBy: row.invited_by || '',
        status: row.status as 'pending' | 'accepted' | 'rejected',
        createdAt: row.created_at || new Date().toISOString(),
    }));
}

/**
 * Respond to an invitation
 */
export async function respondToInvitation(
    requestId: string,
    accept: boolean,
    userId?: string
): Promise<void> {
    const supabase = getSupabaseClient();

    const newStatus = accept ? 'accepted' : 'rejected';

    const { data: request, error: fetchError } = await supabase
        .from('join_requests')
        .select('project_id')
        .eq('id', requestId)
        .single();

    if (fetchError) throw fetchError;

    const { error } = await supabase
        .from('join_requests')
        .update({ status: newStatus })
        .eq('id', requestId);

    if (error) throw error;

    // If accepted, add user as member
    if (accept && userId && request?.project_id) {
        await addProjectMember(request.project_id, userId, 'member');
    }
}

/**
 * Create a join request
 */
export async function createJoinRequest(
    projectId: string,
    userId: string
): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase.from('join_requests').insert({
        project_id: projectId,
        user_id: userId,
        request_type: 'request',
        status: 'pending',
    });

    if (error) throw error;
}

/**
 * Fetch join requests for projects owned by user
 */
export async function fetchJoinRequests(projectIds: string[]): Promise<JoinRequest[]> {
    const supabase = getSupabaseClient();

    if (projectIds.length === 0) return [];

    const { data, error } = await supabase
        .from('join_requests')
        .select(`*, project:projects(name), user:users!join_requests_user_id_fkey(name, email)`)
        .in('project_id', projectIds)
        .eq('request_type', 'request')
        .eq('status', 'pending');

    if (error) throw error;

    return (data || []).map((row) => ({
        id: row.id,
        projectId: row.project_id || '',
        projectName: (row.project as any)?.name || '',
        userId: row.user_id || '',
        userName: (row.user as any)?.name || '',
        userEmail: (row.user as any)?.email || '',
        status: row.status as 'pending' | 'approved' | 'rejected',
        createdAt: row.created_at || new Date().toISOString(),
    }));
}

/**
 * Respond to a join request
 */
export async function respondToJoinRequest(
    requestId: string,
    approve: boolean
): Promise<void> {
    const supabase = getSupabaseClient();

    const newStatus = approve ? 'accepted' : 'rejected';

    const { data: request, error: fetchError } = await supabase
        .from('join_requests')
        .select('project_id, user_id')
        .eq('id', requestId)
        .single();

    if (fetchError) throw fetchError;

    const { error } = await supabase
        .from('join_requests')
        .update({ status: newStatus })
        .eq('id', requestId);

    if (error) throw error;

    // If approved, add user as member
    if (approve && request?.project_id && request?.user_id) {
        await addProjectMember(request.project_id, request.user_id, 'member');
    }
}
