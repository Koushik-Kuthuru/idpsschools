import { create } from 'zustand';
import { mockApi } from '@/services/api';
import type { AttendanceStatus, Student } from '@/types';

interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
}

interface AttendanceState {
  records: AttendanceRecord[];
  students: (Student & { status: AttendanceStatus })[];
  isLoading: boolean;
  loadSession: () => Promise<void>;
  setStatus: (studentId: string, status: AttendanceStatus) => void;
  markAllPresent: () => void;
  resetAll: () => void;
  submit: (classId?: string) => Promise<void>;
  getSummary: () => { present: number; absent: number; late: number; total: number };
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  records: [],
  students: [],
  isLoading: false,
  loadSession: async () => {
    set({ isLoading: true });
    try {
      const data = await mockApi.attendance.getSession();
      set({
        students: data,
        records: data.map((s) => ({ studentId: s.id, status: s.status })),
      });
    } finally {
      set({ isLoading: false });
    }
  },
  setStatus: (studentId, status) => {
    set((state) => ({
      students: state.students.map((s) => (s.id === studentId ? { ...s, status } : s)),
      records: state.records.map((r) => (r.studentId === studentId ? { ...r, status } : r)),
    }));
  },
  markAllPresent: () => {
    set((state) => ({
      students: state.students.map((s) => ({ ...s, status: 'present' as AttendanceStatus })),
      records: state.records.map((r) => ({ ...r, status: 'present' as AttendanceStatus })),
    }));
  },
  resetAll: () => {
    set((state) => ({
      students: state.students.map((s) => ({ ...s, status: 'present' as AttendanceStatus })),
      records: state.records.map((r) => ({ ...r, status: 'present' as AttendanceStatus })),
    }));
  },
  submit: async (classId) => {
    const { records } = get();
    await mockApi.attendance.submit(records, classId);
  },
  getSummary: () => {
    const { students } = get();
    const present = students.filter((s) => s.status === 'present').length;
    const absent = students.filter((s) => s.status === 'absent').length;
    const late = students.filter((s) => s.status === 'late').length;
    return { present, absent, late, total: students.length };
  },
}));
