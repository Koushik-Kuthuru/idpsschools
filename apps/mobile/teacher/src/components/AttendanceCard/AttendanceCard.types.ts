import type { AttendanceStatus } from '@/types';

export interface AttendanceCardProps {
  name: string;
  rollNo: string;
  className: string;
  avatarUrl: string;
  status: AttendanceStatus;
  onStatusChange: (status: AttendanceStatus) => void;
}
