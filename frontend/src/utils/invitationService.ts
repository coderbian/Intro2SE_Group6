// =====================================================
// SIMPLE INVITATION FLOW - CLEAN IMPLEMENTATION
// =====================================================
// Purpose: Send project invitation → Create notification → User accepts/rejects

import { supabase } from '../lib/supabase-client';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  owner_id: string;
}

// =====================================================
// STEP 1: SEND INVITATION
// =====================================================
export async function sendProjectInvitation(params: {
  projectId: string;
  projectName: string;
  inviteeEmail: string;
  currentUser: User;
}) {
  try {
    console.log('📤 Starting invitation process for:', params.inviteeEmail);

    // 1. Check if user exists
    const { data: inviteeUser, error: userError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', params.inviteeEmail)
      .maybeSingle();

    if (userError) {
      console.error('❌ Error finding user:', userError);
      throw new Error('Không thể tìm thấy người dùng');
    }

    if (!inviteeUser) {
      throw new Error('Email không tồn tại trong hệ thống. Vui lòng yêu cầu người dùng đăng ký trước.');
    }

    // 2. Check if already member
    const { data: existingMember } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', params.projectId)
      .eq('user_id', inviteeUser.id)
      .maybeSingle();

    if (existingMember) {
      throw new Error('Người dùng đã là thành viên của dự án này');
    }

    // 3. Check if invitation already sent
    const { data: existingInvitation } = await supabase
      .from('join_requests')
      .select('id, status')
      .eq('project_id', params.projectId)
      .eq('user_id', inviteeUser.id)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingInvitation) {
      throw new Error('Lời mời đã được gửi trước đó');
    }

    // 4. Create invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('join_requests')
      .insert({
        project_id: params.projectId,
        user_id: inviteeUser.id,
        email: inviteeUser.email,
        invited_by: params.currentUser.id,
        status: 'pending',
        request_type: 'invitation',
      })
      .select('id')
      .single();

    if (inviteError) {
      throw new Error('Không thể tạo lời mời');
    }

    // 5. Create notification
    const { error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: inviteeUser.id,
        type: 'project_invite',
        title: 'Lời mời tham gia dự án',
        content: `${params.currentUser.name} đã mời bạn tham gia dự án "${params.projectName}"`,
        entity_type: 'invitation',
        entity_id: invitation.id,
        is_read: false,
      });

    if (notifError) {
      // Continue - notification is optional
    }

    toast.success(`Đã gửi lời mời đến ${inviteeUser.name}`);
    return { success: true, invitationId: invitation.id };

  } catch (error: any) {
    toast.error(error.message || 'Không thể gửi lời mời');
    return { success: false, error: error.message };
  }
}

// =====================================================
// STEP 2: ACCEPT INVITATION
// =====================================================
export async function acceptProjectInvitation(params: {
  invitationId: string;
  currentUser: User;
}) {
  try {
    // 1. Get invitation details
    const { data: invitation, error: fetchError } = await supabase
      .from('join_requests')
      .select('id, project_id, user_id, status, invited_by, projects(id, name)')
      .eq('id', params.invitationId)
      .eq('user_id', params.currentUser.id)
      .single();

    if (fetchError || !invitation) {
      throw new Error('Không tìm thấy lời mời');
    }

    if (invitation.status !== 'pending') {
      throw new Error('Lời mời đã được xử lý');
    }

    // 2. Add to project_members
    if (!invitation.project_id) {
      throw new Error('Project ID không hợp lệ');
    }

    const { error: memberError } = await supabase
      .from('project_members')
      .insert({
        project_id: invitation.project_id,
        user_id: params.currentUser.id,
        role: 'member',
      });

    if (memberError) {
      if (memberError.code === '23505') {
        throw new Error('Bạn đã là thành viên của dự án này');
      }
      if (memberError.code === 'PGRST301') {
        throw new Error('Không có quyền thêm thành viên (lỗi RLS)');
      }
      throw new Error(`Không thể tham gia dự án: ${memberError.message}`);
    }

    // 3. Update invitation status
    const { error: updateError } = await supabase
      .from('join_requests')
      .update({ status: 'accepted' })
      .eq('id', params.invitationId)
      .eq('user_id', params.currentUser.id);

    if (updateError) {
      // Try to rollback member addition
      if (invitation.project_id) {
        await supabase
          .from('project_members')
          .delete()
          .eq('project_id', invitation.project_id)
          .eq('user_id', params.currentUser.id);
      }
      throw new Error('Không thể cập nhật trạng thái lời mời');
    }

    // 4. Notify inviter
    await supabase.from('notifications').insert({
      user_id: invitation.invited_by,
      type: 'member_added',
      title: 'Thành viên mới',
      content: `${params.currentUser.name} đã chấp nhận lời mời vào "${invitation.projects?.name}"`,
      entity_type: 'project',
      entity_id: invitation.project_id,
      is_read: false,
    });

    toast.success(`Đã tham gia dự án: ${invitation.projects?.name}`);
    return { success: true, projectId: invitation.project_id };

  } catch (error: any) {
    toast.error(error.message || 'Không thể chấp nhận lời mời');
    return { success: false, error: error.message };
  }
}

// =====================================================
// STEP 3: REJECT INVITATION
// =====================================================
export async function rejectProjectInvitation(params: {
  invitationId: string;
  currentUser: User;
}) {
  try {
    // 1. Get invitation details
    const { data: invitation, error: fetchError } = await supabase
      .from('join_requests')
      .select('id, project_id, user_id, status, invited_by, projects(id, name)')
      .eq('id', params.invitationId)
      .eq('user_id', params.currentUser.id)
      .single();

    if (fetchError || !invitation) {
      throw new Error('Không tìm thấy lời mời');
    }

    if (invitation.status !== 'pending') {
      throw new Error('Lời mời đã được xử lý');
    }

    // 2. Update invitation status
    const { error: updateError } = await supabase
      .from('join_requests')
      .update({ status: 'rejected' })
      .eq('id', params.invitationId)
      .eq('user_id', params.currentUser.id);

    if (updateError) {
      throw new Error('Không thể cập nhật trạng thái');
    }

    // 3. Notify inviter
    await supabase.from('notifications').insert({
      user_id: invitation.invited_by,
      type: 'invitation_rejected',
      title: 'Lời mời bị từ chối',
      content: `${params.currentUser.name} đã từ chối lời mời vào "${invitation.projects?.name}"`,
      entity_type: 'invitation',
      entity_id: params.invitationId,
      is_read: false,
    });

    toast.success('Đã từ chối lời mời');
    return { success: true };

  } catch (error: any) {
    toast.error(error.message || 'Không thể từ chối lời mời');
    return { success: false, error: error.message };
  }
}

// =====================================================
// STEP 4: FETCH PENDING INVITATIONS
// =====================================================
export async function fetchPendingInvitations(userId: string) {
  try {
    const { data, error } = await supabase
      .from('join_requests')
      .select(`
        id,
        project_id,
        created_at,
        invited_by,
        projects (id, name),
        inviter:users!join_requests_invited_by_fkey (id, name, email)
      `)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching invitations:', error);
      return [];
    }

    return (data || []).map((inv: any) => ({
      id: inv.id,
      projectId: inv.project_id,
      projectName: inv.projects?.name || 'Unknown Project',
      inviterName: inv.inviter?.name || 'Unknown',
      inviterEmail: inv.inviter?.email || '',
      createdAt: inv.created_at,
    }));

  } catch (error) {
    console.error('❌ Fetch invitations failed:', error);
    return [];
  }
}
