/**
 * Admin Service - Handles admin-related API calls to Supabase
 */
import { getSupabaseClient } from '../lib/supabase-client';
import type { Database } from '../types/supabase';

type UserRow = Database['public']['Tables']['users']['Row'];
type ActivityLogRow = Database['public']['Tables']['activity_logs']['Row'];

export interface AdminUser {
    id: string;
    email: string;
    name: string;
    avatar_url: string | null;
    phone: string | null;
    role: 'user' | 'admin';
    status: 'active' | 'pending' | 'suspended';
    created_at: string;
    last_login_at: string | null;
}

export interface ActivityLog {
    id: string;
    action: string;
    entity_type: string;
    entity_id: string | null;
    user_id: string | null;
    user_name?: string;
    user_email?: string;
    project_id: string | null;
    old_value: unknown;
    new_value: unknown;
    created_at: string;
}

export interface SystemStats {
    totalUsers: number;
    activeUsers: number;
    adminUsers: number;
    totalProjects: number;
    totalTasks: number;
}

/**
 * Fetch all users for admin management
 */
export async function getAllUsers(): Promise<AdminUser[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching users:', error);
        throw new Error('Không thể tải danh sách người dùng');
    }

    return (data || []).map((user: UserRow) => ({
        id: user.id,
        email: user.email || '',
        name: user.name || '',
        avatar_url: user.avatar_url,
        phone: user.phone,
        role: (user.role === 'admin' ? 'admin' : 'user') as 'user' | 'admin',
        status: (user.status || 'active') as 'active' | 'pending' | 'suspended',
        created_at: user.created_at || new Date().toISOString(),
        last_login_at: user.last_login_at,
    }));
}

/**
 * Update user status (activate/suspend)
 */
export async function updateUserStatus(
    userId: string,
    status: 'active' | 'suspended'
): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('users')
        .update({ status })
        .eq('id', userId);

    if (error) {
        console.error('Error updating user status:', error);
        throw new Error('Không thể cập nhật trạng thái người dùng');
    }
}

/**
 * Update user role
 */
export async function updateUserRole(
    userId: string,
    role: 'user' | 'admin'
): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', userId);

    if (error) {
        console.error('Error updating user role:', error);
        throw new Error('Không thể cập nhật vai trò người dùng');
    }
}

/**
 * Trigger password reset email for a user
 */
export async function resetUserPassword(email: string): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
        console.error('Error resetting password:', error);
        throw new Error('Không thể gửi email đặt lại mật khẩu');
    }
}

/**
 * Fetch activity logs for system monitoring
 */
export async function getActivityLogs(limit: number = 50): Promise<ActivityLog[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('activity_logs')
        .select(`
      *,
      users:user_id (name, email)
    `)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching activity logs:', error);
        throw new Error('Không thể tải nhật ký hoạt động');
    }

    return (data || []).map((log: ActivityLogRow & { users?: { name: string; email: string } | null }) => ({
        id: log.id,
        action: log.action || 'unknown',
        entity_type: log.entity_type || 'unknown',
        entity_id: log.entity_id,
        user_id: log.user_id,
        user_name: log.users?.name,
        user_email: log.users?.email,
        project_id: log.project_id,
        old_value: log.old_value,
        new_value: log.new_value,
        created_at: log.created_at || new Date().toISOString(),
    }));
}

/**
 * Fetch system statistics for dashboard
 */
export async function getSystemStats(): Promise<SystemStats> {
    const supabase = getSupabaseClient();

    // Fetch counts in parallel
    const [usersResult, projectsResult, tasksResult] = await Promise.all([
        supabase.from('users').select('id, role, status', { count: 'exact', head: false }),
        supabase.from('projects').select('id', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('tasks').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    ]);

    const users = usersResult.data || [];
    const totalUsers = users.length;
    const activeUsers = users.filter((u: { status?: string }) => u.status === 'active').length;
    const adminUsers = users.filter((u: { role?: string }) => u.role === 'admin').length;

    return {
        totalUsers,
        activeUsers,
        adminUsers,
        totalProjects: projectsResult.count || 0,
        totalTasks: tasksResult.count || 0,
    };
}

/**
 * Delete a user (soft delete - sets status to suspended)
 */
export async function deleteUser(userId: string): Promise<void> {
    // For safety, we soft-delete by suspending the user
    return updateUserStatus(userId, 'suspended');
}
