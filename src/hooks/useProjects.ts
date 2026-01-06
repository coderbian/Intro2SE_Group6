import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import * as projectService from '../services/projectService';
import type { User } from './useAuth';
import type { Notification } from './useNotifications';

export type { Project, ProjectMember, ProjectInvitation, JoinRequest } from '../services/projectService';

interface UseProjectsProps {
  user: User | null;
  onAddNotification?: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
}

export function useProjects({ user, onAddNotification }: UseProjectsProps) {
  const [projects, setProjects] = useState<projectService.Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<projectService.ProjectInvitation[]>([]);
  const [joinRequests, setJoinRequests] = useState<projectService.JoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const eventListenerAttached = useRef(false);
  const hasFetched = useRef(false);
  const lastUserId = useRef<string | null>(null);

  // Fetch projects from Supabase on mount
  useEffect(() => {
    // Skip if no user - reset state and refs
    if (!user) {
      setProjects([]);
      setInvitations([]);
      setJoinRequests([]);
      hasFetched.current = false;
      lastUserId.current = null;
      return;
    }

    // Reset refs if user changed (including login after logout)
    if (lastUserId.current !== null && lastUserId.current !== user.id) {
      hasFetched.current = false;
      lastUserId.current = null;
    }

    // Skip if already fetched for this user
    if (hasFetched.current && lastUserId.current === user.id) {
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        console.log('[useProjects] Fetching projects for user:', user.id);
        const [fetchedProjects, fetchedInvitations] = await Promise.all([
          projectService.fetchProjects(user.id),
          projectService.fetchInvitations(user.email),
        ]);
        console.log('[useProjects] Fetched projects:', fetchedProjects.length);
        setProjects(fetchedProjects);
        setInvitations(fetchedInvitations);
        hasFetched.current = true;
        lastUserId.current = user.id;

        // Fetch join requests for projects where user is owner
        const ownedProjectIds = fetchedProjects
          .filter((p) => p.ownerId === user.id)
          .map((p) => p.id);

        if (ownedProjectIds.length > 0) {
          const fetchedJoinRequests = await projectService.fetchJoinRequests(ownedProjectIds);
          setJoinRequests(fetchedJoinRequests);
        }
      } catch (error) {
        console.error('[useProjects] Error fetching projects:', error);
        // Don't set hasFetched to true on error - allow retry
        toast.error('Không thể tải dữ liệu dự án');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.id, user?.email]);

  // Listen for createProject events
  useEffect(() => {
    if (eventListenerAttached.current || !user) return;

    const handleCreateProject = async (e: CustomEvent) => {
      try {
        const newProject = await projectService.createProject(
          (e as any).detail,
          user.id,
          user.name,
          user.email,
          user.avatar
        );
        setProjects((prev) => [...prev, newProject]);
        setSelectedProjectId(newProject.id);
        window.dispatchEvent(new CustomEvent('projectCreated', { detail: { projectId: newProject.id } }));
      } catch (error) {
        console.error('Error creating project:', error);
        toast.error('Không thể tạo dự án');
      }
    };

    window.addEventListener('createProject' as any, handleCreateProject as any);
    eventListenerAttached.current = true;

    return () => {
      window.removeEventListener('createProject' as any, handleCreateProject as any);
      eventListenerAttached.current = false;
    };
  }, [user]);

  const handleUpdateProject = useCallback(async (projectId: string, updates: Partial<projectService.Project>) => {
    try {
      const updated = await projectService.updateProject(projectId, updates);
      setProjects((prev) => prev.map((p) => (p.id === projectId ? updated : p)));
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Không thể cập nhật dự án');
    }
  }, []);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    try {
      await projectService.deleteProject(projectId);
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, deletedAt: new Date().toISOString() } : p))
      );
      toast.success('Dự án đã được di chuyển vào thùng rác');
      if (selectedProjectId === projectId) {
        setSelectedProjectId(null);
      }
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Không thể xóa dự án');
      return false;
    }
  }, [selectedProjectId]);

  const handleRestoreProject = useCallback(async (projectId: string) => {
    try {
      await projectService.restoreProject(projectId);
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, deletedAt: undefined } : p))
      );
      toast.success('Dự án đã được khôi phục');
    } catch (error) {
      console.error('Error restoring project:', error);
      toast.error('Không thể khôi phục dự án');
    }
  }, []);

  const handlePermanentlyDeleteProject = useCallback(
    async (projectId: string, deleteRelatedTasks?: (projectId: string) => void) => {
      try {
        if (deleteRelatedTasks) {
          deleteRelatedTasks(projectId);
        }
        await projectService.permanentlyDeleteProject(projectId);
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
        toast.success('Dự án đã được xóa vĩnh viễn');
      } catch (error) {
        console.error('Error permanently deleting project:', error);
        toast.error('Không thể xóa vĩnh viễn dự án');
      }
    },
    []
  );

  const handleSelectProject = useCallback((projectId: string | null) => {
    setSelectedProjectId(projectId);
  }, []);

  const handleSendInvitation = useCallback(
    async (projectId: string, email: string) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project || !user) return;

      try {
        await projectService.sendInvitation(projectId, email, user.id);
        toast.success('Đã gửi lời mời');

        if (onAddNotification) {
          onAddNotification({
            userId: '',
            type: 'project_update',
            title: 'Bạn được mời vào dự án',
            message: `${user.name} đã mời bạn tham gia dự án: "${project.name}"`,
            read: false,
            relatedId: projectId,
          });
        }
      } catch (error) {
        console.error('Error sending invitation:', error);
        toast.error('Không thể gửi lời mời');
      }
    },
    [projects, user, onAddNotification]
  );

  const handleAcceptInvitation = useCallback(
    async (invitationId: string) => {
      const invitation = invitations.find((i) => i.id === invitationId);
      if (!invitation || !user) return;

      try {
        await projectService.respondToInvitation(invitationId, true, user.id);

        // Refresh projects
        const fetchedProjects = await projectService.fetchProjects(user.id);
        setProjects(fetchedProjects);
        setInvitations((prev) =>
          prev.map((i) => (i.id === invitationId ? { ...i, status: 'accepted' as const } : i))
        );
        toast.success(`Đã tham gia dự án: ${invitation.projectName}`);
      } catch (error) {
        console.error('Error accepting invitation:', error);
        toast.error('Không thể chấp nhận lời mời');
      }
    },
    [invitations, user]
  );

  const handleRejectInvitation = useCallback(
    async (invitationId: string) => {
      try {
        await projectService.respondToInvitation(invitationId, false);
        setInvitations((prev) =>
          prev.map((i) => (i.id === invitationId ? { ...i, status: 'rejected' as const } : i))
        );
        toast.success('Đã từ chối lời mời');
      } catch (error) {
        console.error('Error rejecting invitation:', error);
        toast.error('Không thể từ chối lời mời');
      }
    },
    []
  );

  const handleRequestJoinProject = useCallback(
    async (projectId: string) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project || !user) return;

      const existingRequest = joinRequests.find(
        (r) => r.projectId === projectId && r.userId === user.id && r.status === 'pending'
      );
      if (existingRequest) {
        toast.error('Bạn đã gửi yêu cầu tham gia dự án này rồi');
        return;
      }

      try {
        await projectService.createJoinRequest(projectId, user.id);
        toast.success('Đã gửi yêu cầu tham gia dự án');
      } catch (error) {
        console.error('Error requesting to join project:', error);
        toast.error('Không thể gửi yêu cầu tham gia');
      }
    },
    [projects, user, joinRequests]
  );

  const handleApproveJoinRequest = useCallback(
    async (requestId: string) => {
      const request = joinRequests.find((r) => r.id === requestId);
      if (!request) return;

      try {
        await projectService.respondToJoinRequest(requestId, true);

        // Refresh projects to get updated member list
        if (user) {
          const fetchedProjects = await projectService.fetchProjects(user.id);
          setProjects(fetchedProjects);
        }

        setJoinRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, status: 'approved' as const } : r))
        );
        toast.success(`Đã chấp nhận ${request.userName} vào dự án`);
      } catch (error) {
        console.error('Error approving join request:', error);
        toast.error('Không thể chấp nhận yêu cầu');
      }
    },
    [joinRequests, user]
  );

  const handleRejectJoinRequest = useCallback(
    async (requestId: string) => {
      try {
        await projectService.respondToJoinRequest(requestId, false);
        setJoinRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, status: 'rejected' as const } : r))
        );
        toast.success('Đã từ chối yêu cầu tham gia');
      } catch (error) {
        console.error('Error rejecting join request:', error);
        toast.error('Không thể từ chối yêu cầu');
      }
    },
    []
  );

  const getActiveProjects = useCallback(() => projects.filter((p) => !p.deletedAt), [projects]);
  const getDeletedProjects = useCallback(() => projects.filter((p) => p.deletedAt), [projects]);

  return {
    projects,
    setProjects,
    selectedProjectId,
    setSelectedProjectId,
    invitations,
    joinRequests,
    isLoading,
    handleUpdateProject,
    handleDeleteProject,
    handleRestoreProject,
    handlePermanentlyDeleteProject,
    handleSelectProject,
    handleSendInvitation,
    handleAcceptInvitation,
    handleRejectInvitation,
    handleRequestJoinProject,
    handleApproveJoinRequest,
    handleRejectJoinRequest,
    getActiveProjects,
    getDeletedProjects,
  };
}
