import { Route, Routes } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { LoginPage } from '../components/auth/LoginPage';
import { RegisterPage } from '../components/auth/RegisterPage';
import { ForgotPasswordPage } from '../components/auth/ForgotPasswordPage';
import { useApp } from '../contexts/AppContext';

export function PublicRoutes() {
    const navigate = useNavigate();
    const { handleLogin } = useApp();

    return (
        <Routes>
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
                        onRegister={(data) => {
                            const { handleRegister } = useApp();
                            handleRegister(data);
                        }}
                        onSwitchToLogin={() => navigate('/login')}
                    />
                }
            />
            <Route
                path="/forgot-password"
                element={<ForgotPasswordPage onBack={() => navigate('/login')} />}
            />
        </Routes>
    );
}
