import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { User } from './useAuth';
import type { Notification } from './useNotifications';
import { projectsApi } from '../services/apiClient';

export interface ProjectMember {
  userId: string;
  role: 'manager' | 'member';
  name: string;
  email: string;
  avatar?: string;
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
}

export interface ProjectInvitation {
  id: string;
  projectId: string;
  projectName: string;
  invitedEmail: string;
  invitedBy: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface JoinRequest {
  id: string;
  projectId: string;
  projectName: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface UseProjectsProps {
  user: User | null;
  onAddNotification?: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
}

export function useProjects({ user, onAddNotification }: UseProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch projects from backend on mount
  const fetchProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await projectsApi.getAll();
      if (response.success) {
        setProjects(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      toast.error('Không thể tải danh sách dự án');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Create project via API
  const handleCreateProject = useCallback(async (projectData: Omit<Project, 'id' | 'createdAt' | 'ownerId' | 'members'>) => {
    if (!user) return null;

    try {
      const response = await projectsApi.create(projectData);
      if (response.success) {
        const newProject = response.data;
        setProjects(prev => [...prev, newProject]);
        setSelectedProjectId(newProject.id);
        toast.success('Dự án đã được tạo thành công');
        
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('projectCreated', { 
          detail: { projectId: newProject.id } 
        }));
        
        return newProject;
      }
    } catch (error: any) {
      console.error('Failed to create project:', error);
      toast.error(error.message || 'Không thể tạo dự án');
      return null;
    }
  }, [user]);

  // Listen for createProject events
  useEffect(() => {
    if (!user) return;

    const handleCreateProjectEvent = async (e: CustomEvent) => {
      await handleCreateProject(e.detail);
    };

    window.addEventListener('createProject' as any, handleCreateProjectEvent as any);
    return () => {
      window.removeEventListener('createProject' as any, handleCreateProjectEvent as any);
    };
  }, [user, handleCreateProject]);

  // Update project
  const handleUpdateProject = useCallback(async (projectId: string, updates: Partial<Project>) => {
    try {
      const response = await projectsApi.update(projectId, updates);
      if (response.success) {
        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...response.data } : p));
        toast.success('Dự án đã được cập nhật');
      }
    } catch (error: any) {
      console.error('Failed to update project:', error);
      toast.error(error.message || 'Không thể cập nhật dự án');
    }
  }, []);

  // Soft delete project
  const handleDeleteProject = useCallback(async (projectId: string) => {
    try {
      const response = await projectsApi.delete(projectId);
      if (response.success) {
        setProjects(prev => prev.map(p => 
          p.id === projectId ? { ...p, deletedAt: new Date().toISOString() } : p
        ));
        toast.success('Dự án đã được di chuyển vào thùng rác');
        
        if (selectedProjectId === projectId) {
          setSelectedProjectId(null);
        }
        return true;
      }
    } catch (error: any) {
      console.error('Failed to delete project:', error);
      toast.error(error.message || 'Không thể xóa dự án');
      return false;
    }
  }, [selectedProjectId]);

  // Restore project
  const handleRestoreProject = useCallback(async (projectId: string) => {
    try {
      const response = await projectsApi.update(projectId, { deletedAt: null });
      if (response.success) {
        setProjects(prev => prev.map(p => 
          p.id === projectId ? { ...p, deletedAt: undefined } : p
        ));
        toast.success('Dự án đã được khôi phục');
      }
    } catch (error: any) {
      console.error('Failed to restore project:', error);
      toast.error(error.message || 'Không thể khôi phục dự án');
    }
  }, []);

  // Permanently delete project
  const handlePermanentlyDeleteProject = useCallback(async (
    projectId: string, 
    deleteRelatedTasks?: (projectId: string) => void
  ) => {
    try {
      const response = await projectsApi.delete(projectId);
      if (response.success) {
        setProjects(prev => prev.filter(p => p.id !== projectId));
        if (deleteRelatedTasks) {
          deleteRelatedTasks(projectId);
        }
        toast.success('Dự án đã được xóa vĩnh viễn');
      }
    } catch (error: any) {
      console.error('Failed to permanently delete project:', error);
      toast.error(error.message || 'Không thể xóa dự án');
    }
  }, []);

  // Select project
  const handleSelectProject = useCallback((projectId: string) => {
    setSelectedProjectId(projectId);
  }, []);

  // Add member to project
  const handleAddMember = useCallback(async (projectId: string, email: string, role: 'manager' | 'member' = 'member') => {
    try {
      const response = await projectsApi.addMember(projectId, { email, role });
      if (response.success) {
        await fetchProjects(); // Refresh projects
        toast.success('Đã thêm thành viên vào dự án');
      }
    } catch (error: any) {
      console.error('Failed to add member:', error);
      toast.error(error.message || 'Không thể thêm thành viên');
    }
  }, [fetchProjects]);

  // Update member role
  const handleUpdateMemberRole = useCallback(async (projectId: string, userId: string, role: 'manager' | 'member') => {
    try {
      const response = await projectsApi.updateMemberRole(projectId, userId, role);
      if (response.success) {
        await fetchProjects();
        toast.success('Đã cập nhật vai trò thành viên');
      }
    } catch (error: any) {
      console.error('Failed to update member role:', error);
      toast.error(error.message || 'Không thể cập nhật vai trò');
    }
  }, [fetchProjects]);

  // Remove member from project
  const handleRemoveMember = useCallback(async (projectId: string, userId: string) => {
    try {
      const response = await projectsApi.removeMember(projectId, userId);
      if (response.success) {
        await fetchProjects();
        toast.success('Đã xóa thành viên khỏi dự án');
      }
    } catch (error: any) {
      console.error('Failed to remove member:', error);
      toast.error(error.message || 'Không thể xóa thành viên');
    }
  }, [fetchProjects]);

  // Invitations (localStorage for now - can be moved to API later)
  const handleSendInvitation = useCallback((projectId: string, email: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project || !user) return;

    const invitation: ProjectInvitation = {
      id: Date.now().toString(),
      projectId,
      projectName: project.name,
      invitedEmail: email,
      invitedBy: user.id,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setInvitations(prev => [...prev, invitation]);

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
    
    toast.success('Đã gửi lời mời tham gia dự án');
  }, [projects, user, onAddNotification]);

  const handleAcceptInvitation = useCallback((invitationId: string) => {
    const invitation = invitations.find((i) => i.id === invitationId);
    if (!invitation || !user) return;

    handleAddMember(invitation.projectId, user.email);
    setInvitations(prev => prev.map(i => i.id === invitationId ? { ...i, status: 'accepted' as const } : i));
  }, [invitations, user, handleAddMember]);

  const handleRejectInvitation = useCallback((invitationId: string) => {
    setInvitations(prev => prev.map(i => i.id === invitationId ? { ...i, status: 'rejected' as const } : i));
    toast.success('Đã từ chối lời mời');
  }, []);

  // Join requests (localStorage for now)
  const handleRequestJoinProject = useCallback((projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project || !user) return;

    const existingRequest = joinRequests.find(
      (r) => r.projectId === projectId && r.userId === user.id && r.status === 'pending'
    );
    if (existingRequest) {
      toast.error('Bạn đã gửi yêu cầu tham gia dự án này rồi');
      return;
    }

    const request: JoinRequest = {
      id: Date.now().toString(),
      projectId,
      projectName: project.name,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setJoinRequests(prev => [...prev, request]);
    toast.success('Đã gửi yêu cầu tham gia dự án');
  }, [projects, user, joinRequests]);

  const handleApproveJoinRequest = useCallback((requestId: string) => {
    const request = joinRequests.find((r) => r.id === requestId);
    if (!request) return;

    handleAddMember(request.projectId, request.userEmail);
    setJoinRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'approved' as const } : r));
  }, [joinRequests, handleAddMember]);

  const handleRejectJoinRequest = useCallback((requestId: string) => {
    setJoinRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'rejected' as const } : r));
    toast.success('Đã từ chối yêu cầu tham gia');
  }, []);

  // Helper functions
  const getActiveProjects = useCallback(() => {
    return projects.filter((p) => !p.deletedAt);
  }, [projects]);

  const getDeletedProjects = useCallback(() => {
    return projects.filter((p) => p.deletedAt);
  }, [projects]);

  return {
    projects,
    setProjects,
    selectedProjectId,
    setSelectedProjectId,
    invitations,
    joinRequests,
    isLoading,
    fetchProjects,
    handleCreateProject,
    handleUpdateProject,
    handleDeleteProject,
    handleRestoreProject,
    handlePermanentlyDeleteProject,
    handleSelectProject,
    handleAddMember,
    handleUpdateMemberRole,
    handleRemoveMember,
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
