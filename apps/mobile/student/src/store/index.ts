import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '@/services/api';
import { STORAGE_KEYS } from '@/constants/config';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  schoolId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  resetEmail: string;
  resetPhone: string;
  resetMethod: 'email' | 'phone';
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  setResetContact: (payload: { method: 'email' | 'phone'; email?: string; phone?: string }) => void;
  clearResetContact: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  schoolId: null,
  isAuthenticated: false,
  isLoading: true,
  resetEmail: '',
  resetPhone: '',
  resetMethod: 'email',

  login: async (email, password) => {
    const response = await authService.login(email, password);
    const schoolId = (response as any).schoolId || null;
    await authService.saveSession(response, response.user, schoolId);
    set({ user: response.user, schoolId, isAuthenticated: true });
  },

  logout: async () => {
    try {
      await authService.clearSession();
    } catch {
      // Clear local state even if secure storage fails (e.g. web)
    }
    set({ user: null, schoolId: null, isAuthenticated: false, isLoading: false });
  },

  restoreSession: async () => {
    try {
      const hasSession = await authService.hasSession();
      if (hasSession) {
        const user = await authService.getStoredUser();
        const schoolId = await authService.getStoredSchoolId();
        set({ user, schoolId, isAuthenticated: !!user, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  setResetContact: ({ method, email, phone }) =>
    set({
      resetMethod: method,
      resetEmail: email ?? '',
      resetPhone: phone ?? '',
    }),
  clearResetContact: () => set({ resetEmail: '', resetPhone: '', resetMethod: 'email' }),
}));

interface ThemeState {
  isDark: boolean;
  toggleDark: () => void;
  setDark: (value: boolean) => void;
  hydrate: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: false,
  toggleDark: () => {
    const next = !get().isDark;
    set({ isDark: next });
    AsyncStorage.setItem(STORAGE_KEYS.THEME, next ? 'dark' : 'light');
  },
  setDark: (value) => {
    set({ isDark: value });
    AsyncStorage.setItem(STORAGE_KEYS.THEME, value ? 'dark' : 'light');
  },
  hydrate: async () => {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
    if (stored) set({ isDark: stored === 'dark' });
  },
}));

interface SettingsState {
  notificationsEnabled: boolean;
  language: string;
  privacyAnalytics: boolean;
  setNotifications: (v: boolean) => void;
  setLanguage: (v: string) => void;
  setPrivacyAnalytics: (v: boolean) => void;
  hydrate: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  notificationsEnabled: true,
  language: 'English',
  privacyAnalytics: true,
  setNotifications: (v) => set({ notificationsEnabled: v }),
  setLanguage: (v) => set({ language: v }),
  setPrivacyAnalytics: (v) => set({ privacyAnalytics: v }),
  hydrate: async () => {
    const raw = await AsyncStorage.getItem('app_settings');
    if (raw) {
      const settings = JSON.parse(raw);
      set(settings);
    }
  },
}));

interface OfflineState {
  isOffline: boolean;
  setOffline: (v: boolean) => void;
}

export const useOfflineStore = create<OfflineState>((set) => ({
  isOffline: false,
  setOffline: (v) => set({ isOffline: v }),
}));

