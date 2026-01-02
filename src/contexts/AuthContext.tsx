import { createContext, useContext, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { useSupabaseAuth, User } from '../hooks/useSupabaseAuth';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    adminEmail: string | null;
    handleLogin: (email: string, password: string) => Promise<User | null>;
    handleRegister: (data: { email: string; password: string; name: string; phone?: string }) => Promise<User | null>;
    handleLogout: () => Promise<void>;
    handleUpdateUser: (user: User) => Promise<void>;
    handleResetPassword: (email: string) => Promise<boolean>;
    handleChangePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
    handleAdminLogin: (email: string, password: string, onEnterAdmin?: (email: string, password: string) => void) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const auth = useSupabaseAuth();

    const value: AuthContextType = {
        user: auth.user,
        session: auth.session,
        isLoading: auth.isLoading,
        isAuthenticated: !!auth.user,
        adminEmail: auth.adminEmail,
        handleLogin: auth.handleLogin,
        handleRegister: auth.handleRegister,
        handleLogout: auth.handleLogout,
        handleUpdateUser: auth.handleUpdateUser,
        handleResetPassword: auth.handleResetPassword,
        handleChangePassword: auth.handleChangePassword,
        handleAdminLogin: auth.handleAdminLogin,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
