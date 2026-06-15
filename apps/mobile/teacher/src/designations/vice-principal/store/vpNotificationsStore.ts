import { create } from 'zustand';
import { initialNotifications, type VpNotification } from '../data/mockData';

interface VpNotificationsState {
  items: VpNotification[];
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
}

export const useVpNotificationsStore = create<VpNotificationsState>((set) => ({
  items: initialNotifications,
  markRead: (id) =>
    set((s) => ({
      items: s.items.map((item) => (item.id === id ? { ...item, read: true } : item)),
    })),
  markAllRead: () => set((s) => ({ items: s.items.map((item) => ({ ...item, read: true })) })),
  dismiss: (id) => set((s) => ({ items: s.items.filter((item) => item.id !== id) })),
}));

export function getVpUnreadCount(items: VpNotification[]): number {
  return items.filter((i) => !i.read).length;
}
