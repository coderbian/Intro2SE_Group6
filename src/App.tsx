import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './components/auth/ResetPasswordPage';
import { ForbiddenPage } from './components/auth/ForbiddenPage';
import { AuthCallbackPage } from './components/auth/AuthCallbackPage';
import { Toaster } from './components/ui/sonner';
import { AppProvider, useApp } from './contexts/AppContext';
import { AuthProvider } from './contexts/AuthContext';
import { AdminRoutes } from './routes/AdminRoutes';
import { ProtectedRoutes } from './routes/ProtectedRoutes';

// Inner component that uses context
function AppContent({ onEnterAdmin }: { onEnterAdmin?: (email: string, password: string) => void }) {
  const navigate = useNavigate();
  const { auth, isLoading } = useApp();
  const { handleLogin, handleRegister, user, role } = auth;

  // Wrapper to convert Promise<LoginResult | null> to void
  const handleLoginWrapper = async (email: string, password: string) => {
    const result = await handleLogin(email, password);
    if (result) {
      // Navigate based on role
      if (result.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/projects');
      }
    }
  };

  const handleRegisterWrapper = async (data: { email: string; password: string; name: string; phone?: string }) => {
    const result = await handleRegister(data);
    if (result) {
      navigate('/projects');
    }
  };

  if (isLoading) {
    return null;
  }

  // Redirect if already logged in
  if (user) {
    return (
      <>
        <Routes>
          <Route path="/403" element={<ForbiddenPage onGoHome={() => navigate('/projects')} />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/login" element={<Navigate to={role === 'admin' ? '/admin/dashboard' : '/projects'} replace />} />
          <Route path="/register" element={<Navigate to="/projects" replace />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage onBack={() => navigate('/login')} />} />
          <Route path="/admin/*" element={<AdminRoutes />} />
          <Route path="/*" element={<ProtectedRoutes onEnterAdmin={onEnterAdmin} />} />
        </Routes>
        <Toaster />
      </>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/403" element={<ForbiddenPage onGoHome={() => navigate('/projects')} />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <LoginPage
              onLogin={handleLoginWrapper}
              onSwitchToRegister={() => navigate('/register')}
              onForgotPassword={() => navigate('/forgot-password')}
            />
          }
        />
        <Route
          path="/register"
          element={
            <RegisterPage
              onRegister={handleRegisterWrapper}
              onSwitchToLogin={() => navigate('/login')}
            />
          }
        />
        <Route
          path="/forgot-password"
          element={<ForgotPasswordPage onBack={() => navigate('/login')} />}
        />

        {/* Default redirect to login */}
        <Route path="/*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Toaster />
    </>
  );
}

// Main App component with provider
export default function App({ onEnterAdmin }: { onEnterAdmin?: (email: string, password: string) => void }) {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent onEnterAdmin={onEnterAdmin} />
      </AppProvider>
    </AuthProvider>
  );
}
