import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, profileService } from '@/services/api';
import { STORAGE_KEYS } from '@/constants/config';
import { getSelectedBranchSlug } from '@/store/branchStore';
import type { User } from '@/types';

let restoreGeneration = 0;

interface AuthState {
  user: User | null;
  schoolId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  resetEmail: string;
  resetPhone: string;
  resetMethod: 'email' | 'phone';
  login: (studentId: string, password: string) => Promise<void>;
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

  login: async (studentId, password) => {
    restoreGeneration += 1;
    const branchSlug = (await getSelectedBranchSlug()) ?? undefined;
    const response = await authService.login(studentId, password, branchSlug);
    const schoolId = (response as { schoolId?: string | null }).schoolId ?? branchSlug ?? null;
    await authService.saveSession(response, response.user, schoolId);
    set({ user: response.user, schoolId, isAuthenticated: true });
  },

  logout: async () => {
    const branchSlug = await getSelectedBranchSlug();
    try {
      await authService.clearSession();
    } catch {
      // Clear local state even if secure storage fails (e.g. web)
    }
    set({ user: null, schoolId: branchSlug, isAuthenticated: false, isLoading: false });
  },

  restoreSession: async () => {
    const generation = ++restoreGeneration;
    try {
      const branchSlug = await getSelectedBranchSlug();
      const hasSession = await authService.hasSession();
      if (generation !== restoreGeneration) return;
      if (!hasSession) {
        set({ schoolId: branchSlug, isLoading: false });
        return;
      }

      const user = await authService.getStoredUser();
      if (generation !== restoreGeneration) return;
      let schoolId = await authService.getStoredSchoolId();
      if (!schoolId) {
        schoolId = branchSlug ?? 'idpscherukupalli';
        if (schoolId) {
          await AsyncStorage.setItem(STORAGE_KEYS.SCHOOL_ID, schoolId);
        }
      }

      if (!user) {
        await authService.clearSession();
        if (generation !== restoreGeneration) return;
        set({ user: null, schoolId: branchSlug, isAuthenticated: false, isLoading: false });
        return;
      }

      let freshUser = user;
      try {
        freshUser = await profileService.get();
      } catch {
        // Keep cached user if profile refresh fails offline.
      }

      if (generation !== restoreGeneration) return;
      set({ user: freshUser, schoolId, isAuthenticated: true, isLoading: false });
    } catch {
      if (generation !== restoreGeneration) return;
      const branchSlug = await getSelectedBranchSlug();
      set({ user: null, schoolId: branchSlug, isAuthenticated: false, isLoading: false });
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
  /** Student override; null means follow school current year. */
  selectedAcademicYear: string | null;
  setNotifications: (v: boolean) => void;
  setLanguage: (v: string) => void;
  setPrivacyAnalytics: (v: boolean) => void;
  setSelectedAcademicYear: (year: string | null) => Promise<void>;
  hydrate: () => Promise<void>;
}

async function persistSettings(patch: Partial<SettingsState>) {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
    const prev = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    await AsyncStorage.setItem(
      STORAGE_KEYS.APP_SETTINGS,
      JSON.stringify({
        ...prev,
        notificationsEnabled: patch.notificationsEnabled ?? prev.notificationsEnabled,
        language: patch.language ?? prev.language,
        privacyAnalytics: patch.privacyAnalytics ?? prev.privacyAnalytics,
      }),
    );
  } catch {
    // ignore
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  notificationsEnabled: true,
  language: 'English',
  privacyAnalytics: true,
  selectedAcademicYear: null,
  setNotifications: (v) => {
    set({ notificationsEnabled: v });
    void persistSettings({ ...get(), notificationsEnabled: v });
  },
  setLanguage: (v) => {
    set({ language: v });
    void persistSettings({ ...get(), language: v });
  },
  setPrivacyAnalytics: (v) => {
    set({ privacyAnalytics: v });
    void persistSettings({ ...get(), privacyAnalytics: v });
  },
  setSelectedAcademicYear: async (year) => {
    const next = year?.trim() || null;
    set({ selectedAcademicYear: next });
    if (next) {
      await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_ACADEMIC_YEAR, next);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_ACADEMIC_YEAR);
    }
  },
  hydrate: async () => {
    const [raw, selectedYear] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.APP_SETTINGS),
      AsyncStorage.getItem(STORAGE_KEYS.SELECTED_ACADEMIC_YEAR),
    ]);
    if (raw) {
      const settings = JSON.parse(raw);
      set({
        notificationsEnabled: settings.notificationsEnabled ?? true,
        language: settings.language ?? 'English',
        privacyAnalytics: settings.privacyAnalytics ?? true,
        selectedAcademicYear: selectedYear?.trim() || null,
      });
    } else {
      set({ selectedAcademicYear: selectedYear?.trim() || null });
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

