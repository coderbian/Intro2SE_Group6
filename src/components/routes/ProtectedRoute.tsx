import { Navigate } from 'react-router-dom';
import type { User } from '../../App';

interface ProtectedRouteProps {
  user: User | null;
  children: React.ReactNode;
}

export function ProtectedRoute({ user, children }: ProtectedRouteProps) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
