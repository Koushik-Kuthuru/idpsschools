import type { AttendanceStatus } from '@/types';

export interface SwipeAttendanceRowProps {
  name: string;
  rollNo: string;
  className: string;
  avatarUrl: string;
  status: AttendanceStatus;
  onStatusChange: (status: AttendanceStatus) => void;
}
