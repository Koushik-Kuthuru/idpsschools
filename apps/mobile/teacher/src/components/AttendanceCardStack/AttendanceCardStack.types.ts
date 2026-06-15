import type { AttendanceStatus, Student } from '@/types';

export type StackStudent = Student & {
  status: AttendanceStatus;
  profileNote?: string;
};

export interface AttendanceCardStackProps {
  students: StackStudent[];
  onMark: (studentId: string, status: AttendanceStatus) => void;
  onIndexChange?: (index: number) => void;
  onHistoryChange?: (historyLength: number) => void;
}
