import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import type { User } from './useAuth';
import { supabase } from '../lib/supabase-client';

export interface ProjectMember {
  userId: string;
  role: 'manager' | 'member';
  name: string;
  email: string;
  avatar?: string;
  joinedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  deadline: string;
  ownerId: string;
  createdAt: string;
  template: 'kanban' | 'scrum';
  members: ProjectMember[];
  deletedAt?: string;
  key?: string;
}

export interface ProjectInvitation {
  id: string;
  projectId: string;
  projectName: string;
  invitedEmail: string;
  invitedBy: string;
  inviterName?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

// JoinRequest interface for backward compatibility (same as ProjectInvitation in our invitation-only system)
export interface JoinRequest {
  id: string;
  projectId: string;
  projectName: string;
  userId: string;
  userName?: string;
  userEmail: string;
  requestType: 'invitation' | 'request';
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

interface UseProjectsProps {
  user: User | null;
}

export function useProjects({ user }: UseProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const eventListenerAttached = useRef(false);
  const channelsRef = useRef<any[]>([]);

  // ========================================
  // 1. FETCH PROJECTS FROM SUPABASE
  // ========================================
  const fetchProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      // First, get all project IDs where user is a member
      const { data: memberProjects, error: memberError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      const projectIds = memberProjects?.map(pm => pm.project_id) || [];

      // If user is not a member of any project, return empty
      if (projectIds.length === 0) {
        setProjects([]);
        setLoading(false);
        return;
      }

      // Then fetch those projects with members
      const { data, error: fetchError } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          description,
          deadline,
          owner_id,
          created_at,
          template,
          deleted_at,
          key,
          project_members (
            user_id,
            role,
            joined_at,
            users (
              id,
              name,
              email,
              avatar_url
            )
          )
        `)
        .in('id', projectIds)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const transformedProjects: Project[] = (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        deadline: p.deadline,
        ownerId: p.owner_id,
        createdAt: p.created_at,
        template: p.template,
        deletedAt: p.deleted_at,
        key: p.key,
        members: (p.project_members || []).map((m: any) => ({
          userId: m.user_id,
          role: m.role,
          name: m.users?.name || '',
          email: m.users?.email || '',
          avatar: m.users?.avatar_url,
          joinedAt: m.joined_at,
        })),
      }));

      setProjects(transformedProjects);
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      setError(err.message);
      toast.error('Không thể tải danh sách dự án');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ========================================
  // 2. FETCH INVITATIONS
  // ========================================
  const fetchInvitations = useCallback(async () => {
    if (!user) {
      setInvitations([]);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('join_requests')
        .select(`
          id,
          project_id,
          user_id,
          email,
          status,
          created_at,
          invited_by,
          projects (
            id,
            name
          ),
          inviter:users!join_requests_invited_by_fkey (
            id,
            name,
            email
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching invitations:', fetchError);
        throw fetchError;
      }

      console.log('Fetched invitations:', data); // Debug log

      const transformedInvitations: ProjectInvitation[] = (data || []).map((inv: any) => ({
        id: inv.id,
        projectId: inv.project_id,
        projectName: inv.projects?.name || '',
        invitedEmail: inv.email || user.email,
        invitedBy: inv.invited_by,
        inviterName: inv.inviter?.name || '',
        status: inv.status,
        createdAt: inv.created_at,
      }));

      setInvitations(transformedInvitations);
      console.log('Transformed invitations:', transformedInvitations); // Debug log
    } catch (err: any) {
      console.error('Error fetching invitations:', err);
      toast.error('Không thể tải lời mời: ' + err.message);
    }
  }, [user]);

  // ========================================
  // 3. INITIAL FETCH ON MOUNT
  // ========================================
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    Promise.all([
      fetchProjects(),
      fetchInvitations(),
    ]);
  }, [user, fetchProjects, fetchInvitations]);

  // ========================================
  // 4. REALTIME SUBSCRIPTIONS
  // ========================================
  useEffect(() => {
    if (!user) return;

    // Subscribe to projects changes
    const projectsChannel = supabase
      .channel('projects_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        () => {
          fetchProjects();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'project_members' },
        () => {
          fetchProjects();
        }
      )
      .subscribe();

    // Subscribe to invitations
    const invitationsChannel = supabase
      .channel('invitations_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'join_requests',
          filter: `email=eq.${user.email}`,
        },
        () => {
          toast.info('Bạn có lời mời tham gia dự án mới!');
          fetchInvitations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'join_requests',
        },
        () => {
          fetchInvitations();
        }
      )
      .subscribe();

    channelsRef.current = [projectsChannel, invitationsChannel];

    return () => {
      channelsRef.current.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    };
  }, [user, fetchProjects, fetchInvitations]);

  // ========================================
  // 5. CREATE PROJECT EVENT LISTENER
  // ========================================
  const handleCreateProjectEvent = useCallback(
    async (e: CustomEvent) => {
      if (!user) return;

      const projectData = (e as any).detail;

      try {
        // 1. Insert project
        const { data: newProject, error: projectError } = await supabase
          .from('projects')
          .insert({
            name: projectData.name,
            description: projectData.description || '',
            deadline: projectData.deadline,
            template: projectData.template || 'kanban',
            owner_id: user.id,
            key: projectData.key || projectData.name.substring(0, 3).toUpperCase(),
          })
          .select()
          .single();

        if (projectError) throw projectError;

        // 2. Add owner to project_members
        const { error: memberError } = await supabase
          .from('project_members')
          .insert({
            project_id: newProject.id,
            user_id: user.id,
            role: 'manager',
          });

        if (memberError) {
          // Rollback: Delete project if can't add member
          await supabase.from('projects').delete().eq('id', newProject.id);
          throw memberError;
        }

        // 3. Refresh projects list
        await fetchProjects();

        // 4. Select new project
        setSelectedProjectId(newProject.id);

        // 5. Dispatch success event
        window.dispatchEvent(
          new CustomEvent('projectCreated', {
            detail: { projectId: newProject.id },
          })
        );

        toast.success('Tạo dự án thành công!');
      } catch (error: any) {
        console.error('Error creating project:', error);
        toast.error('Không thể tạo dự án: ' + error.message);
      }
    },
    [user, fetchProjects]
  );

  useEffect(() => {
    if (eventListenerAttached.current || !user) return;

    window.addEventListener('createProject' as any, handleCreateProjectEvent as any);
    eventListenerAttached.current = true;

    return () => {
      window.removeEventListener('createProject' as any, handleCreateProjectEvent as any);
      eventListenerAttached.current = false;
    };
  }, [user, handleCreateProjectEvent]);

  // ========================================
  // 6. UPDATE PROJECT
  // ========================================
  const handleUpdateProject = async (projectId: string, updates: Partial<Project>) => {
    try {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline;
      if (updates.template !== undefined) dbUpdates.template = updates.template;
      if (updates.key !== undefined) dbUpdates.key = updates.key;

      const { error } = await supabase
        .from('projects')
        .update(dbUpdates)
        .eq('id', projectId);

      if (error) {
        if (error.code === 'PGRST301') {
          toast.error('Bạn không có quyền chỉnh sửa dự án này');
        } else {
          toast.error('Không thể cập nhật dự án: ' + error.message);
        }
        return;
      }

      // Optimistic update
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, ...updates } : p))
      );

      toast.success('Cập nhật dự án thành công');
    } catch (err: any) {
      console.error('Error updating project:', err);
      toast.error('Đã xảy ra lỗi');
      fetchProjects();
    }
  };

  // ========================================
  // 7. DELETE PROJECT (SOFT DELETE)
  // ========================================
  const handleDeleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', projectId);

      if (error) {
        if (error.code === 'PGRST301') {
          toast.error('Chỉ chủ dự án mới có thể xóa');
        } else {
          toast.error('Không thể xóa dự án: ' + error.message);
        }
        return false;
      }

      // Optimistic update
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, deletedAt: new Date().toISOString() } : p
        )
      );

      if (selectedProjectId === projectId) {
        setSelectedProjectId(null);
      }

      toast.success('Dự án đã được di chuyển vào thùng rác');
      return true;
    } catch (err: any) {
      console.error('Error deleting project:', err);
      toast.error('Đã xảy ra lỗi');
      return false;
    }
  };

  // ========================================
  // 8. RESTORE PROJECT
  // ========================================
  const handleRestoreProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ deleted_at: null })
        .eq('id', projectId);

      if (error) throw error;

      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, deletedAt: undefined } : p))
      );

      toast.success('Dự án đã được khôi phục');
    } catch (err: any) {
      console.error('Error restoring project:', err);
      toast.error('Không thể khôi phục dự án');
      fetchProjects();
    }
  };

  // ========================================
  // 9. PERMANENTLY DELETE PROJECT
  // ========================================
  const handlePermanentlyDeleteProject = async (
    projectId: string,
    deleteRelatedTasks?: (projectId: string) => void
  ) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      setProjects((prev) => prev.filter((p) => p.id !== projectId));

      if (deleteRelatedTasks) {
        deleteRelatedTasks(projectId);
      }

      toast.success('Dự án đã được xóa vĩnh viễn');
    } catch (err: any) {
      console.error('Error permanently deleting project:', err);
      toast.error('Không thể xóa vĩnh viễn dự án');
    }
  };

  // ========================================
  // 10. SEND INVITATION
  // ========================================
  const handleSendInvitation = async (projectId: string, email: string) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập');
      return { success: false, error: 'NOT_AUTHENTICATED' };
    }

    const trimmedEmail = email.toLowerCase().trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast.error('Email không hợp lệ');
      return { success: false, error: 'INVALID_EMAIL' };
    }

    const project = projects.find((p) => p.id === projectId);
    if (!project) {
      toast.error('Không tìm thấy dự án');
      return { success: false, error: 'PROJECT_NOT_FOUND' };
    }

    try {
      // 1. Check if email exists in system
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('email', trimmedEmail)
        .maybeSingle();

      if (userError) {
        console.error('Error checking user:', userError);
        toast.error('Lỗi kiểm tra email');
        return { success: false, error: 'CHECK_FAILED' };
      }

      if (!existingUser) {
        toast.error('Email này chưa đăng ký tài khoản trong hệ thống');
        return { success: false, error: 'USER_NOT_FOUND' };
      }

      // 2. Check if user is already a member
      const isMember = project.members.some((m) => m.userId === existingUser.id);
      if (isMember) {
        toast.error('Người dùng đã là thành viên của dự án');
        return { success: false, error: 'ALREADY_MEMBER' };
      }

      // 3. Check if invitation already exists
      const { data: existingInvite } = await supabase
        .from('join_requests')
        .select('id, status')
        .eq('project_id', projectId)
        .eq('user_id', existingUser.id)
        .maybeSingle();

      if (existingInvite) {
        if (existingInvite.status === 'pending') {
          toast.error('Đã gửi lời mời cho người này rồi (đang chờ phản hồi)');
          return { success: false, error: 'INVITE_PENDING' };
        } else if (existingInvite.status === 'rejected') {
          toast.error('Người này đã từ chối lời mời trước đó');
          return { success: false, error: 'INVITE_REJECTED_BEFORE' };
        }
      }

      // 4. Create invitation in join_requests table
      const { data: invitation, error: insertError } = await supabase
        .from('join_requests')
        .insert({
          project_id: projectId,
          user_id: existingUser.id,
          email: existingUser.email,
          invited_by: user.id,
          status: 'pending',
          request_type: 'invitation',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      console.log('Created invitation:', invitation); // Debug log

      // 5. Create notification
      const { error: notificationError } = await supabase.from('notifications').insert({
        user_id: existingUser.id,
        type: 'project_invite',
        title: 'Lời mời tham gia dự án',
        content: `${user.name} đã mời bạn tham gia dự án "${project.name}"`,
        entity_type: 'project',
        entity_id: projectId,
        is_read: false,
      });

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
        // Don't throw - invitation was created successfully
      } else {
        console.log('Notification created successfully');
      }

      // 6. Refresh invitations
      await fetchInvitations();

      toast.success(`Đã gửi lời mời đến ${existingUser.name} (${existingUser.email})`);
      return { success: true, invitation, invitedUser: existingUser };
    } catch (err: any) {
      console.error('Error sending invitation:', err);
      toast.error('Không thể gửi lời mời: ' + err.message);
      return { success: false, error: 'UNKNOWN_ERROR' };
    }
  };

  // ========================================
  // 11. ACCEPT INVITATION
  // ========================================
  const handleAcceptInvitation = async (invitationId: string) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập');
      return;
    }

    try {
      // 1. Get invitation info
      const { data: invitation, error: fetchError } = await supabase
        .from('join_requests')
        .select(`
          id,
          project_id,
          user_id,
          status,
          invited_by,
          projects (id, name)
        `)
        .eq('id', invitationId)
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .single();

      if (fetchError || !invitation) {
        toast.error('Không tìm thấy lời mời');
        return;
      }

      if (invitation.status !== 'pending') {
        toast.error('Lời mời này đã được xử lý rồi');
        return;
      }

      // 2. Update invitation status
      const { error: updateError } = await supabase
        .from('join_requests')
        .update({ status: 'accepted' })
        .eq('id', invitationId);

      if (updateError) throw updateError;

      // 3. Add to project_members
      if (!invitation.project_id) {
        throw new Error('Project ID is missing from invitation');
      }

      const { error: memberError } = await supabase
        .from('project_members')
        .insert({
          project_id: invitation.project_id,
          user_id: user.id,
          role: 'member',
        });

      if (memberError) {
        // Rollback invitation status
        await supabase
          .from('join_requests')
          .update({ status: 'pending' })
          .eq('id', invitationId);

        if (memberError.code === '23505') {
          toast.error('Bạn đã là thành viên của dự án này rồi');
        } else {
          toast.error('Không thể tham gia dự án');
        }
        return;
      }

      // 4. Notify inviter
      await supabase.from('notifications').insert({
        user_id: invitation.invited_by,
        type: 'member_added',
        title: 'Thành viên mới tham gia',
        content: `${user.name} đã chấp nhận lời mời và tham gia dự án "${invitation.projects?.name}"`,
        entity_type: 'project',
        entity_id: invitation.project_id,
        is_read: false,
      });

      // 5. Refresh data
      await Promise.all([fetchProjects(), fetchInvitations()]);

      // 6. Select project
      setSelectedProjectId(invitation.project_id);

      toast.success(`Đã tham gia dự án: ${invitation.projects?.name}`);
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      toast.error('Đã xảy ra lỗi');
    }
  };

  // ========================================
  // 12. REJECT INVITATION
  // ========================================
  const handleRejectInvitation = async (invitationId: string) => {
    if (!user) return;

    try {
      const { data: invitation } = await supabase
        .from('join_requests')
        .select('id, project_id, status, invited_by')
        .eq('id', invitationId)
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .single();

      if (!invitation || invitation.status !== 'pending') {
        toast.error('Lời mời không hợp lệ');
        return;
      }

      const { error } = await supabase
        .from('join_requests')
        .update({ status: 'rejected' })
        .eq('id', invitationId);

      if (error) throw error;

      // Notify inviter
      await supabase.from('notifications').insert({
        user_id: invitation.invited_by,
        type: 'invitation_rejected',
        title: 'Lời mời bị từ chối',
        content: `${user.name} đã từ chối lời mời tham gia dự án`,
        entity_type: 'project',
        entity_id: invitation.project_id,
        is_read: false,
      });

      await fetchInvitations();
      toast.success('Đã từ chối lời mời');
    } catch (err: any) {
      console.error('Error rejecting invitation:', err);
      toast.error('Đã xảy ra lỗi');
    }
  };

  // ========================================
  // 13. REMOVE MEMBER FROM PROJECT
  // ========================================
  const handleRemoveMember = async (projectId: string, userId: string) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập');
      return { success: false };
    }

    const project = projects.find((p) => p.id === projectId);
    if (!project) {
      toast.error('Không tìm thấy dự án');
      return { success: false };
    }

    // Check if current user is manager or owner
    const currentUserMember = project.members.find((m) => m.userId === user.id);
    const isOwner = project.ownerId === user.id;
    const isManager = currentUserMember?.role === 'manager';

    if (!isOwner && !isManager) {
      toast.error('Chỉ chủ dự án hoặc quản lý mới có thể xóa thành viên');
      return { success: false };
    }

    // Cannot remove owner
    if (userId === project.ownerId) {
      toast.error('Không thể xóa chủ dự án');
      return { success: false };
    }

    // Cannot remove yourself (use leave project instead)
    if (userId === user.id) {
      toast.error('Không thể tự xóa mình. Hãy dùng chức năng "Rời khỏi dự án"');
      return { success: false };
    }

    try {
      const memberToRemove = project.members.find((m) => m.userId === userId);

      // Delete from project_members
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId);

      if (error) {
        if (error.code === 'PGRST301') {
          toast.error('Bạn không có quyền xóa thành viên này');
        } else {
          throw error;
        }
        return { success: false };
      }

      // Notify removed member
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'member_added',
        title: 'Bị xóa khỏi dự án',
        content: `Bạn đã bị ${user.name} xóa khỏi dự án "${project.name}"`,
        entity_type: 'project',
        entity_id: projectId,
        is_read: false,
      });

      // Optimistic update
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? {
                ...p,
                members: p.members.filter((m) => m.userId !== userId),
              }
            : p
        )
      );

      toast.success(`Đã xóa ${memberToRemove?.name || 'thành viên'} khỏi dự án`);
      return { success: true };
    } catch (err: any) {
      console.error('Error removing member:', err);
      toast.error('Không thể xóa thành viên: ' + err.message);
      fetchProjects(); // Refetch to sync
      return { success: false };
    }
  };

  // ========================================
  // 14. LEAVE PROJECT (MEMBER SELF-REMOVE)
  // ========================================
  const handleLeaveProject = async (projectId: string) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập');
      return { success: false };
    }

    const project = projects.find((p) => p.id === projectId);
    if (!project) {
      toast.error('Không tìm thấy dự án');
      return { success: false };
    }

    // Cannot leave if you're the owner
    if (project.ownerId === user.id) {
      toast.error('Chủ dự án không thể rời khỏi dự án. Hãy xóa dự án hoặc chuyển quyền sở hữu trước.');
      return { success: false };
    }

    try {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Notify owner and managers
      const managersAndOwner = project.members.filter(
        (m) => (m.role === 'manager' || m.userId === project.ownerId) && m.userId !== user.id
      );

      for (const member of managersAndOwner) {
        await supabase.from('notifications').insert({
          user_id: member.userId,
          type: 'member_added',
          title: 'Thành viên rời khỏi dự án',
          content: `${user.name} đã rời khỏi dự án "${project.name}"`,
          entity_type: 'project',
          entity_id: projectId,
          is_read: false,
        });
      }

      // Remove from local state
      setProjects((prev) => prev.filter((p) => p.id !== projectId));

      // Deselect if current project
      if (selectedProjectId === projectId) {
        setSelectedProjectId(null);
      }

      toast.success(`Đã rời khỏi dự án "${project.name}"`);
      return { success: true };
    } catch (err: any) {
      console.error('Error leaving project:', err);
      toast.error('Không thể rời khỏi dự án');
      return { success: false };
    }
  };

  // ========================================
  // 15. UPDATE MEMBER ROLE
  // ========================================
  const handleUpdateMemberRole = async (
    projectId: string,
    userId: string,
    newRole: 'manager' | 'member'
  ) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập');
      return { success: false };
    }

    const project = projects.find((p) => p.id === projectId);
    if (!project) {
      toast.error('Không tìm thấy dự án');
      return { success: false };
    }

    // Only owner can change roles
    if (project.ownerId !== user.id) {
      toast.error('Chỉ chủ dự án mới có thể thay đổi vai trò thành viên');
      return { success: false };
    }

    // Cannot change owner role
    if (userId === project.ownerId) {
      toast.error('Không thể thay đổi vai trò của chủ dự án');
      return { success: false };
    }

    try {
      const { error } = await supabase
        .from('project_members')
        .update({ role: newRole })
        .eq('project_id', projectId)
        .eq('user_id', userId);

      if (error) throw error;

      const member = project.members.find((m) => m.userId === userId);

      // Notify member
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'member_added',
        title: 'Vai trò đã thay đổi',
        content: `${user.name} đã thay đổi vai trò của bạn thành "${
          newRole === 'manager' ? 'Quản lý' : 'Thành viên'
        }" trong dự án "${project.name}"`,
        entity_type: 'project',
        entity_id: projectId,
        is_read: false,
      });

      // Optimistic update
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? {
                ...p,
                members: p.members.map((m) =>
                  m.userId === userId ? { ...m, role: newRole } : m
                ),
              }
            : p
        )
      );

      toast.success(
        `Đã thay đổi vai trò của ${member?.name || 'thành viên'} thành ${
          newRole === 'manager' ? 'Quản lý' : 'Thành viên'
        }`
      );
      return { success: true };
    } catch (err: any) {
      console.error('Error updating member role:', err);
      toast.error('Không thể thay đổi vai trò');
      fetchProjects();
      return { success: false };
    }
  };

  // ========================================
  // 16. HELPER FUNCTIONS
  // ========================================
  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
  };

  const getActiveProjects = () => projects.filter((p) => !p.deletedAt);
  const getDeletedProjects = () => projects.filter((p) => p.deletedAt);

  // ========================================
  // 17. RETURN VALUES
  // ========================================
  return {
    projects,
    setProjects,
    selectedProjectId,
    setSelectedProjectId,
    invitations,
    loading,
    error,
    refetch: fetchProjects,
    handleUpdateProject,
    handleDeleteProject,
    handleRestoreProject,
    handlePermanentlyDeleteProject,
    handleSelectProject,
    handleSendInvitation,
    handleAcceptInvitation,
    handleRejectInvitation,
    handleRemoveMember,
    handleLeaveProject,
    handleUpdateMemberRole,
    getActiveProjects,
    getDeletedProjects,
  };
}
