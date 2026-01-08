import { getSupabaseAdminClient } from '../../config/supabase.js';
import { NotFoundError, ConflictError, BadRequestError } from '../../utils/errors.js';
import logger from '../../utils/logger.js';
import type { Tables, TablesInsert, TablesUpdate } from '../../types/database.js';
import type { ServiceResult } from '../../types/index.js';

const supabase = getSupabaseAdminClient();

export interface UserWithPreferences extends Tables<'users'> {
  preferences?: Tables<'user_preferences'> | null;
}

// Type for user with preferences query result
interface UserWithPreferencesResult {
  id: string;
  email: string;
  name: string;
  avatar_url?: string | null;
  phone?: string | null;
  role?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  user_preferences?: any;
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers(
  page: number = 1,
  limit: number = 20,
  search?: string
): Promise<ServiceResult<{ users: Tables<'users'>[]; total: number }>> {
  try {
    let query = supabase
      .from('users')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    return {
      success: true,
      data: {
        users: data || [],
        total: count || 0,
      },
    };
  } catch (error) {
    logger.error('Error getting all users', { error });
    return { success: false, error: 'Failed to fetch users' };
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<ServiceResult<UserWithPreferences>> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*, user_preferences(*)')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return { success: false, error: 'User not found', statusCode: 404 };
    }

    return {
      success: true,
      data: {
        ...user,
        preferences: Array.isArray(user.user_preferences) 
          ? user.user_preferences[0] 
          : user.user_preferences,
      } as UserWithPreferences,
    };
  } catch (error) {
    logger.error('Error getting user by ID', { error, userId });
    return { success: false, error: 'Failed to fetch user' };
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<ServiceResult<Tables<'users'>>> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return { success: false, error: 'User not found', statusCode: 404 };
    }

    return { success: true, data: user };
  } catch (error) {
    logger.error('Error getting user by email', { error, email });
    return { success: false, error: 'Failed to fetch user' };
  }
}

/**
 * Create user profile (after Supabase auth registration)
 */
export async function createUserProfile(
  userData: TablesInsert<'users'>
): Promise<ServiceResult<Tables<'users'>>> {
  try {
    // Check if user already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('id', userData.id)
      .single();

    if (existing) {
      return { success: false, error: 'User already exists', statusCode: 409 };
    }

    const { data: user, error } = await supabase
      .from('users')
      .insert(userData as any)
      .select()
      .single();

    if (error) throw error;

    // Create default preferences
    await supabase
      .from('user_preferences')
      .insert({
        user_id: (user as any).id,
        notifications: { email: true, push: true },
        display: { theme: 'light', language: 'vi' },
      } as any);

    return { success: true, data: user };
  } catch (error) {
    logger.error('Error creating user profile', { error, userData });
    return { success: false, error: 'Failed to create user profile' };
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: TablesUpdate<'users'>
): Promise<ServiceResult<Tables<'users'>>> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    if (!user) {
      return { success: false, error: 'User not found', statusCode: 404 };
    }

    return { success: true, data: user };
  } catch (error) {
    logger.error('Error updating user profile', { error, userId });
    return { success: false, error: 'Failed to update user profile' };
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
    logger.error('Error updating user role', { error, userId, role });
    return { success: false, error: 'Failed to update user role' };
  }
}

/**
 * Update user status (admin only)
 */
export async function updateUserStatus(
  userId: string,
  status: 'active' | 'inactive'
): Promise<ServiceResult<Tables<'users'>>> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: user };
  } catch (error) {
    logger.error('Error updating user status', { error, userId, status });
    return { success: false, error: 'Failed to update user status' };
  }
}

/**
 * Delete user (admin only - soft delete)
 */
export async function deleteUser(userId: string): Promise<ServiceResult<void>> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ status: 'inactive', updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    logger.error('Error deleting user', { error, userId });
    return { success: false, error: 'Failed to delete user' };
  }
}

/**
 * Get user preferences
 */
export async function getUserPreferences(
  userId: string
): Promise<ServiceResult<Tables<'user_preferences'>>> {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // Create default preferences if not found
      if (error.code === 'PGRST116') {
        const { data: newPrefs, error: createError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: userId,
            notifications: { email: true, push: true, taskAssigned: true, taskCompleted: true, projectUpdates: true },
            display: { theme: 'light', language: 'vi' },
          })
          .select()
          .single();

        if (createError) throw createError;
        return { success: true, data: newPrefs };
      }
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    logger.error('Error getting user preferences', { error, userId });
    return { success: false, error: 'Failed to fetch preferences' };
  }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  userId: string,
  preferences: Partial<TablesUpdate<'user_preferences'>>
): Promise<ServiceResult<Tables<'user_preferences'>>> {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    logger.error('Error updating user preferences', { error, userId });
    return { success: false, error: 'Failed to update preferences' };
  }
}

/**
 * Update last login timestamp
 */
export async function updateLastLogin(userId: string): Promise<void> {
  try {
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userId);
  } catch (error) {
    logger.error('Error updating last login', { error, userId });
  }
}

export default {
  getAllUsers,
  getUserById,
  getUserByEmail,
  createUserProfile,
  updateUserProfile,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getUserPreferences,
  updateUserPreferences,
  updateLastLogin,
};
