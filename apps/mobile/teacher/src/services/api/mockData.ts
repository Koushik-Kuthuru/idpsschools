import { stitchImages } from '@/assets/images';
import type {
  Announcement,
  Assignment,
  AttendanceHistoryRecord,
  ExamDuty,
  ExamItem,
  FacultyClass,
  LeaveBalanceItem,
  LeaveRequest,
  MarksExamSession,
  MarksHistoryRecord,
  MessageThread,
  NotificationItem,
  SalarySummary,
  Student,
  SubmittedClassAttendance,
  SyncHistoryItem,
  SyncQueueItem,
  StaffUser,
  TeachingPerformance,
  TimetablePeriod,
} from '@/types';

export const mockStaffUsers: StaffUser[] = [];

const EMPTY_TEACHER: StaffUser = {
  id: '',
  name: '',
  role: '',
  designation: 'teacher',
  avatarUrl: stitchImages.teacherAvatar,
  email: '',
  employeeId: '',
  department: '',
};

/** @deprecated Use mockStaffUsers */
export const mockTeacher: StaffUser = EMPTY_TEACHER;

export interface MockUserAccount {
  email: string;
  password: string;
  userId: string;
}

export const MOCK_USER_ACCOUNTS: MockUserAccount[] = [];

/** @deprecated Use MOCK_USER_ACCOUNTS */
export const MOCK_TEACHER_CREDENTIALS = {
  email: '',
  password: '',
} as const;

export function getMockUserByEmail(email: string): StaffUser | undefined {
  const normalized = email.trim().toLowerCase();
  const account = MOCK_USER_ACCOUNTS.find((a) => a.email.toLowerCase() === normalized);
  if (!account) return undefined;
  return mockStaffUsers.find((u) => u.id === account.userId);
}

export function getMockAccountByEmail(email: string): MockUserAccount | undefined {
  const normalized = email.trim().toLowerCase();
  return MOCK_USER_ACCOUNTS.find((a) => a.email.toLowerCase() === normalized);
}

export const mockStudents: Student[] = [];

export const mockAssignments: Assignment[] = [];

export const mockAnnouncements: Announcement[] = [];

export const mockMessages: MessageThread[] = [];

export const mockNotifications: NotificationItem[] = [];

export function getUnreadNotificationCount(): number {
  return mockNotifications.filter((n) => !n.read).length;
}

export const mockExams: ExamItem[] = [];

export const mockTimetable: TimetablePeriod[] = [];

export const mockFacultyClasses: FacultyClass[] = [];

export function getPendingAttendanceClassCount(): number {
  return mockFacultyClasses.filter((c) => c.attendanceStatus === 'pending').length;
}

export function getPendingMarksExamCount(): number {
  return mockMarksExams.filter((e) => e.status === 'pending').length;
}

export function markClassAttendanceComplete(classId: string): FacultyClass | undefined {
  const cls = mockFacultyClasses.find((c) => c.id === classId);
  if (cls) cls.attendanceStatus = 'completed';
  return cls;
}

export const submittedClassAttendance: Record<string, SubmittedClassAttendance> = {};

export function saveSubmittedClassAttendance(record: SubmittedClassAttendance): void {
  submittedClassAttendance[record.classId] = record;
}

export function getSubmittedClassAttendance(classId: string): SubmittedClassAttendance | undefined {
  return submittedClassAttendance[classId];
}

export const mockMarksExams: MarksExamSession[] = [];

export const mockAttendanceHistory: AttendanceHistoryRecord[] = [];

export const mockMarksHistory: MarksHistoryRecord[] = [];

export const mockLeaveRequests: LeaveRequest[] = [];

export const mockLeaveBalance: LeaveBalanceItem[] = [];

export const mockSalarySummary: SalarySummary = {
  month: '',
  baseSalary: 0,
  allowances: 0,
  deductions: 0,
  netSalary: 0,
  status: 'processing',
};

export const mockSalaryHistory: SalarySummary[] = [];

export const mockSyncQueue: SyncQueueItem[] = [];

export const mockSyncHistory: SyncHistoryItem[] = [];

export const mockExamDuties: ExamDuty[] = [];

export const mockTeachingPerformance: TeachingPerformance = {
  classesHandled: 0,
  totalStudents: 0,
  attendanceMarkRate: 0,
  examsEvaluated: 0,
  homeworkAssigned: 0,
  submissionRate: 0,
  feedbackRating: 0,
  feedbackCount: 0,
  classAttendanceRate: 0,
};

export const monthlyAttendance: { month: string; present: number; absent: number; total: number }[] = [];
