import { Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import { AdminRoute } from '../components/routes/AdminRoute';
import { AdminDashboard, RoleManagement, ProjectManagement, Dashboard } from '../components/admin';
import { useApp } from '../contexts/AppContext';

export function AdminRoutes() {
    const navigate = useNavigate();
    const { user, role, adminEmail, handleLogout } = useApp();

    const handleAdminLogout = async () => {
        await handleLogout();
        navigate('/login');
    };

    const handleAdminNavigate = (page: 'dashboard' | 'users' | 'roles' | 'projects') => {
        navigate(`/admin/${page}`);
    };

    return (
        <AdminRoute isAuthenticated={!!user} role={role}>
            <Routes>
                <Route
                    path="dashboard"
                    element={
                        <Dashboard
                            adminEmail={adminEmail || undefined}
                            onNavigate={handleAdminNavigate}
                            onLogout={handleAdminLogout}
                        />
                    }
                />
                <Route
                    path="users"
                    element={
                        <AdminDashboard
                            adminEmail={adminEmail || undefined}
                            onNavigate={handleAdminNavigate}
                            onLogout={handleAdminLogout}
                        />
                    }
                />
                <Route
                    path="roles"
                    element={
                        <RoleManagement
                            adminEmail={adminEmail || undefined}
                            onNavigate={handleAdminNavigate}
                            onLogout={handleAdminLogout}
                        />
                    }
                />
                <Route
                    path="projects"
                    element={
                        <ProjectManagement
                            adminEmail={adminEmail || undefined}
                            onNavigate={handleAdminNavigate}
                            onLogout={handleAdminLogout}
                        />
                    }
                />
                <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
            </Routes>
        </AdminRoute>
    );
}
