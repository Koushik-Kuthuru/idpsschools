import { create } from 'zustand';
import { initialPrincipalNotifications, type PrincipalNotificationType } from '../data/mockData';

export type PrincipalNotificationFilter = 'all' | PrincipalNotificationType;

export interface PrincipalNotification {
  id: string;
  title: string;
  body: string;
  type: PrincipalNotificationType;
  time: string;
  groupLabel: string;
  read: boolean;
  actions?: [string, string];
}

function buildInitialItems(): PrincipalNotification[] {
  return initialPrincipalNotifications.map((item) => ({ ...item, read: false }));
}

interface PrincipalNotificationsState {
  items: PrincipalNotification[];
  markAllRead: () => void;
  markRead: (id: string) => void;
  dismiss: (id: string) => void;
}

export const usePrincipalNotificationsStore = create<PrincipalNotificationsState>((set) => ({
  items: buildInitialItems(),
  markAllRead: () =>
    set((state) => ({
      items: state.items.map((item) => ({ ...item, read: true })),
    })),
  markRead: (id) =>
    set((state) => ({
      items: state.items.map((item) => (item.id === id ? { ...item, read: true } : item)),
    })),
  dismiss: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),
}));

export function getPrincipalUnreadCount(items: PrincipalNotification[]): number {
  return items.filter((item) => !item.read).length;
}

export function filterPrincipalNotifications(
  items: PrincipalNotification[],
  filter: PrincipalNotificationFilter,
): PrincipalNotification[] {
  if (filter === 'all') return items;
  if (filter === 'approval') return items.filter((item) => item.type === 'approval');
  return items.filter((item) => item.type === filter);
}
