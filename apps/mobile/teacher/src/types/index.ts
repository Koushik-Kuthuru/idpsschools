export * from './navigation';
export * from './faculty';

export type AttendanceStatus = 'present' | 'absent' | 'late';

/** System role — determines app access and navigation */
export type StaffRole =
  | 'teacher'
  | 'principal'
  | 'vice_principal'
  | 'coordinator'
  | 'admin'
  | 'manager'
  | 'academic_director'
  | 'academic_manager';

export interface StaffUser {
  id: string;
  name: string;
  /** Display designation, e.g. "Class Teacher", "Principal" */
  role: string;
  designation: StaffRole;
  className?: string;
  avatarUrl: string;
  email: string;
  employeeId?: string;
  department?: string;
}

/** @deprecated Use StaffUser — kept for gradual migration */
export type Teacher = StaffUser;

export interface Student {
  id: string;
  name: string;
  rollNo: string;
  className: string;
  avatarUrl: string;
  attendancePercent: number;
  profileNote?: string;
  parentName?: string;
  parentPhone?: string;
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  className: string;
  dueDate: string;
  status: 'draft' | 'published' | 'closed';
  submissionsCount: number;
  totalStudents: number;
}

export interface Announcement {
  id: string;
  title: string;
  category: 'academic' | 'urgent' | 'general';
  timestamp: string;
  borderColor: 'primary' | 'error';
}

export interface MessageThread {
  id: string;
  name: string;
  role: string;
  lastMessage: string;
  timestamp: string;
  avatarUrl: string;
  unread: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: 'academic' | 'urgent' | 'system';
  timestamp: string;
  read: boolean;
}

export interface ExamItem {
  id: string;
  subject: string;
  date: string;
  time: string;
  room: string;
  status: 'upcoming' | 'past';
  syllabusPercent?: number;
}

export interface TimetablePeriod {
  id: string;
  subject: string;
  time: string;
  room: string;
  accentColor: string;
  isBreak?: boolean;
}
