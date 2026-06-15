import { create } from 'zustand';
import { notificationGroups } from '../data/mockData';

export type NotificationCategory = 'results' | 'teacher' | 'curriculum' | 'exam' | 'approvals';

export interface AcademicNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  type: 'urgent' | 'reminder' | 'info';
  read: boolean;
  groupLabel: string;
  category?: NotificationCategory;
  actions?: [string, string];
}

function buildInitialItems(): AcademicNotification[] {
  return notificationGroups.flatMap((group) =>
    group.items.map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      time: item.time,
      type: item.type,
      read: false,
      groupLabel: group.label,
      category: 'category' in item ? item.category : undefined,
      actions: 'actions' in item ? item.actions : undefined,
    })),
  );
}

interface NotificationsState {
  items: AcademicNotification[];
  markAllRead: () => void;
  markRead: (id: string) => void;
  dismiss: (id: string) => void;
}

export const useAcademicNotificationsStore = create<NotificationsState>((set) => ({
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

export function getAcademicUnreadCount(items: AcademicNotification[]): number {
  return items.filter((item) => !item.read).length;
}
