import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  useEffect(() => {
    // Clear localStorage on mount (for demo purposes)
    localStorage.clear();
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('planora_user', JSON.stringify(user));
    }
  }, [user]);

  const handleLogin = (email: string, password: string) => {
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name: email.split('@')[0],
    };
    setUser(newUser);
    return newUser;
  };

  const handleRegister = (data: { email: string; password: string; name: string; phone?: string }) => {
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email: data.email,
      name: data.name,
      phone: data.phone,
    };
    setUser(newUser);
    return newUser;
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('planora_user');
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const handleAdminLogin = (
    email: string,
    password: string,
    onEnterAdmin?: (email: string, password: string) => void
  ) => {
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
  };

  return {
    user,
    isLoading,
    adminEmail,
    setAdminEmail,
    handleLogin,
    handleRegister,
    handleLogout,
    handleUpdateUser,
    handleAdminLogin,
  };
}
