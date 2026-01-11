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

  // Wait for role to be fetched - if null, role is still loading
  // This prevents redirect to 403 during page refresh
  if (role === null) {
    return null; // or a loading spinner
  }

  if (role !== 'admin') {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}
