import { Navigate } from 'react-router-dom';

interface AdminRouteProps {
  isAuthenticated: boolean;
  role: 'user' | 'admin' | null;
  children: React.ReactNode;
}

export function AdminRoute({ isAuthenticated, role, children }: AdminRouteProps) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role !== 'admin') {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}
