import { getSupabaseClient } from "../lib/supabase-client";

const supabase = getSupabaseClient();

export interface InviteMemberResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string; // ✅ THAY ĐỔI: full_name → name
  };
  error?: string;
}

export async function checkUserExists(email: string): Promise<InviteMemberResult> {
  try {
    // ✅ THAY ĐỔI: profiles → users
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (error || !user) {
      return {
        success: false,
        error: 'Email không tồn tại trong hệ thống'
      };
    }

    return {
      success: true,
      user: user
    };
  } catch (err) {
    console.error('Error checking user:', err);
    return {
      success: false,
      error: 'Có lỗi xảy ra khi kiểm tra email'
    };
  }
}

export async function inviteMemberToProject(
  projectId: string,
  projectName: string,
  inviterId: string,
  inviterName: string,
  targetUserId: string,
  targetUserEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Thêm member vào project_members
    const { error: memberError } = await supabase
      .from('project_members')
      .insert({
        project_id: projectId,
        user_id: targetUserId,
        role: 'member'
      });

    if (memberError) {
      // Check nếu user đã là member rồi
      if (memberError.code === '23505') { // unique violation
        return {
          success: false,
          error: 'Người dùng đã là thành viên của dự án'
        };
      }
      throw memberError;
    }

    // 2. Gửi notification cho user được mời
    const { error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: targetUserId,
        type: 'project_invite',
        title: 'Lời mời tham gia dự án',
        content: `${inviterName} đã mời bạn tham gia dự án "${projectName}"`,
        entity_type: 'project', // ✅ THÊM field này
        entity_id: projectId,   // ✅ THÊM field này
        is_read: false
      });

    if (notifError) {
      console.error('Error creating notification:', notifError);
      // Không throw error vì member đã được thêm thành công
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error inviting member:', err);
    return {
      success: false,
      error: err.message || 'Có lỗi xảy ra khi thêm thành viên'
    };
  }
}