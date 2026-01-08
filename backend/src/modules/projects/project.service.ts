import { getSupabaseAdminClient } from '../../config/supabase.js';
import { generateProjectKey, generateToken } from '../../utils/helpers.js';
import logger from '../../utils/logger.js';
import type { Tables, TablesInsert, TablesUpdate } from '../../types/database.js';
import type { ServiceResult, ProjectMemberWithUser } from '../../types/index.js';

const supabase = getSupabaseAdminClient();

export interface ProjectWithMembers extends Tables<'projects'> {
  members: ProjectMemberWithUser[];
  owner?: {
    id: string;
    email: string;
    name: string;
    avatar_url: string | null;
  };
}

/**
 * Get all projects for a user
 */
export async function getUserProjects(
  userId: string,
  includeDeleted: boolean = false
): Promise<ServiceResult<ProjectWithMembers[]>> {
  try {
    // Get projects where user is a member
    const { data: memberships, error: memberError } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', userId);

    if (memberError) throw memberError;

    const projectIds = memberships?.map(m => m.project_id) || [];

    if (projectIds.length === 0) {
      return { success: true, data: [] };
    }

    // Build query
    let query = supabase
      .from('projects')
      .select(`
        *,
        owner:users!projects_owner_id_fkey(id, email, name, avatar_url),
        project_members(
          user_id,
          role,
          joined_at,
          user:users(id, email, name, avatar_url)
        )
      `)
      .in('id', projectIds);

    if (!includeDeleted) {
      query = query.is('deleted_at', null);
    }

    const { data: projects, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Transform data
    const transformedProjects: ProjectWithMembers[] = (projects || []).map(project => ({
      ...project,
      owner: Array.isArray(project.owner) ? project.owner[0] : project.owner,
      members: (project.project_members || []).map((pm: any) => ({
        userId: pm.user_id,
        role: pm.role,
        joinedAt: pm.joined_at,
        user: pm.user,
      })),
    }));

    return { success: true, data: transformedProjects };
  } catch (error) {
    logger.error('Error getting user projects', { error, userId });
    return { success: false, error: 'Failed to fetch projects' };
  }
}

/**
 * Get project by ID
 */
export async function getProjectById(
  projectId: string
): Promise<ServiceResult<ProjectWithMembers>> {
  try {
    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        owner:users!projects_owner_id_fkey(id, email, name, avatar_url),
        project_members(
          user_id,
          role,
          joined_at,
          user:users(id, email, name, avatar_url)
        )
      `)
      .eq('id', projectId)
      .single();

    if (error || !project) {
      return { success: false, error: 'Project not found', statusCode: 404 };
    }

    const transformedProject: ProjectWithMembers = {
      ...project,
      owner: Array.isArray(project.owner) ? project.owner[0] : project.owner,
      members: (project.project_members || []).map((pm: any) => ({
        userId: pm.user_id,
        role: pm.role,
        joinedAt: pm.joined_at,
        user: pm.user,
      })),
    };

    return { success: true, data: transformedProject };
  } catch (error) {
    logger.error('Error getting project', { error, projectId });
    return { success: false, error: 'Failed to fetch project' };
  }
}

/**
 * Create a new project
 */
export async function createProject(
  ownerId: string,
  projectData: {
    name: string;
    description?: string;
    template?: string;
    visibility?: string;
    deadline?: string;
  }
): Promise<ServiceResult<ProjectWithMembers>> {
  try {
    // Generate unique project key
    let key = generateProjectKey(projectData.name);
    let keyExists = true;
    let attempts = 0;

    while (keyExists && attempts < 10) {
      const { data: existing } = await supabase
        .from('projects')
        .select('id')
        .eq('key', key)
        .single();

      if (!existing) {
        keyExists = false;
      } else {
        key = `${key}${Math.floor(Math.random() * 10)}`;
        attempts++;
      }
    }

    // Create project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: projectData.name,
        description: projectData.description,
        template: projectData.template || 'kanban',
        visibility: projectData.visibility || 'private',
        deadline: projectData.deadline,
        owner_id: ownerId,
        key,
      })
      .select()
      .single();

    if (projectError) throw projectError;

    // Add owner as project manager
    const { error: memberError } = await supabase
      .from('project_members')
      .insert({
        project_id: project.id,
        user_id: ownerId,
        role: 'manager',
      });

    if (memberError) throw memberError;

    // Fetch complete project with members
    return await getProjectById(project.id);
  } catch (error) {
    logger.error('Error creating project', { error, ownerId });
    return { success: false, error: 'Failed to create project' };
  }
}

/**
 * Update project
 */
export async function updateProject(
  projectId: string,
  updates: TablesUpdate<'projects'>
): Promise<ServiceResult<ProjectWithMembers>> {
  try {
    const { data: project, error } = await supabase
      .from('projects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;

    return await getProjectById(projectId);
  } catch (error) {
    logger.error('Error updating project', { error, projectId });
    return { success: false, error: 'Failed to update project' };
  }
}

/**
 * Soft delete project
 */
export async function deleteProject(projectId: string): Promise<ServiceResult<void>> {
  try {
    const { error } = await supabase
      .from('projects')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', projectId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    logger.error('Error deleting project', { error, projectId });
    return { success: false, error: 'Failed to delete project' };
  }
}

/**
 * Restore deleted project
 */
export async function restoreProject(projectId: string): Promise<ServiceResult<ProjectWithMembers>> {
  try {
    const { error } = await supabase
      .from('projects')
      .update({ deleted_at: null, updated_at: new Date().toISOString() })
      .eq('id', projectId);

    if (error) throw error;

    return await getProjectById(projectId);
  } catch (error) {
    logger.error('Error restoring project', { error, projectId });
    return { success: false, error: 'Failed to restore project' };
  }
}

/**
 * Permanently delete project
 */
export async function permanentlyDeleteProject(projectId: string): Promise<ServiceResult<void>> {
  try {
    // Get task IDs first for cascading deletes
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id')
      .eq('project_id', projectId);
    const taskIds = tasks?.map(t => t.id) || [];

    // Get board IDs for cascading deletes  
    const { data: boards } = await supabase
      .from('boards')
      .select('id')
      .eq('project_id', projectId);
    const boardIds = boards?.map(b => b.id) || [];

    // Delete all related data in order
    if (taskIds.length > 0) {
      await supabase.from('task_assignees').delete().in('task_id', taskIds);
      await supabase.from('task_labels').delete().in('task_id', taskIds);
      await supabase.from('comments').delete().in('task_id', taskIds);
      await supabase.from('attachments').delete().in('task_id', taskIds);
    }
    await supabase.from('tasks').delete().eq('project_id', projectId);
    await supabase.from('sprints').delete().eq('project_id', projectId);
    await supabase.from('labels').delete().eq('project_id', projectId);
    if (boardIds.length > 0) {
      await supabase.from('lists').delete().in('board_id', boardIds);
    }
    await supabase.from('boards').delete().eq('project_id', projectId);
    await supabase.from('join_requests').delete().eq('project_id', projectId);
    await supabase.from('project_members').delete().eq('project_id', projectId);
    await supabase.from('activity_logs').delete().eq('project_id', projectId);
    
    const { error } = await supabase.from('projects').delete().eq('id', projectId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    logger.error('Error permanently deleting project', { error, projectId });
    return { success: false, error: 'Failed to permanently delete project' };
  }
}

/**
 * Add member to project
 */
export async function addMember(
  projectId: string,
  userId: string,
  role: 'manager' | 'member' = 'member'
): Promise<ServiceResult<ProjectMemberWithUser>> {
  try {
    // Check if already a member
    const { data: existing } = await supabase
      .from('project_members')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      return { success: false, error: 'User is already a member', statusCode: 409 };
    }

    // Add member
    const { error } = await supabase
      .from('project_members')
      .insert({
        project_id: projectId,
        user_id: userId,
        role,
      });

    if (error) throw error;

    // Get member with user details
    const { data: member, error: fetchError } = await supabase
      .from('project_members')
      .select(`
        user_id,
        role,
        joined_at,
        user:users(id, email, name, avatar_url)
      `)
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    return {
      success: true,
      data: {
        userId: member.user_id,
        role: member.role,
        joinedAt: member.joined_at,
        user: member.user as any,
      },
    };
  } catch (error) {
    logger.error('Error adding member', { error, projectId, userId });
    return { success: false, error: 'Failed to add member' };
  }
}

/**
 * Remove member from project
 */
export async function removeMember(
  projectId: string,
  userId: string
): Promise<ServiceResult<void>> {
  try {
    // Check if user is the owner
    const { data: project } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', projectId)
      .single();

    if (project?.owner_id === userId) {
      return { success: false, error: 'Cannot remove project owner', statusCode: 400 };
    }

    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (error) throw error;

    // Also remove from task assignments
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id')
      .eq('project_id', projectId);
    const taskIds = tasks?.map(t => t.id) || [];
    
    if (taskIds.length > 0) {
      await supabase
        .from('task_assignees')
        .delete()
        .eq('user_id', userId)
        .in('task_id', taskIds);
    }

    return { success: true };
  } catch (error) {
    logger.error('Error removing member', { error, projectId, userId });
    return { success: false, error: 'Failed to remove member' };
  }
}

/**
 * Update member role
 */
export async function updateMemberRole(
  projectId: string,
  userId: string,
  role: 'manager' | 'member'
): Promise<ServiceResult<ProjectMemberWithUser>> {
  try {
    const { error } = await supabase
      .from('project_members')
      .update({ role })
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (error) throw error;

    const { data: member, error: fetchError } = await supabase
      .from('project_members')
      .select(`
        user_id,
        role,
        joined_at,
        user:users(id, email, name, avatar_url)
      `)
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    return {
      success: true,
      data: {
        userId: member.user_id,
        role: member.role,
        joinedAt: member.joined_at,
        user: member.user as any,
      },
    };
  } catch (error) {
    logger.error('Error updating member role', { error, projectId, userId });
    return { success: false, error: 'Failed to update member role' };
  }
}

/**
 * Get project members
 */
export async function getProjectMembers(
  projectId: string
): Promise<ServiceResult<ProjectMemberWithUser[]>> {
  try {
    const { data: members, error } = await supabase
      .from('project_members')
      .select(`
        user_id,
        role,
        joined_at,
        user:users(id, email, name, avatar_url)
      `)
      .eq('project_id', projectId);

    if (error) throw error;

    return {
      success: true,
      data: (members || []).map(m => ({
        userId: m.user_id,
        role: m.role,
        joinedAt: m.joined_at,
        user: m.user as any,
      })),
    };
  } catch (error) {
    logger.error('Error getting project members', { error, projectId });
    return { success: false, error: 'Failed to fetch project members' };
  }
}

/**
 * Send project invitation
 */
export async function sendInvitation(
  projectId: string,
  email: string,
  invitedBy: string,
  role: 'manager' | 'member' = 'member'
): Promise<ServiceResult<Tables<'join_requests'>>> {
  try {
    // Check if user exists
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    // Check for existing pending invitation
    const { data: existing } = await supabase
      .from('join_requests')
      .select('id')
      .eq('project_id', projectId)
      .eq('email', email)
      .eq('status', 'pending')
      .single();

    if (existing) {
      return { success: false, error: 'Invitation already sent', statusCode: 409 };
    }

    // If user exists, check if already a member
    if (user) {
      const { data: membership } = await supabase
        .from('project_members')
        .select('user_id')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single();

      if (membership) {
        return { success: false, error: 'User is already a member', statusCode: 409 };
      }
    }

    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const { data: invitation, error } = await supabase
      .from('join_requests')
      .insert({
        project_id: projectId,
        user_id: user?.id,
        email,
        invited_by: invitedBy,
        request_type: 'invite',
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: invitation };
  } catch (error) {
    logger.error('Error sending invitation', { error, projectId, email });
    return { success: false, error: 'Failed to send invitation' };
  }
}

/**
 * Get pending invitations for a project
 */
export async function getProjectInvitations(
  projectId: string
): Promise<ServiceResult<Tables<'join_requests'>[]>> {
  try {
    const { data, error } = await supabase
      .from('join_requests')
      .select('*')
      .eq('project_id', projectId)
      .eq('request_type', 'invite')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    logger.error('Error getting project invitations', { error, projectId });
    return { success: false, error: 'Failed to fetch invitations' };
  }
}

/**
 * Get user's pending invitations
 */
export async function getUserInvitations(
  userId: string,
  email: string
): Promise<ServiceResult<any[]>> {
  try {
    const { data, error } = await supabase
      .from('join_requests')
      .select(`
        *,
        project:projects(id, name, description)
      `)
      .or(`user_id.eq.${userId},email.eq.${email}`)
      .eq('request_type', 'invite')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    logger.error('Error getting user invitations', { error, userId });
    return { success: false, error: 'Failed to fetch invitations' };
  }
}

/**
 * Respond to invitation
 */
export async function respondToInvitation(
  invitationId: string,
  userId: string,
  accept: boolean
): Promise<ServiceResult<void>> {
  try {
    const { data: invitation, error: fetchError } = await supabase
      .from('join_requests')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (fetchError || !invitation) {
      return { success: false, error: 'Invitation not found', statusCode: 404 };
    }

    if (invitation.status !== 'pending') {
      return { success: false, error: 'Invitation already processed', statusCode: 400 };
    }

    // Update invitation status
    const { error: updateError } = await supabase
      .from('join_requests')
      .update({ status: accept ? 'accepted' : 'rejected' })
      .eq('id', invitationId);

    if (updateError) throw updateError;

    // If accepted, add user as member
    if (accept && invitation.project_id) {
      await addMember(invitation.project_id, userId, 'member');
    }

    return { success: true };
  } catch (error) {
    logger.error('Error responding to invitation', { error, invitationId });
    return { success: false, error: 'Failed to respond to invitation' };
  }
}

/**
 * Get deleted projects (trash)
 */
export async function getDeletedProjects(
  userId: string
): Promise<ServiceResult<ProjectWithMembers[]>> {
  try {
    const { data: memberships, error: memberError } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', userId);

    if (memberError) throw memberError;

    const projectIds = memberships?.map(m => m.project_id) || [];

    if (projectIds.length === 0) {
      return { success: true, data: [] };
    }

    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        *,
        owner:users!projects_owner_id_fkey(id, email, name, avatar_url),
        project_members(
          user_id,
          role,
          joined_at,
          user:users(id, email, name, avatar_url)
        )
      `)
      .in('id', projectIds)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });

    if (error) throw error;

    const transformedProjects: ProjectWithMembers[] = (projects || []).map(project => ({
      ...project,
      owner: Array.isArray(project.owner) ? project.owner[0] : project.owner,
      members: (project.project_members || []).map((pm: any) => ({
        userId: pm.user_id,
        role: pm.role,
        joinedAt: pm.joined_at,
        user: pm.user,
      })),
    }));

    return { success: true, data: transformedProjects };
  } catch (error) {
    logger.error('Error getting deleted projects', { error, userId });
    return { success: false, error: 'Failed to fetch deleted projects' };
  }
}

export default {
  getUserProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  restoreProject,
  permanentlyDeleteProject,
  addMember,
  removeMember,
  updateMemberRole,
  getProjectMembers,
  sendInvitation,
  getProjectInvitations,
  getUserInvitations,
  respondToInvitation,
  getDeletedProjects,
};
