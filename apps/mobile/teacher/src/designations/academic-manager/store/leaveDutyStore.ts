import { create } from 'zustand';
import {
  DUTY_STAFF_CANDIDATES,
  initialDutyAssignments,
  initialLeaveRequests,
  type DutyAssignment,
  type LeaveRequest,
} from '../data/mockData';

export { DUTY_STAFF_CANDIDATES };

interface LeaveDutyState {
  leaveRequests: LeaveRequest[];
  dutyAssignments: DutyAssignment[];
  approveLeave: (id: string) => void;
  rejectLeave: (id: string) => void;
  assignDuty: (id: string, staffName: string) => void;
  completeDuty: (id: string) => void;
  addLeaveRequest: (input: Omit<LeaveRequest, 'id' | 'status'>) => void;
  addDutyAssignment: (input: Omit<DutyAssignment, 'id' | 'status' | 'staffName'> & { staffName?: string }) => void;
}

export const useLeaveDutyStore = create<LeaveDutyState>((set) => ({
  leaveRequests: initialLeaveRequests,
  dutyAssignments: initialDutyAssignments,

  approveLeave: (id) =>
    set((s) => ({
      leaveRequests: s.leaveRequests.map((r) => (r.id === id ? { ...r, status: 'approved' as const } : r)),
    })),

  rejectLeave: (id) =>
    set((s) => ({
      leaveRequests: s.leaveRequests.map((r) => (r.id === id ? { ...r, status: 'rejected' as const } : r)),
    })),

  assignDuty: (id, staffName) =>
    set((s) => ({
      dutyAssignments: s.dutyAssignments.map((d) =>
        d.id === id ? { ...d, staffName, status: 'assigned' as const } : d,
      ),
    })),

  completeDuty: (id) =>
    set((s) => ({
      dutyAssignments: s.dutyAssignments.map((d) => (d.id === id ? { ...d, status: 'completed' as const } : d)),
    })),

  addLeaveRequest: (input) =>
    set((s) => ({
      leaveRequests: [
        { ...input, id: `lr-${Date.now()}`, status: 'pending' },
        ...s.leaveRequests,
      ],
    })),

  addDutyAssignment: (input) =>
    set((s) => ({
      dutyAssignments: [
        {
          id: `da-${Date.now()}`,
          title: input.title,
          date: input.date,
          location: input.location,
          time: input.time,
          staffName: input.staffName ?? 'Unassigned',
          status: input.staffName ? 'assigned' : 'pending',
        },
        ...s.dutyAssignments,
      ],
    })),
}));
