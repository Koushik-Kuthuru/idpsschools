import { create } from 'zustand';
import { initialPriorityTasks, type ManagerPriorityTask } from '../data/mockData';

interface PriorityTasksState {
  items: ManagerPriorityTask[];
  complete: (id: string) => void;
}

export const useManagerPriorityTasksStore = create<PriorityTasksState>((set) => ({
  items: initialPriorityTasks,
  complete: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),
}));
