import { create } from 'zustand';
import { mockApi } from '@/services/api';
import type { StaffUser } from '@/types';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: StaffUser | null;
  pendingEmail: string;
  login: (email: string, password: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<void>;
  verifyResetOtp: (otp: string) => Promise<void>;
  resetPassword: (password: string) => Promise<void>;
  sendChangePasswordOtp: () => Promise<string>;
  changePasswordWithOtp: (otp: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateAvatar: (uri: string) => Promise<void>;
  updateName: (name: string) => Promise<void>;
  setUser: (user: StaffUser | null) => void;
  setPendingEmail: (email: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: false,
  user: null,
  pendingEmail: '',
  login: async (email, password) => {
    set({ isLoading: true });
    try {
      await mockApi.auth.login(email, password);
      set({ pendingEmail: email });
    } finally {
      set({ isLoading: false });
    }
  },
  verifyOtp: async (otp) => {
    set({ isLoading: true });
    try {
      const { user } = await mockApi.auth.verifyOtp(otp);
      set({ isAuthenticated: true, user });
    } finally {
      set({ isLoading: false });
    }
  },
  verifyResetOtp: async (otp) => {
    set({ isLoading: true });
    try {
      await mockApi.auth.verifyResetOtp(otp);
    } finally {
      set({ isLoading: false });
    }
  },
  resetPassword: async (password) => {
    set({ isLoading: true });
    try {
      const email = useAuthStore.getState().pendingEmail;
      await mockApi.auth.resetPassword(email, password);
    } finally {
      set({ isLoading: false });
    }
  },
  sendChangePasswordOtp: async () => {
    set({ isLoading: true });
    try {
      const { sentTo } = await mockApi.auth.sendChangePasswordOtp();
      return sentTo;
    } finally {
      set({ isLoading: false });
    }
  },
  changePasswordWithOtp: async (otp, password) => {
    set({ isLoading: true });
    try {
      await mockApi.auth.changePasswordWithOtp(otp, password);
    } finally {
      set({ isLoading: false });
    }
  },
  logout: async () => {
    await mockApi.auth.logout();
    set({ isAuthenticated: false, user: null, pendingEmail: '' });
  },
  updateAvatar: async (uri) => {
    const updated = await mockApi.user.updateAvatar(uri);
    set({ user: updated });
  },
  updateName: async (name) => {
    const updated = await mockApi.user.updateName(name);
    set({ user: updated });
  },
  setUser: (user) => set({ user }),
  setPendingEmail: (email) => set({ pendingEmail: email }),
}));
