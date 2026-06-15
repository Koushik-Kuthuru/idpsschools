import { create } from 'zustand';

interface AppState {
  isOffline: boolean;
  notificationsEnabled: boolean;
  darkMode: boolean;
  setOffline: (v: boolean) => void;
  setNotificationsEnabled: (v: boolean) => void;
  toggleDarkMode: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isOffline: false,
  notificationsEnabled: true,
  darkMode: false,
  setOffline: (isOffline) => set({ isOffline }),
  setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
  toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
}));
