import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import type { User } from './useAuth';
import { supabase } from '../lib/supabase-client';
import { sendProjectInvitation, fetchPendingInvitations, acceptProjectInvitation, rejectProjectInvitation } from '../utils/invitationService';

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
  // 2. FETCH INVITATIONS (NEW SIMPLE VERSION)
  // ========================================
  const fetchInvitations = useCallback(async () => {
    if (!user) {
      setInvitations([]);
      return;
    }

    const invitationsData = await fetchPendingInvitations(user.id);

    // Transform to match ProjectInvitation type
    const transformedInvitations: ProjectInvitation[] = invitationsData.map((inv: any) => ({
      id: inv.id,
      projectId: inv.projectId,
      projectName: inv.projectName,
      invitedEmail: user.email,
      invitedBy: inv.inviterId || '',
      inviterName: inv.inviterName,
      status: 'pending',
      createdAt: inv.createdAt,
    }));

    setInvitations(transformedInvitations);
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
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ========================================
  // 4. REALTIME SUBSCRIPTIONS
  // ========================================
  useEffect(() => {
    if (!user) return;

    console.log('📡 Setting up projects and invitations subscriptions for user:', user.id);

    // Use unique channel names to avoid conflicts
    const channelId = `${user.id}_${Date.now()}`;

    // Subscribe to projects changes
    const projectsChannel = supabase
      .channel(`projects_changes_${channelId}`)
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
      .subscribe((status) => {
        console.log('📡 Projects subscription status:', status);
      });

    // Subscribe to invitations
    const invitationsChannel = supabase
      .channel(`invitations_changes_${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'join_requests',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🔔 New join_request INSERT:', payload);

          // Only notify if this is an INVITATION (not a request sent by user)
          const newRecord = payload.new as any;
          if (newRecord.request_type === 'invitation') {
            toast.info('Bạn có lời mời tham gia dự án mới!');
          }

          fetchInvitations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'join_requests',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🔄 Invitation updated:', payload);
          fetchInvitations();
        }
      )
      .subscribe((status) => {
        console.log('📡 Invitations subscription status:', status);
      });

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
  // 10. SEND INVITATION (NEW SIMPLE VERSION)
  // ========================================
  const handleSendInvitation = async (projectId: string, email: string) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập');
      return { success: false, error: 'NOT_AUTHENTICATED' };
    }

    const project = projects.find((p) => p.id === projectId);
    if (!project) {
      toast.error('Không tìm thấy dự án');
      return { success: false, error: 'PROJECT_NOT_FOUND' };
    }

    const result = await sendProjectInvitation({
      projectId,
      projectName: project.name,
      inviteeEmail: email.toLowerCase().trim(),
      currentUser: user,
    });

    if (result.success) {
      await fetchInvitations();
    }

    return result;
  };

  // ========================================
  // 11. ACCEPT INVITATION (NEW SIMPLE VERSION)
  // ========================================
  const handleAcceptInvitation = async (invitationId: string) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập');
      return;
    }

    const result = await acceptProjectInvitation({
      invitationId,
      currentUser: user,
    });

    if (result.success) {
      // Show success toast
      toast.success(`Đã tham gia dự án: ${result.projectName || 'dự án'}`);

      // Reload projects and invitations
      await Promise.all([fetchProjects(), fetchInvitations()]);

      // Select the new project
      if (result.projectId) {
        setSelectedProjectId(result.projectId);
      }

      // Force reload to ensure UI is in sync
      setTimeout(() => {
        fetchProjects();
      }, 500);
    }
  };

  // ========================================
  // 12. REJECT INVITATION (NEW SIMPLE VERSION)
  // ========================================
  const handleRejectInvitation = async (invitationId: string) => {
    if (!user) return;

    const result = await rejectProjectInvitation({
      invitationId,
      currentUser: user,
    });

    if (result.success) {
      await fetchInvitations();
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
        content: `${user.name} đã thay đổi vai trò của bạn thành "${newRole === 'manager' ? 'Quản lý' : 'Thành viên'
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
        `Đã thay đổi vai trò của ${member?.name || 'thành viên'} thành ${newRole === 'manager' ? 'Quản lý' : 'Thành viên'
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
