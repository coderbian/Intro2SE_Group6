import { useState, useEffect, useCallback } from 'react';
import { Session, User as SupabaseUser, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase-client';
import { toast } from 'sonner';

export interface User {
    id: string;
    email: string;
    name: string;
    phone?: string;
    avatar?: string;
}

interface UseSupabaseAuthReturn {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    adminEmail: string | null;
    setAdminEmail: (email: string | null) => void;
    handleLogin: (email: string, password: string) => Promise<User | null>;
    handleRegister: (data: { email: string; password: string; name: string; phone?: string }) => Promise<User | null>;
    handleLogout: () => Promise<void>;
    handleUpdateUser: (user: User) => Promise<void>;
    handleAdminLogin: (
        email: string,
        password: string,
        onEnterAdmin?: (email: string, password: string) => void
    ) => boolean;
    handleResetPassword: (email: string) => Promise<boolean>;
    handleChangePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}

// Helper to convert Supabase user to app User
function toAppUser(supabaseUser: SupabaseUser): User {
    return {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
        phone: supabaseUser.user_metadata?.phone,
        avatar: supabaseUser.user_metadata?.avatar_url,
    };
}

export function useSupabaseAuth(): UseSupabaseAuthReturn {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [adminEmail, setAdminEmail] = useState<string | null>(null);

    // Initialize auth state
    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ? toAppUser(session.user) : null);
            setIsLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setSession(session);
                setUser(session?.user ? toAppUser(session.user) : null);
                setIsLoading(false);

                if (event === 'SIGNED_IN') {
                    toast.success('Đăng nhập thành công!');
                } else if (event === 'SIGNED_OUT') {
                    toast.info('Đã đăng xuất');
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const handleLogin = useCallback(async (email: string, password: string): Promise<User | null> => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                handleAuthError(error);
                return null;
            }

            if (data.user) {
                const appUser = toAppUser(data.user);
                setUser(appUser);
                return appUser;
            }

            return null;
        } catch (error) {
            toast.error('Đã xảy ra lỗi khi đăng nhập');
            return null;
        }
    }, []);

    const handleRegister = useCallback(async (data: {
        email: string;
        password: string;
        name: string;
        phone?: string;
    }): Promise<User | null> => {
        try {
            const { data: authData, error } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        name: data.name,
                        phone: data.phone,
                    },
                },
            });

            if (error) {
                handleAuthError(error);
                return null;
            }

            if (authData.user) {
                // Check if email confirmation is required
                if (authData.user.identities?.length === 0) {
                    toast.error('Email này đã được đăng ký');
                    return null;
                }

                if (!authData.session) {
                    toast.success('Vui lòng kiểm tra email để xác nhận tài khoản');
                    return null;
                }

                const appUser = toAppUser(authData.user);
                setUser(appUser);
                toast.success('Đăng ký thành công!');
                return appUser;
            }

            return null;
        } catch (error) {
            toast.error('Đã xảy ra lỗi khi đăng ký');
            return null;
        }
    }, []);

    const handleLogout = useCallback(async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                toast.error('Đã xảy ra lỗi khi đăng xuất');
                return;
            }
            setUser(null);
            setSession(null);
        } catch (error) {
            toast.error('Đã xảy ra lỗi khi đăng xuất');
        }
    }, []);

    const handleUpdateUser = useCallback(async (updatedUser: User) => {
        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    name: updatedUser.name,
                    phone: updatedUser.phone,
                    avatar_url: updatedUser.avatar,
                },
            });

            if (error) {
                toast.error('Không thể cập nhật thông tin người dùng');
                return;
            }

            setUser(updatedUser);
            toast.success('Cập nhật thông tin thành công!');
        } catch (error) {
            toast.error('Đã xảy ra lỗi khi cập nhật thông tin');
        }
    }, []);

    const handleResetPassword = useCallback(async (email: string): Promise<boolean> => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) {
                handleAuthError(error);
                return false;
            }

            toast.success('Đã gửi email khôi phục mật khẩu!');
            return true;
        } catch (error) {
            toast.error('Đã xảy ra lỗi khi gửi email khôi phục');
            return false;
        }
    }, []);

    const handleAdminLogin = useCallback((
        email: string,
        password: string,
        onEnterAdmin?: (email: string, password: string) => void
    ): boolean => {
        if (!email.includes('@gmail.com')) {
            toast.error('Email admin phải có đuôi @gmail.com');
            return false;
        }

        if (password.length < 6) {
            toast.error('Mật khẩu phải có ít nhất 6 ký tự');
            return false;
        }

        if (onEnterAdmin) {
            try {
                onEnterAdmin(email, password);
                return true;
            } catch (e) {
                console.warn('onEnterAdmin threw', e);
            }
        }

        if (typeof window !== 'undefined' && (window as any).__onEnterAdmin) {
            (window as any).__onEnterAdmin(email, password);
            return true;
        }

        toast.success('Đăng nhập admin thành công');
        localStorage.setItem('planora_admin', JSON.stringify({ email, loginAt: new Date().toISOString() }));
        setAdminEmail(email);
        return true;
    }, []);

    const handleChangePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<boolean> => {
        try {
            // First, verify current password by re-authenticating
            if (!user?.email) {
                toast.error('Không tìm thấy thông tin người dùng');
                return false;
            }

            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: currentPassword,
            });

            if (signInError) {
                toast.error('Mật khẩu hiện tại không đúng');
                return false;
            }

            // Now update to new password
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (updateError) {
                toast.error('Không thể đổi mật khẩu: ' + updateError.message);
                return false;
            }

            toast.success('Đổi mật khẩu thành công!');
            return true;
        } catch (error) {
            toast.error('Đã xảy ra lỗi khi đổi mật khẩu');
            return false;
        }
    }, [user?.email]);

    return {
        user,
        session,
        isLoading,
        adminEmail,
        setAdminEmail,
        handleLogin,
        handleRegister,
        handleLogout,
        handleUpdateUser,
        handleAdminLogin,
        handleResetPassword,
        handleChangePassword,
    };
}

// Helper function to handle auth errors with Vietnamese messages
function handleAuthError(error: AuthError) {
    const errorMessages: Record<string, string> = {
        'Invalid login credentials': 'Email hoặc mật khẩu không đúng',
        'Email not confirmed': 'Vui lòng xác nhận email trước khi đăng nhập',
        'User already registered': 'Email này đã được đăng ký',
        'Password should be at least 6 characters': 'Mật khẩu phải có ít nhất 6 ký tự',
        'Unable to validate email address: invalid format': 'Định dạng email không hợp lệ',
        'Email rate limit exceeded': 'Đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau',
    };

    const message = errorMessages[error.message] || error.message;
    toast.error(message);
}
