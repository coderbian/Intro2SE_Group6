import { getSupabaseAdminClient, getSupabaseClient } from '../../config/supabase.js';
import logger from '../../utils/logger.js';
import type { ServiceResult } from '../../types/index.js';
import type { Tables } from '../../types/database.js';
import bcrypt from 'bcrypt';

const supabase = getSupabaseAdminClient();
const supabasePublic = getSupabaseClient();

interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
}

interface AuthResponse {
  user: Tables<'users'>;
  tokens: AuthTokens;
}

/**
 * Register new user
 */
export async function register(
  email: string,
  password: string,
  userData: { full_name?: string; username?: string }
): Promise<ServiceResult<AuthResponse>> {
  try {
    // Create auth user in Supabase
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Require email confirmation
      user_metadata: {
        full_name: userData.full_name,
        username: userData.username,
      },
    });

    if (authError) {
      logger.error('Auth registration error', { error: authError });
      if (authError.message.includes('already registered')) {
        return { success: false, error: 'Email already registered', statusCode: 400 };
      }
      return { success: false, error: authError.message };
    }

    // Create user in public.users table
    const { data: publicUser, error: publicError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: email.toLowerCase(),
        full_name: userData.full_name,
        username: userData.username || email.split('@')[0],
        role: 'user',
        status: 'pending', // Pending email verification
      })
      .select()
      .single();

    if (publicError) {
      logger.error('Public user creation error', { error: publicError });
      // Rollback auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      return { success: false, error: 'Failed to create user profile' };
    }

    // Sign in to get tokens
    const { data: signInData, error: signInError } = await supabasePublic.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !signInData.session) {
      return {
        success: true,
        data: {
          user: publicUser,
          tokens: {
            access_token: '',
            refresh_token: '',
            expires_in: 0,
          },
        },
      };
    }

    return {
      success: true,
      data: {
        user: publicUser,
        tokens: {
          access_token: signInData.session.access_token,
          refresh_token: signInData.session.refresh_token,
          expires_in: signInData.session.expires_in || 3600,
          expires_at: signInData.session.expires_at,
        },
      },
    };
  } catch (error) {
    logger.error('Registration error', { error });
    return { success: false, error: 'Registration failed' };
  }
}

/**
 * Login user
 */
export async function login(
  email: string,
  password: string
): Promise<ServiceResult<AuthResponse>> {
  try {
    const { data, error } = await supabasePublic.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.error('Login error', { error });
      if (error.message.includes('Invalid login credentials')) {
        return { success: false, error: 'Invalid email or password', statusCode: 401 };
      }
      return { success: false, error: error.message, statusCode: 401 };
    }

    if (!data.session || !data.user) {
      return { success: false, error: 'Login failed', statusCode: 401 };
    }

    // Get user from public.users table
    const { data: publicUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (userError || !publicUser) {
      return { success: false, error: 'User profile not found', statusCode: 404 };
    }

    // Check user status
    if (publicUser.status === 'suspended') {
      return { success: false, error: 'Your account has been suspended', statusCode: 403 };
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', data.user.id);

    return {
      success: true,
      data: {
        user: publicUser,
        tokens: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_in: data.session.expires_in || 3600,
          expires_at: data.session.expires_at,
        },
      },
    };
  } catch (error) {
    logger.error('Login error', { error });
    return { success: false, error: 'Login failed' };
  }
}

/**
 * Logout user
 */
export async function logout(accessToken: string): Promise<ServiceResult<void>> {
  try {
    const { error } = await supabase.auth.admin.signOut(accessToken);

    if (error) {
      logger.warn('Logout warning', { error });
    }

    return { success: true };
  } catch (error) {
    logger.error('Logout error', { error });
    return { success: false, error: 'Logout failed' };
  }
}

/**
 * Refresh tokens
 */
export async function refreshTokens(refreshToken: string): Promise<ServiceResult<AuthTokens>> {
  try {
    const { data, error } = await supabasePublic.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      return { success: false, error: 'Invalid refresh token', statusCode: 401 };
    }

    return {
      success: true,
      data: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in || 3600,
        expires_at: data.session.expires_at,
      },
    };
  } catch (error) {
    logger.error('Token refresh error', { error });
    return { success: false, error: 'Token refresh failed' };
  }
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string, redirectTo?: string): Promise<ServiceResult<void>> {
  try {
    const { error } = await supabasePublic.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      logger.error('Password reset request error', { error });
      // Don't reveal if email exists or not
      return { success: true };
    }

    return { success: true };
  } catch (error) {
    logger.error('Password reset request error', { error });
    return { success: true }; // Don't reveal errors
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(accessToken: string, newPassword: string): Promise<ServiceResult<void>> {
  try {
    const { error } = await supabase.auth.admin.updateUserById(accessToken, {
      password: newPassword,
    });

    if (error) {
      logger.error('Password reset error', { error });
      return { success: false, error: 'Failed to reset password' };
    }

    return { success: true };
  } catch (error) {
    logger.error('Password reset error', { error });
    return { success: false, error: 'Failed to reset password' };
  }
}

/**
 * Update password (for logged in user)
 */
export async function updatePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<ServiceResult<void>> {
  try {
    // Get user email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return { success: false, error: 'User not found', statusCode: 404 };
    }

    // Verify current password by trying to sign in
    const { error: signInError } = await supabasePublic.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      return { success: false, error: 'Current password is incorrect', statusCode: 400 };
    }

    // Update password
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      return { success: false, error: 'Failed to update password' };
    }

    return { success: true };
  } catch (error) {
    logger.error('Password update error', { error });
    return { success: false, error: 'Failed to update password' };
  }
}

/**
 * Verify email
 */
export async function verifyEmail(token: string, type: string): Promise<ServiceResult<AuthResponse>> {
  try {
    const { data, error } = await supabasePublic.auth.verifyOtp({
      token_hash: token,
      type: type as any,
    });

    if (error || !data.session || !data.user) {
      return { success: false, error: 'Invalid or expired verification token', statusCode: 400 };
    }

    // Update user status
    await supabase
      .from('users')
      .update({ status: 'active' })
      .eq('id', data.user.id);

    // Get updated user
    const { data: publicUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return {
      success: true,
      data: {
        user: publicUser!,
        tokens: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_in: data.session.expires_in || 3600,
          expires_at: data.session.expires_at,
        },
      },
    };
  } catch (error) {
    logger.error('Email verification error', { error });
    return { success: false, error: 'Email verification failed' };
  }
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(email: string, redirectTo?: string): Promise<ServiceResult<void>> {
  try {
    const { error } = await supabasePublic.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      logger.error('Resend verification error', { error });
    }

    return { success: true }; // Don't reveal errors
  } catch (error) {
    logger.error('Resend verification error', { error });
    return { success: true }; // Don't reveal errors
  }
}

/**
 * OAuth login
 */
export async function getOAuthUrl(
  provider: 'google' | 'github' | 'gitlab',
  redirectTo: string
): Promise<ServiceResult<{ url: string }>> {
  try {
    const { data, error } = await supabasePublic.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
      },
    });

    if (error || !data.url) {
      return { success: false, error: 'Failed to generate OAuth URL' };
    }

    return { success: true, data: { url: data.url } };
  } catch (error) {
    logger.error('OAuth URL error', { error });
    return { success: false, error: 'Failed to generate OAuth URL' };
  }
}

export default {
  register,
  login,
  logout,
  refreshTokens,
  requestPasswordReset,
  resetPassword,
  updatePassword,
  verifyEmail,
  resendVerificationEmail,
  getOAuthUrl,
};
