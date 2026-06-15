import type { AttendanceStatus } from '@/types';

export interface AttendanceProfileCardProps {
  name: string;
  rollNo: string;
  className: string;
  avatarUrl: string;
  attendancePercent: number;
  profileNote?: string;
  status?: AttendanceStatus;
}
