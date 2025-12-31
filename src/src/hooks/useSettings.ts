import { useState, useEffect } from 'react';

export interface Settings {
  theme: 'light' | 'dark';
  language: 'vi' | 'en';
  notifications: {
    taskAssigned: boolean;
    taskCompleted: boolean;
    projectUpdates: boolean;
    emailNotifications: boolean;
  };
  linkedAccounts: {
    google?: { email: string; linkedAt: string };
    facebook?: { email: string; linkedAt: string };
    github?: { email: string; linkedAt: string };
  };
}

const defaultSettings: Settings = {
  theme: 'light',
  language: 'vi',
  notifications: {
    taskAssigned: true,
    taskCompleted: true,
    projectUpdates: true,
    emailNotifications: false,
  },
  linkedAccounts: {},
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('planora_settings', JSON.stringify(settings));
  }, [settings]);

  // Apply theme
  useEffect(() => {
    const isDark = settings.theme === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  const handleUpdateSettings = (updatedSettings: Settings) => {
    setSettings(updatedSettings);
  };

  const toggleTheme = () => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light',
    }));
  };

  const updateNotificationSettings = (key: keyof Settings['notifications'], value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value,
      },
    }));
  };

  const linkAccount = (provider: 'google' | 'facebook' | 'github', email: string) => {
    setSettings((prev) => ({
      ...prev,
      linkedAccounts: {
        ...prev.linkedAccounts,
        [provider]: { email, linkedAt: new Date().toISOString() },
      },
    }));
  };

  const unlinkAccount = (provider: 'google' | 'facebook' | 'github') => {
    setSettings((prev) => {
      const { [provider]: _, ...rest } = prev.linkedAccounts;
      return {
        ...prev,
        linkedAccounts: rest,
      };
    });
  };

  return {
    settings,
    setSettings,
    handleUpdateSettings,
    toggleTheme,
    updateNotificationSettings,
    linkAccount,
    unlinkAccount,
  };
}
