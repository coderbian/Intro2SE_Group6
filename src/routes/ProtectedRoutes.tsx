import { Route, Routes, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ProtectedRoute } from '../components/routes/ProtectedRoute';
import { MainLayout } from '../components/layout/MainLayout';
import { DashboardPage } from '../components/dashboard/DashboardPage';
import { ProfilePage } from '../components/profile/ProfilePage';
import { SettingsPage } from '../components/settings/SettingsPage';
import { TrashPage } from '../components/trash/TrashPage';
import { AllProjectsPage } from '../components/projects/AllProjectsPage';
import { MemberRequestsPage } from '../components/member-requests/MemberRequestsPage';
import { ProjectPage } from '../components/project/ProjectPage';
import { ChatAssistant } from '../components/chat/ChatAssistant';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';

// Wrapper component to use URL params for ProjectPage
function ProjectPageWrapper() {
    const { projectId } = useParams<{ projectId: string }>();
    const { auth, projects, tasks, sprints } = useApp();
    const { user } = auth;

    const project = projects.projects.find((p) => p.id === projectId);

    if (!projectId || !project) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <ProjectPage
            user={user!}
            project={project}
            tasks={tasks.tasks.filter((t) => t.projectId === projectId)}
            sprints={sprints.sprints.filter((s) => s.projectId === projectId)}
            currentSprint={sprints.sprints.find((s) => s.projectId === projectId && s.status === 'active')}
            onUpdateProject={projects.handleUpdateProject}
            onDeleteProject={projects.handlePermanentlyDeleteProject}
            onMoveToTrash={projects.handleDeleteProject}
            onCreateTask={tasks.handleCreateTask}
            onUpdateTask={tasks.handleUpdateTask}
            onDeleteTask={tasks.handleDeleteTask}
            onAddComment={tasks.handleAddComment}
            onAddAttachment={tasks.handleAddAttachment}
            onCreateSprint={sprints.handleCreateSprint}
            onEndSprint={sprints.handleEndSprint}
        />
    );
}

interface ProtectedRoutesProps {
    onEnterAdmin?: (email: string, password: string) => void;
}

export function ProtectedRoutes({ onEnterAdmin }: ProtectedRoutesProps) {
    const navigate = useNavigate();
    const { auth, projects, tasks, sprints, settings, notifications } = useApp();
    const { user, handleLogout, handleUpdateUser } = auth;
    const { handleChangePassword } = useAuth();

    // Wrapper that selects project AND navigates to project page
    const handleSelectProjectWithNavigate = (projectId: string) => {
        projects.handleSelectProject(projectId);
        navigate(`/project/${projectId}`);
    };

    // Filter notifications and join requests for current user
    const userNotifications = notifications.notifications.filter((n) => n.userId === user?.id);
    const userInvitations = projects.invitations.filter((i) => i.invitedEmail === user?.email);
    const managerJoinRequests = projects.joinRequests.filter((r) => {
        const proj = projects.projects.find((p) => p.id === r.projectId);
        const isManager =
            proj?.members.find((m) => m.userId === user?.id)?.role === 'manager' || proj?.ownerId === user?.id;
        return isManager;
    });

    return (
        <ProtectedRoute user={user}>
            <MainLayout
                user={user!}
                projects={projects.projects}
                selectedProjectId={projects.selectedProjectId}
                settings={settings.settings}
                notifications={userNotifications}
                invitations={userInvitations}
                joinRequests={managerJoinRequests}
                onSelectProject={handleSelectProjectWithNavigate}
                onLogout={handleLogout}
                onUpdateSettings={settings.handleUpdateSettings}
                onMarkNotificationAsRead={notifications.handleMarkNotificationAsRead}
                onMarkAllNotificationsAsRead={notifications.handleMarkAllNotificationsAsRead}
                onDeleteNotification={notifications.handleDeleteNotification}
                onAddNotification={notifications.handleAddNotification}
                onSendInvitation={projects.handleSendInvitation}
                onAcceptInvitation={projects.handleAcceptInvitation}
                onCreateJoinRequest={projects.handleRequestJoinProject}
                onApproveJoinRequest={projects.handleApproveJoinRequest}
                onRejectJoinRequest={projects.handleRejectJoinRequest}
                onRestoreProject={projects.handleRestoreProject}
                onPermanentlyDeleteProject={projects.handlePermanentlyDeleteProject}
                onRestoreTask={tasks.handleRestoreTask}
                onPermanentlyDeleteTask={tasks.handlePermanentlyDeleteTask}
                onEnterAdmin={onEnterAdmin}
            >
                <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route
                        path="/dashboard"
                        element={
                            <DashboardPage
                                user={user!}
                                projects={projects.projects.filter((p) => !p.deletedAt)}
                                tasks={tasks.tasks}
                                onSelectProject={handleSelectProjectWithNavigate}
                            />
                        }
                    />
                    <Route path="/profile" element={<ProfilePage user={user!} onUpdateUser={handleUpdateUser} onChangePassword={handleChangePassword} />} />
                    <Route
                        path="/settings"
                        element={
                            <SettingsPage
                                settings={settings.settings}
                                onUpdateSettings={settings.handleUpdateSettings}
                                onNavigate={(page) => navigate(`/${page}`)}
                            />
                        }
                    />
                    <Route
                        path="/trash"
                        element={
                            <TrashPage
                                projects={projects.projects}
                                tasks={tasks.tasks}
                                onRestoreProject={projects.handleRestoreProject}
                                onPermanentlyDeleteProject={projects.handlePermanentlyDeleteProject}
                                onRestoreTask={tasks.handleRestoreTask}
                                onPermanentlyDeleteTask={tasks.handlePermanentlyDeleteTask}
                            />
                        }
                    />
                    <Route
                        path="/projects"
                        element={
                            <AllProjectsPage
                                user={user!}
                                projects={projects.projects}
                                onSelectProject={handleSelectProjectWithNavigate}
                                onCreateJoinRequest={projects.handleRequestJoinProject}
                            />
                        }
                    />
                    <Route
                        path="/member-requests"
                        element={
                            <MemberRequestsPage
                                joinRequests={projects.joinRequests}
                                onApproveJoinRequest={projects.handleApproveJoinRequest}
                                onRejectJoinRequest={projects.handleRejectJoinRequest}
                            />
                        }
                    />
                    <Route path="/project/:projectId" element={<ProjectPageWrapper />} />
                </Routes>
            </MainLayout>
            <ChatAssistant project={projects.projects.find((p) => p.id === projects.selectedProjectId)} />
        </ProtectedRoute>
    );
}
