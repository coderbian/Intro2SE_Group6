import { createContext, useContext, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useSupabaseAuth } from '../hooks/useAuth';
import { useProjects } from '../hooks/useProjects';
import { useTasks } from '../hooks/useTasks';
import { useSprints } from '../hooks/useSprints';
import { useNotifications } from '../hooks/useNotifications';
import { useSettings } from '../hooks/useSettings';
import type { User, Project, Task, Sprint, Settings, Notification, ProjectInvitation, JoinRequest } from '../types';

interface AppContextType {
    // Auth
    user: User | null;
    isLoading: boolean;
    adminEmail: string | null;
    setAdminEmail: (email: string | null) => void;
    handleLogin: (email: string, password: string) => Promise<void>;
    handleRegister: (data: { email: string; password: string; name: string; phone?: string }) => Promise<void>;
    handleLogout: () => Promise<void>;
    handleUpdateUser: (user: User) => Promise<void>;
    handleAdminLogin: (email: string, password: string, onEnterAdmin?: (email: string, password: string) => void) => boolean;

    // Projects
    projects: Project[];
    selectedProjectId: string | null;
    invitations: ProjectInvitation[];
    joinRequests: JoinRequest[];
    handleSelectProject: (projectId: string) => void;
    handleUpdateProject: (projectId: string, updates: Partial<Project>) => void;
    handleDeleteProject: (projectId: string) => void;
    handleRestoreProject: (projectId: string) => void;
    handlePermanentlyDeleteProject: (projectId: string) => void;
    handleSendInvitation: (projectId: string, email: string) => void;
    handleAcceptInvitation: (invitationId: string) => void;
    handleCreateJoinRequest: (projectId: string) => void;
    handleApproveJoinRequest: (requestId: string) => void;
    handleRejectJoinRequest: (requestId: string) => void;

    // Tasks
    tasks: Task[];
    handleCreateTask: (task: Omit<Task, 'id' | 'createdAt' | 'comments' | 'attachments'>) => void;
    handleUpdateTask: (taskId: string, updates: Partial<Task>) => void;
    handleDeleteTask: (taskId: string) => void;
    handleRestoreTask: (taskId: string) => void;
    handlePermanentlyDeleteTask: (taskId: string) => void;
    handleAddComment: (taskId: string, content: string) => void;
    handleAddAttachment: (taskId: string, file: { name: string; url: string; type: string }) => void;
    handleProposeTask: (projectId: string, task: { title: string; description: string; priority: 'low' | 'medium' | 'high' | 'urgent' }) => void;
    handleApproveTaskProposal: (proposalId: string) => void;
    handleRejectTaskProposal: (proposalId: string) => void;

    // Sprints
    sprints: Sprint[];
    handleCreateSprint: (projectId: string, name: string, goal: string, taskIds: string[]) => void;
    handleEndSprint: (sprintId: string) => void;

    // Notifications
    notifications: Notification[];
    handleAddNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
    handleMarkNotificationAsRead: (notificationId: string) => void;
    handleMarkAllNotificationsAsRead: () => void;
    handleDeleteNotification: (notificationId: string) => void;

    // Settings
    settings: Settings;
    handleUpdateSettings: (settings: Settings) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}

interface AppProviderProps {
    children: ReactNode;
    onEnterAdmin?: (email: string, password: string) => void;
}

export function AppProvider({ children, onEnterAdmin }: AppProviderProps) {
    const navigate = useNavigate();

    // Use all hooks
    const auth = useSupabaseAuth();
    const notificationsHook = useNotifications();
    const projectsHook = useProjects({
        user: auth.user,
        onAddNotification: notificationsHook.handleAddNotification
    });
    const tasksHook = useTasks({
        user: auth.user,
        onAddNotification: notificationsHook.handleAddNotification
    });
    const sprintsHook = useSprints({
        tasks: tasksHook.tasks,
        setTasks: tasksHook.setTasks
    });
    const settingsHook = useSettings();

    // Wrapped handlers with navigation (async for Supabase)
    const handleLogin = async (email: string, password: string) => {
        const result = await auth.handleLogin(email, password);
        if (result) {
            navigate('/dashboard');
        }
    };

    const handleRegister = async (data: { email: string; password: string; name: string; phone?: string }) => {
        const result = await auth.handleRegister(data);
        if (result) {
            navigate('/dashboard');
        }
    };

    const handleLogout = async () => {
        try {
            await auth.handleLogout();
            projectsHook.setSelectedProjectId(null);
            navigate('/login');
        } catch (error) {
            toast.error('Failed to log out. Please try again.');
        }
    };

    const handleAdminLogin = (email: string, password: string, propHandler?: (email: string, password: string) => void) => {
        const success = auth.handleAdminLogin(email, password, propHandler || onEnterAdmin);
        if (success && !propHandler && !onEnterAdmin) {
            navigate('/admin/monitoring');
        }
        return success;
    };

    const handleSelectProject = (projectId: string) => {
        projectsHook.handleSelectProject(projectId);
        navigate(`/project/${projectId}`);
    };

    const handleDeleteProject = (projectId: string) => {
        projectsHook.handleDeleteProject(projectId);
        if (projectsHook.selectedProjectId === projectId) {
            projectsHook.setSelectedProjectId(null);
            navigate('/dashboard');
        }
    };

    const handlePermanentlyDeleteProject = (projectId: string) => {
        projectsHook.handlePermanentlyDeleteProject(projectId, tasksHook.handleDeleteTasksByProject);
    };

    // Comment adapter
    const handleAddComment = (taskId: string, content: string) => {
        if (!auth.user) return;
        tasksHook.handleAddComment(taskId, {
            userId: auth.user.id,
            userName: auth.user.name,
            content
        });
    };

    // Attachment adapter
    const handleAddAttachment = (taskId: string, file: { name: string; url: string; type: string }) => {
        if (!auth.user) return;
        tasksHook.handleAddAttachment(taskId, { ...file, uploadedBy: auth.user.id });
    };

    // Propose task adapter
    const handleProposeTask = (
        projectId: string,
        task: { title: string; description: string; priority: 'low' | 'medium' | 'high' | 'urgent' }
    ) => {
        if (!auth.user) return;
        const project = projectsHook.projects.find(p => p.id === projectId);
        tasksHook.handleProposeTask({
            ...task,
            projectId,
            proposedBy: auth.user.id,
            proposedByName: auth.user.name,
        });
        if (project) {
            notificationsHook.handleAddNotification({
                userId: project.ownerId,
                type: 'project_update',
                title: 'Có đề xuất nhiệm vụ mới',
                message: `${auth.user.name} đã đề xuất tạo nhiệm vụ: "${task.title}" trong dự án "${project.name}"`,
                read: false,
            });
        }
        toast.success('Đã gửi đề xuất nhiệm vụ!');
    };

    const handleApproveTaskProposal = (proposalId: string) => {
        const proposal = tasksHook.taskProposals.find(p => p.id === proposalId);
        if (!proposal) return;

        tasksHook.handleApproveProposal(proposalId);
        notificationsHook.handleAddNotification({
            userId: proposal.proposedBy,
            type: 'project_update',
            title: 'Đề xuất được chấp thuận',
            message: `Đề xuất của bạn cho nhiệm vụ "${proposal.title}" đã được chấp thuận`,
            read: false,
        });
        toast.success('Đã phê duyệt đề xuất!');
    };

    const handleRejectTaskProposal = (proposalId: string) => {
        const proposal = tasksHook.taskProposals.find(p => p.id === proposalId);
        if (!proposal) return;

        tasksHook.handleRejectProposal(proposalId);
        notificationsHook.handleAddNotification({
            userId: proposal.proposedBy,
            type: 'project_update',
            title: 'Đề xuất bị từ chối',
            message: `Đề xuất của bạn cho nhiệm vụ "${proposal.title}" đã bị từ chối`,
            read: false,
        });
        toast.success('Đã từ chối đề xuất!');
    };

    const value: AppContextType = {
        // Auth
        user: auth.user,
        isLoading: auth.isLoading,
        adminEmail: auth.adminEmail,
        setAdminEmail: auth.setAdminEmail,
        handleLogin,
        handleRegister,
        handleLogout,
        handleUpdateUser: auth.handleUpdateUser,
        handleAdminLogin,

        // Projects
        projects: projectsHook.projects,
        selectedProjectId: projectsHook.selectedProjectId,
        invitations: projectsHook.invitations,
        joinRequests: projectsHook.joinRequests,
        handleSelectProject,
        handleUpdateProject: projectsHook.handleUpdateProject,
        handleDeleteProject,
        handleRestoreProject: projectsHook.handleRestoreProject,
        handlePermanentlyDeleteProject,
        handleSendInvitation: projectsHook.handleSendInvitation,
        handleAcceptInvitation: projectsHook.handleAcceptInvitation,
        handleCreateJoinRequest: projectsHook.handleRequestJoinProject,
        handleApproveJoinRequest: projectsHook.handleApproveJoinRequest,
        handleRejectJoinRequest: projectsHook.handleRejectJoinRequest,

        // Tasks
        tasks: tasksHook.tasks,
        handleCreateTask: tasksHook.handleCreateTask,
        handleUpdateTask: tasksHook.handleUpdateTask,
        handleDeleteTask: tasksHook.handleDeleteTask,
        handleRestoreTask: tasksHook.handleRestoreTask,
        handlePermanentlyDeleteTask: tasksHook.handlePermanentlyDeleteTask,
        handleAddComment,
        handleAddAttachment,
        handleProposeTask,
        handleApproveTaskProposal,
        handleRejectTaskProposal,

        // Sprints
        sprints: sprintsHook.sprints,
        handleCreateSprint: sprintsHook.handleCreateSprint,
        handleEndSprint: sprintsHook.handleEndSprint,

        // Notifications
        notifications: notificationsHook.notifications,
        handleAddNotification: notificationsHook.handleAddNotification,
        handleMarkNotificationAsRead: notificationsHook.handleMarkNotificationAsRead,
        handleMarkAllNotificationsAsRead: notificationsHook.handleMarkAllNotificationsAsRead,
        handleDeleteNotification: notificationsHook.handleDeleteNotification,

        // Settings
        settings: settingsHook.settings,
        handleUpdateSettings: settingsHook.handleUpdateSettings,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}
