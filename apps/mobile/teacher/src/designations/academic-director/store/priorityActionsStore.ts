import { create } from 'zustand';
import { initialPriorityActions, type PriorityAction, type PriorityActionKind } from '../data/mockData';

interface PriorityActionsState {
  items: PriorityAction[];
  pendingExamUploadId: string | null;
  complete: (id: string) => void;
  completeByKind: (kind: PriorityActionKind) => void;
  completeByExamId: (examId: string) => void;
  queueExamUpload: (examId: string) => void;
  clearPendingExamUpload: () => void;
}

export const usePriorityActionsStore = create<PriorityActionsState>((set) => ({
  items: initialPriorityActions,
  pendingExamUploadId: null,
  complete: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),
  completeByKind: (kind) =>
    set((state) => ({
      items: state.items.filter((item) => item.kind !== kind),
    })),
  completeByExamId: (examId) =>
    set((state) => ({
      items: state.items.filter((item) => item.examId !== examId),
      pendingExamUploadId: state.pendingExamUploadId === examId ? null : state.pendingExamUploadId,
    })),
  queueExamUpload: (examId) => set({ pendingExamUploadId: examId }),
  clearPendingExamUpload: () => set({ pendingExamUploadId: null }),
}));
