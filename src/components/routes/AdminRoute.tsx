import { Navigate } from 'react-router-dom';

interface AdminRouteProps {
  adminEmail: string | null;
  children: React.ReactNode;
}

export function AdminRoute({ adminEmail, children }: AdminRouteProps) {
  if (!adminEmail) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
