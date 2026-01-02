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
  const { isLoading, handleLogin, handleRegister } = useApp();

  if (isLoading) {
    return null;
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
              onLogin={handleLogin}
              onSwitchToRegister={() => navigate('/register')}
              onForgotPassword={() => navigate('/forgot-password')}
            />
          }
        />
        <Route
          path="/register"
          element={
            <RegisterPage
              onRegister={handleRegister}
              onSwitchToLogin={() => navigate('/login')}
            />
          }
        />
        <Route
          path="/forgot-password"
          element={<ForgotPasswordPage onBack={() => navigate('/login')} />}
        />

        {/* Admin Routes */}
        <Route path="/admin/*" element={<AdminRoutes />} />

        {/* Protected Routes */}
        <Route path="/*" element={<ProtectedRoutes onEnterAdmin={onEnterAdmin} />} />
      </Routes>
      <Toaster />
    </>
  );
}

// Main App component with provider
export default function App({ onEnterAdmin }: { onEnterAdmin?: (email: string, password: string) => void }) {
  return (
    <AuthProvider>
      <AppProvider onEnterAdmin={onEnterAdmin}>
        <AppContent onEnterAdmin={onEnterAdmin} />
      </AppProvider>
    </AuthProvider>
  );
}

