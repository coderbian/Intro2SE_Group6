import { Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AdminRoute } from '../components/routes/AdminRoute';
import { AdminDashboard, RoleManagement, SystemMonitoring, SystemSettings, BackupRestore } from '../components/admin';
import { useApp } from '../contexts/AppContext';

export function AdminRoutes() {
    const navigate = useNavigate();
    const { user, role, adminEmail, handleLogout } = useApp();

    const handleAdminLogout = async () => {
        await handleLogout();
        toast.success('Đã đăng xuất khỏi admin');
        navigate('/login');
    };

    const handleAdminNavigate = (page: 'dashboard' | 'users' | 'roles' | 'settings' | 'backup') => {
        navigate(`/admin/${page}`);
    };

    return (
        <AdminRoute isAuthenticated={!!user} role={role}>
            <Routes>
                <Route
                    path="dashboard"
                    element={
                        <SystemMonitoring
                            adminEmail={adminEmail || undefined}
                            onNavigate={handleAdminNavigate}
                            onLogout={handleAdminLogout}
                        />
                    }
                />
                <Route
                    path="monitoring"
                    element={
                        <SystemMonitoring
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
                    path="settings"
                    element={
                        <SystemSettings
                            adminEmail={adminEmail || undefined}
                            onNavigate={handleAdminNavigate}
                            onLogout={handleAdminLogout}
                        />
                    }
                />
                <Route
                    path="backup"
                    element={
                        <BackupRestore
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
