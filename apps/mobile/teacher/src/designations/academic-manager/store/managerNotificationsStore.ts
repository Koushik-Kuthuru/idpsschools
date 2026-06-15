import { create } from 'zustand';
import { initialManagerNotifications, type ManagerNotificationType } from '../data/mockData';

export type ManagerNotificationFilter = 'all' | ManagerNotificationType;

export interface ManagerNotification {
  id: string;
  title: string;
  body: string;
  type: ManagerNotificationType;
  time: string;
  groupLabel: string;
  read: boolean;
  actions?: [string, string];
}

function buildInitialItems(): ManagerNotification[] {
  return initialManagerNotifications.map((item) => ({ ...item, read: false }));
}

interface ManagerNotificationsState {
  items: ManagerNotification[];
  markAllRead: () => void;
  markRead: (id: string) => void;
  dismiss: (id: string) => void;
}

export const useManagerNotificationsStore = create<ManagerNotificationsState>((set) => ({
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

export function getManagerUnreadCount(items: ManagerNotification[]): number {
  return items.filter((item) => !item.read).length;
}

export function filterManagerNotifications(
  items: ManagerNotification[],
  filter: ManagerNotificationFilter,
): ManagerNotification[] {
  if (filter === 'all') return items;
  if (filter === 'approval') return items.filter((item) => item.type === 'approval');
  return items.filter((item) => item.type === filter);
}
