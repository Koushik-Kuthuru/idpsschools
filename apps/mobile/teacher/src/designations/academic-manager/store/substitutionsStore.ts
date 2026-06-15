import { create } from 'zustand';
import { initialSubstitutions, type SubstitutionItem } from '../data/mockData';

interface SubstitutionsState {
  items: SubstitutionItem[];
  assign: (id: string, teacher: string) => void;
  markFreePeriod: (id: string) => void;
}

export const useSubstitutionsStore = create<SubstitutionsState>((set) => ({
  items: initialSubstitutions,
  assign: (id, teacher) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id
          ? { ...item, teacher, status: 'assigned' as const, urgent: false }
          : item,
      ),
    })),
  markFreePeriod: (id) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, teacher: 'Free Period', status: 'assigned' as const, urgent: false } : item,
      ),
    })),
}));

export function getPendingSubstitutionCount(items: SubstitutionItem[]): number {
  return items.filter((item) => item.status === 'pending').length;
}

export function getUrgentSubstitutionCount(items: SubstitutionItem[]): number {
  return items.filter((item) => item.urgent && item.status === 'pending').length;
}
