import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { getSupabaseClient } from '../lib/supabase-client';
import type { Database, Json } from '../types/supabase';

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

type UserPreferencesRow = Database['public']['Tables']['user_preferences']['Row'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseSettingsFromUserPreferences(row: UserPreferencesRow | null): Settings {
  const display = row?.display;
  const notifications = row?.notifications;

  const next: Settings = { ...defaultSettings };

  if (isRecord(display)) {
    const theme = display.theme;
    const language = display.language;
    const linkedAccounts = display.linkedAccounts;

    if (theme === 'light' || theme === 'dark') {
      next.theme = theme;
    }
    if (language === 'vi' || language === 'en') {
      next.language = language;
    }
    if (isRecord(linkedAccounts)) {
      next.linkedAccounts = linkedAccounts as Settings['linkedAccounts'];
    }
  }

  if (isRecord(notifications)) {
    next.notifications = {
      taskAssigned: typeof notifications.taskAssigned === 'boolean' ? notifications.taskAssigned : next.notifications.taskAssigned,
      taskCompleted: typeof notifications.taskCompleted === 'boolean' ? notifications.taskCompleted : next.notifications.taskCompleted,
      projectUpdates: typeof notifications.projectUpdates === 'boolean' ? notifications.projectUpdates : next.notifications.projectUpdates,
      emailNotifications: typeof notifications.emailNotifications === 'boolean' ? notifications.emailNotifications : next.notifications.emailNotifications,
    };
  }

  return next;
}

function toUserPreferencesPayload(settings: Settings): Pick<UserPreferencesRow, 'display' | 'notifications'> {
  const display: Json = {
    theme: settings.theme,
    language: settings.language,
    linkedAccounts: settings.linkedAccounts,
  };

  const notifications: Json = { ...settings.notifications };

  return { display, notifications };
}

export function useSettings(userId?: string) {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const didLoadFromRemoteRef = useRef(false);

  // Load from Supabase when user changes
  useEffect(() => {
    let cancelled = false;

    async function load() {
      didLoadFromRemoteRef.current = false;

      if (!userId) {
        setSettings(defaultSettings);
        return;
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error('Failed to load user preferences:', error);
        toast.error('Không thể tải cài đặt người dùng');
        setSettings(defaultSettings);
        return;
      }

      if (!data) {
        // First-time user: create defaults
        const payload = toUserPreferencesPayload(defaultSettings);
        const { error: upsertError } = await supabase
          .from('user_preferences')
          .upsert({ user_id: userId, ...payload }, { onConflict: 'user_id' });

        if (upsertError) {
          console.error('Failed to create default user preferences:', upsertError);
        }

        setSettings(defaultSettings);
        didLoadFromRemoteRef.current = true;
        return;
      }

      setSettings(parseSettingsFromUserPreferences(data));
      didLoadFromRemoteRef.current = true;
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [supabase, userId]);

  // Persist to Supabase after initial load
  useEffect(() => {
    let cancelled = false;

    async function persist() {
      if (!userId) return;
      if (!didLoadFromRemoteRef.current) return;

      const payload = toUserPreferencesPayload(settings);
      const { error } = await supabase
        .from('user_preferences')
        .upsert({ user_id: userId, ...payload }, { onConflict: 'user_id' });

      if (cancelled) return;

      if (error) {
        console.error('Failed to save user preferences:', error);
        toast.error('Không thể lưu cài đặt người dùng');
      }
    }

    persist();
    return () => {
      cancelled = true;
    };
  }, [settings, supabase, userId]);

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

  const linkAccount = (provider: 'google' | 'github', email: string) => {
    setSettings((prev) => ({
      ...prev,
      linkedAccounts: {
        ...prev.linkedAccounts,
        [provider]: { email, linkedAt: new Date().toISOString() },
      },
    }));
  };

  const unlinkAccount = (provider: 'google' | 'github') => {
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
