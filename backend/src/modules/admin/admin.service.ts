import { getSupabaseAdminClient } from '../../config/supabase.js';
import logger from '../../utils/logger.js';
import type { ServiceResult, PaginationParams } from '../../types/index.js';
import type { Tables, TablesUpdate } from '../../types/database.js';

const supabase = getSupabaseAdminClient();

/**
 * Get all users (admin only)
 */
export async function getAllUsers(
  options: PaginationParams & { search?: string; status?: string; role?: string }
): Promise<ServiceResult<{ users: Tables<'users'>[]; total: number }>> {
  try {
    const { page = 1, limit = 20, search, status, role } = options;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('users')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%,username.ilike.%${search}%`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (role) {
      query = query.eq('role', role);
    }

    const { data: users, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      success: true,
      data: {
        users: users || [],
        total: count || 0,
      },
    };
  } catch (error) {
    logger.error('Error getting all users', { error });
    return { success: false, error: 'Failed to fetch users' };
  }
}

/**
 * Update user status (admin only)
 */
export async function updateUserStatus(
  userId: string,
  status: 'active' | 'pending' | 'suspended'
): Promise<ServiceResult<Tables<'users'>>> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // If suspending, revoke all sessions
    if (status === 'suspended') {
      await supabase.auth.admin.updateUserById(userId, {
        ban_duration: 'none', // Indefinite ban
      });
    } else if (status === 'active') {
      // Unban user
      await supabase.auth.admin.updateUserById(userId, {
        ban_duration: '0', // Remove ban
      });
    }

    return { success: true, data: user };
  } catch (error) {
    logger.error('Error updating user status', { error, userId });
    return { success: false, error: 'Failed to update user status' };
  }
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(
  userId: string,
  role: 'user' | 'admin'
): Promise<ServiceResult<Tables<'users'>>> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: user };
  } catch (error) {
    logger.error('Error updating user role', { error, userId });
    return { success: false, error: 'Failed to update user role' };
  }
}

/**
 * Delete user (admin only)
 */
export async function deleteUser(userId: string): Promise<ServiceResult<void>> {
  try {
    // Delete from auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      logger.error('Error deleting auth user', { authError, userId });
    }

    // Delete from public.users (cascade should handle related records)
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    logger.error('Error deleting user', { error, userId });
    return { success: false, error: 'Failed to delete user' };
  }
}

/**
 * Get system statistics
 */
export async function getSystemStats(): Promise<ServiceResult<{
  totalUsers: number;
  activeUsers: number;
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
}>> {
  try {
    const [
      { count: totalUsers },
      { count: activeUsers },
      { count: totalProjects },
      { count: totalTasks },
      { count: completedTasks },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('projects').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'done').is('deleted_at', null),
    ]);

    return {
      success: true,
      data: {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalProjects: totalProjects || 0,
        totalTasks: totalTasks || 0,
        completedTasks: completedTasks || 0,
      },
    };
  } catch (error) {
    logger.error('Error getting system stats', { error });
    return { success: false, error: 'Failed to fetch system statistics' };
  }
}

/**
 * Get recent activity (admin only)
 */
export async function getRecentActivity(limit: number = 50): Promise<ServiceResult<Tables<'activity_logs'>[]>> {
  try {
    const { data: logs, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { success: true, data: logs || [] };
  } catch (error) {
    logger.error('Error getting recent activity', { error });
    return { success: false, error: 'Failed to fetch activity logs' };
  }
}

/**
 * Get all projects (admin only)
 */
export async function getAllProjects(
  options: PaginationParams & { search?: string; includeDeleted?: boolean }
): Promise<ServiceResult<{ projects: Tables<'projects'>[]; total: number }>> {
  try {
    const { page = 1, limit = 20, search, includeDeleted = false } = options;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('projects')
      .select('*', { count: 'exact' });

    if (!includeDeleted) {
      query = query.is('deleted_at', null);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,key.ilike.%${search}%`);
    }

    const { data: projects, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      success: true,
      data: {
        projects: projects || [],
        total: count || 0,
      },
    };
  } catch (error) {
    logger.error('Error getting all projects', { error });
    return { success: false, error: 'Failed to fetch projects' };
  }
}

/**
 * Force delete project (admin only)
 */
export async function forceDeleteProject(projectId: string): Promise<ServiceResult<void>> {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    logger.error('Error force deleting project', { error, projectId });
    return { success: false, error: 'Failed to delete project' };
  }
}

export default {
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getSystemStats,
  getRecentActivity,
  getAllProjects,
  forceDeleteProject,
};
