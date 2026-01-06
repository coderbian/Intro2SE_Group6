import { Route, Routes } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { LoginPage } from '../components/auth/LoginPage';
import { RegisterPage } from '../components/auth/RegisterPage';
import { ForgotPasswordPage } from '../components/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../components/auth/ResetPasswordPage';
import { useApp } from '../contexts/AppContext';

export function PublicRoutes() {
    const navigate = useNavigate();
    const { auth } = useApp();
    const { handleLogin, handleRegister } = auth;

    // Wrapper to convert Promise<LoginResult | null> to void
    const handleLoginWrapper = async (email: string, password: string) => {
        const result = await handleLogin(email, password);
        if (result) {
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

    return (
        <Routes>
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
            <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Routes>
    );
}
