import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { User } from './useAuth';

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
  onAddNotification?: (notification: { userId: string; type: string; title: string; message: string; read: boolean; relatedId?: string }) => void;
}

export function useProjects({ user, onAddNotification }: UseProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const eventListenerAttached = useRef(false);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('planora_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('planora_invitations', JSON.stringify(invitations));
  }, [invitations]);

  useEffect(() => {
    localStorage.setItem('planora_join_requests', JSON.stringify(joinRequests));
  }, [joinRequests]);

  // Listen for createProject events
  useEffect(() => {
    if (eventListenerAttached.current || !user) return;

    const handleCreateProject = (e: CustomEvent) => {
      const newProjectId = Date.now().toString();
      setProjects((prev) => {
        const newProject: Project = {
          ...(e as any).detail,
          id: newProjectId,
          ownerId: user.id,
          createdAt: new Date().toISOString(),
          members: [
            {
              userId: user.id,
              role: 'manager' as const,
              name: user.name,
              email: user.email,
              avatar: user.avatar,
            },
          ],
        };
        return [...prev, newProject];
      });
      setSelectedProjectId(newProjectId);
      // Dispatch event to notify that project was created
      window.dispatchEvent(new CustomEvent('projectCreated', { detail: { projectId: newProjectId } }));
      return newProjectId;
    };

    window.addEventListener('createProject' as any, handleCreateProject as any);
    eventListenerAttached.current = true;

    return () => {
      window.removeEventListener('createProject' as any, handleCreateProject as any);
      eventListenerAttached.current = false;
    };
  }, [user]);

  const handleUpdateProject = (projectId: string, updates: Partial<Project>) => {
    setProjects(projects.map((p) => (p.id === projectId ? { ...p, ...updates } : p)));
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects(projects.map((p) => (p.id === projectId ? { ...p, deletedAt: new Date().toISOString() } : p)));
    toast.success('Dự án đã được di chuyển vào thùng rác');
    if (selectedProjectId === projectId) {
      setSelectedProjectId(null);
    }
    return true; // Indicate should navigate to dashboard
  };

  const handleRestoreProject = (projectId: string) => {
    setProjects(projects.map((p) => (p.id === projectId ? { ...p, deletedAt: undefined } : p)));
    toast.success('Dự án đã được khôi phục');
  };

  const handlePermanentlyDeleteProject = (projectId: string, deleteRelatedTasks?: (projectId: string) => void) => {
    setProjects(projects.filter((p) => p.id !== projectId));
    if (deleteRelatedTasks) {
      deleteRelatedTasks(projectId);
    }
    toast.success('Dự án đã được xóa vĩnh viễn');
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
  };

  const handleSendInvitation = (projectId: string, email: string) => {
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

    setInvitations([...invitations, invitation]);

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
  };

  const handleAcceptInvitation = (invitationId: string) => {
    const invitation = invitations.find((i) => i.id === invitationId);
    if (!invitation || !user) return;

    const project = projects.find((p) => p.id === invitation.projectId);
    if (!project) return;

    const newMember: ProjectMember = {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: 'member',
      avatar: user.avatar,
    };

    setProjects(projects.map((p) => (p.id === project.id ? { ...p, members: [...p.members, newMember] } : p)));
    setInvitations(invitations.map((i) => (i.id === invitationId ? { ...i, status: 'accepted' } : i)));
    toast.success(`Đã tham gia dự án: ${project.name}`);
  };

  const handleRejectInvitation = (invitationId: string) => {
    setInvitations(invitations.map((i) => (i.id === invitationId ? { ...i, status: 'rejected' } : i)));
    toast.success('Đã từ chối lời mời');
  };

  const handleRequestJoinProject = (projectId: string) => {
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

    setJoinRequests([...joinRequests, request]);
    toast.success('Đã gửi yêu cầu tham gia dự án');
  };

  const handleApproveJoinRequest = (requestId: string) => {
    const request = joinRequests.find((r) => r.id === requestId);
    if (!request) return;

    const project = projects.find((p) => p.id === request.projectId);
    if (!project) return;

    const newMember: ProjectMember = {
      userId: request.userId,
      name: request.userName,
      email: request.userEmail,
      role: 'member',
    };

    setProjects(projects.map((p) => (p.id === project.id ? { ...p, members: [...p.members, newMember] } : p)));
    setJoinRequests(joinRequests.map((r) => (r.id === requestId ? { ...r, status: 'approved' } : r)));
    toast.success(`Đã chấp nhận ${request.userName} vào dự án`);
  };

  const handleRejectJoinRequest = (requestId: string) => {
    setJoinRequests(joinRequests.map((r) => (r.id === requestId ? { ...r, status: 'rejected' } : r)));
    toast.success('Đã từ chối yêu cầu tham gia');
  };

  const getActiveProjects = () => projects.filter((p) => !p.deletedAt);
  const getDeletedProjects = () => projects.filter((p) => p.deletedAt);

  return {
    projects,
    setProjects,
    selectedProjectId,
    setSelectedProjectId,
    invitations,
    joinRequests,
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
