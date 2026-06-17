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

export const mockStaffUsers: StaffUser[] = [
  {
    id: 't1',
    name: 'Mrs. Sarah Johnson',
    role: 'Class Teacher',
    designation: 'teacher',
    className: '10-A',
    avatarUrl: stitchImages.teacherAvatar,
    email: 'sarah.teacher@idps.edu',
    employeeId: 'TCH-2019-045',
    department: 'Mathematics',
  },
  {
    id: 'p1',
    name: 'Dr. Rajesh Mehta',
    role: 'Principal',
    designation: 'principal',
    avatarUrl: stitchImages.teacherAvatar,
    email: 'principal@idps.edu',
    employeeId: 'PRN-2012-001',
    department: 'Administration',
  },
  {
    id: 'vp1',
    name: 'Dr. Priya Sharma',
    role: 'Vice Principal',
    designation: 'vice_principal',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD9hyUsuAOsKKayQJ0CxkImKhT4h-SoAg0CLxnUFYh_igzrLkPUG_QXvpkeIZidpH5eTckl83K4fCBzI30gEpRsfl2CxvKo0pxPm227V9LAcSMyeLX7mCeON8ldqeuFr-a5vJ7SzmR2mBZ7mcJXDbC-btUtvPWHlO3EJixyxQX8-Y9c3k_GmSos_wR5fpT2aiUdTLv9iXMMkod1vfu2VE18IDAXdtKzQ8SjH8p_RdVkKsli5uYhJRTRcMkfzjaclf2MaX9oAa6GIHxB',
    email: 'vice.principal@idps.edu',
    employeeId: 'VPR-2016-003',
    department: 'Administration',
  },
  {
    id: 'c1',
    name: 'Mr. Vikram Singh',
    role: 'Academic Coordinator',
    designation: 'coordinator',
    className: '9–12',
    avatarUrl: stitchImages.teacherAvatar,
    email: 'coordinator@idps.edu',
    employeeId: 'ACD-2018-012',
    department: 'Academics',
  },
  {
    id: 'a1',
    name: 'Mr. Arun Kumar',
    role: 'Administrator',
    designation: 'admin',
    avatarUrl: stitchImages.teacherAvatar,
    email: 'admin@idps.edu',
    employeeId: 'ADM-2020-007',
    department: 'Office Administration',
  },
  {
    id: 'm1',
    name: 'Ms. Priya Nair',
    role: 'Operations Manager',
    designation: 'manager',
    avatarUrl: stitchImages.teacherAvatar,
    email: 'manager@idps.edu',
    employeeId: 'MGR-2019-004',
    department: 'Operations',
  },
  {
    id: 'ad1',
    name: 'Dr. Ananya Desai',
    role: 'Academic Director',
    designation: 'academic_director',
    avatarUrl: stitchImages.teacherAvatar,
    email: 'academic.director@idps.edu',
    employeeId: 'ACD-2015-002',
    department: 'Academic Office',
  },
  {
    id: 'am1',
    name: 'Aarav Mehta',
    role: 'Academic Administration Manager',
    designation: 'academic_manager',
    avatarUrl: stitchImages.teacherAvatar,
    email: 'academic.manager@idps.edu',
    employeeId: 'AAM-2017-006',
    department: 'Academic Administration',
  },
];

/** @deprecated Use mockStaffUsers */
export const mockTeacher: StaffUser = mockStaffUsers[0];

export interface MockUserAccount {
  email: string;
  password: string;
  userId: string;
}

export const MOCK_USER_ACCOUNTS: MockUserAccount[] = [
  { email: 'sarah.teacher@idps.edu', password: 'password', userId: 't1' },
  { email: 'principal@idps.edu', password: 'password', userId: 'p1' },
  { email: 'vice.principal@idps.edu', password: 'password', userId: 'vp1' },
  { email: 'coordinator@idps.edu', password: 'password', userId: 'c1' },
  { email: 'admin@idps.edu', password: 'password', userId: 'a1' },
  { email: 'manager@idps.edu', password: 'password', userId: 'm1' },
  { email: 'academic.director@idps.edu', password: 'password', userId: 'ad1' },
  { email: 'academic.manager@idps.edu', password: 'password', userId: 'am1' },
];

/** @deprecated Use MOCK_USER_ACCOUNTS */
export const MOCK_TEACHER_CREDENTIALS = {
  email: MOCK_USER_ACCOUNTS[0].email,
  password: MOCK_USER_ACCOUNTS[0].password,
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

export const mockStudents: Student[] = [
  {
    id: 's1',
    name: 'Aarav Sharma',
    rollNo: '01',
    className: '10-A',
    avatarUrl: stitchImages.studentDefault,
    attendancePercent: 92,
    profileNote: 'Consistently punctual and helpful.',
  },
  {
    id: 's2',
    name: 'Alex Johnson',
    rollNo: '02',
    className: '10-A',
    avatarUrl: stitchImages.studentDefault,
    attendancePercent: 88,
    parentName: 'Mrs. Priyanka',
    parentPhone: '+91 98765 43210',
    profileNote: 'Shows great interest in historical events.',
  },
  {
    id: 's3',
    name: 'Priya Patel',
    rollNo: '03',
    className: '10-A',
    avatarUrl: stitchImages.studentDefault,
    attendancePercent: 95,
    profileNote: 'Exceptional in Mathematics and debate.',
  },
  {
    id: 's4',
    name: 'Rohan Mehta',
    rollNo: '04',
    className: '10-A',
    avatarUrl: stitchImages.studentDefault,
    attendancePercent: 78,
    profileNote: 'Passionate about sports and physical education.',
  },
  {
    id: 's5',
    name: 'Sneha Reddy',
    rollNo: '05',
    className: '10-A',
    avatarUrl: stitchImages.studentDefault,
    attendancePercent: 91,
    profileNote: 'Often leads group projects in science.',
  },
];

export const mockAssignments: Assignment[] = [
  { id: 'a1', title: 'Algebra Worksheet Ch.5', subject: 'Mathematics', className: '10-A', dueDate: 'Jun 10, 2026', status: 'published', submissionsCount: 28, totalStudents: 42 },
  { id: 'a2', title: 'Science Lab Report', subject: 'Science', className: '10-A', dueDate: 'Jun 12, 2026', status: 'published', submissionsCount: 15, totalStudents: 42 },
  { id: 'a3', title: 'English Essay Draft', subject: 'English', className: '10-A', dueDate: 'Jun 15, 2026', status: 'draft', submissionsCount: 0, totalStudents: 42 },
];

export const mockAnnouncements: Announcement[] = [
  { id: 'an1', title: 'PTA Meeting scheduled for next Friday in the Seminar Hall.', category: 'academic', timestamp: 'Today, 08:30 AM', borderColor: 'primary' },
  { id: 'an2', title: 'Submit term-end reports by EOD tomorrow. No extensions.', category: 'urgent', timestamp: 'Yesterday', borderColor: 'error' },
];

export const mockMessages: MessageThread[] = [
  { id: 'c1', name: 'Mrs. Priyanka', role: 'Parent · Alex Johnson', lastMessage: 'Thank you for the update on marks.', timestamp: '10:24 AM', avatarUrl: stitchImages.studentDefault, unread: 2 },
  { id: 'c2', name: 'Mr. Sharma', role: 'Parent · Aarav Sharma', lastMessage: 'Will Alex be present tomorrow?', timestamp: 'Yesterday', avatarUrl: stitchImages.studentDefault, unread: 0 },
];

export const mockNotifications: NotificationItem[] = [
  { id: 'n1', title: 'PTA Meeting Reminder', body: 'Scheduled for next Friday in Seminar Hall.', type: 'academic', timestamp: 'Today, 08:30 AM', read: false },
  { id: 'n2', title: 'Term-end Reports Due', body: 'Submit by EOD tomorrow. No extensions.', type: 'urgent', timestamp: 'Yesterday', read: false },
  { id: 'n3', title: '3 Students Absent', body: 'Class 10-A attendance marked for today.', type: 'system', timestamp: 'Today, 09:00 AM', read: true },
];

export function getUnreadNotificationCount(): number {
  return mockNotifications.filter((n) => !n.read).length;
}

export const mockExams: ExamItem[] = [
  { id: 'e1', subject: 'Mathematics', date: 'Jun 15, 2026', time: '09:00 AM', room: 'Hall A', status: 'upcoming', syllabusPercent: 75 },
  { id: 'e2', subject: 'Science', date: 'Jun 18, 2026', time: '09:00 AM', room: 'Lab 2', status: 'upcoming', syllabusPercent: 60 },
];

export const mockTimetable: TimetablePeriod[] = [
  { id: 'p1', subject: 'Mathematics', time: '09:00 - 09:45', room: 'Room 102', accentColor: '#0fbd83' },
  { id: 'p2', subject: 'English', time: '09:50 - 10:35', room: 'Room 105', accentColor: '#3b82f6' },
  { id: 'break', subject: 'Break', time: '10:35 - 10:50', room: '', accentColor: '#64748b', isBreak: true },
  { id: 'p3', subject: 'Science', time: '10:50 - 11:35', room: 'Lab 1', accentColor: '#a855f7' },
  { id: 'p4', subject: 'History', time: '11:40 - 12:25', room: 'Room 108', accentColor: '#f97316' },
];

export const mockFacultyClasses: FacultyClass[] = [
  { id: '10a', name: 'CLASS 10-A', subject: 'Mathematics', studentCount: 45, period: '9:00-10:00', attendanceStatus: 'pending', avgAttendance: 92 },
  { id: '10b', name: 'CLASS 10-B', subject: 'Mathematics', studentCount: 42, period: '10:30-11:30', attendanceStatus: 'pending', avgAttendance: 90 },
  { id: '9a', name: 'CLASS 9-A', subject: 'Mathematics', studentCount: 48, period: '11:30-12:30', attendanceStatus: 'completed', avgAttendance: 94 },
];

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

export const submittedClassAttendance: Record<string, SubmittedClassAttendance> = {
  '9a': {
    classId: '9a',
    className: '9-A',
    subject: 'Mathematics',
    submittedAt: 'Today',
    students: mockStudents.map((s, i) => ({
      id: s.id,
      name: s.name,
      rollNo: s.rollNo,
      className: s.className,
      status: i === 2 ? 'absent' : i === 3 ? 'late' : 'present',
    })),
  },
};

export function saveSubmittedClassAttendance(record: SubmittedClassAttendance): void {
  submittedClassAttendance[record.classId] = record;
}

export function getSubmittedClassAttendance(classId: string): SubmittedClassAttendance | undefined {
  return submittedClassAttendance[classId];
}

export const mockMarksExams: MarksExamSession[] = [
  { id: 'me1', classId: '10a', className: '10-A', subject: 'Mathematics', examName: 'Final Exam', maxMarks: 100, status: 'pending', totalStudents: 45 },
  { id: 'me2', classId: '10a', className: '10-A', subject: 'English', examName: 'Final Exam', maxMarks: 100, status: 'pending', totalStudents: 45 },
  { id: 'me3', classId: '10b', className: '10-B', subject: 'Mathematics', examName: 'Final Exam', maxMarks: 100, status: 'completed', enteredCount: 42, totalStudents: 42 },
];

export const mockAttendanceHistory: AttendanceHistoryRecord[] = [
  { id: 'ah1', date: 'Today', className: '10-A', present: 43, total: 45, synced: true },
  { id: 'ah2', date: 'Yesterday', className: '10-B', present: 40, total: 42, synced: true },
  { id: 'ah3', date: 'Jan 13', className: '9-A', present: 45, total: 48, synced: true },
];

export const mockMarksHistory: MarksHistoryRecord[] = [
  { id: 'mh1', date: 'Jan 15', className: '10-A', examName: 'Mathematics · Final', entered: 45, total: 45, average: 82.5, synced: true },
  { id: 'mh2', date: 'Jan 10', className: '10-B', examName: 'Mathematics · Final', entered: 42, total: 42, average: 79.3, synced: true },
];

export const mockLeaveRequests: LeaveRequest[] = [
  { id: 'l1', type: 'casual', fromDate: 'Jan 20, 2026', toDate: 'Jan 20, 2026', reason: 'Personal', status: 'pending', appliedOn: 'Jan 10' },
  { id: 'l2', type: 'sick', fromDate: 'Jan 18, 2026', toDate: 'Jan 19, 2026', reason: 'Migraine', status: 'pending', appliedOn: 'Jan 15' },
  { id: 'l3', type: 'annual', fromDate: 'Jan 1, 2026', toDate: 'Jan 5, 2026', reason: 'Vacation', status: 'approved', appliedOn: 'Dec 20, 2025' },
];

export const mockLeaveBalance: LeaveBalanceItem[] = [
  { type: 'casual', label: 'Casual Leave', total: 5, used: 2, remaining: 3 },
  { type: 'sick', label: 'Sick Leave', total: 10, used: 1, remaining: 9 },
  { type: 'annual', label: 'Annual Leave', total: 20, used: 8, remaining: 12 },
  { type: 'compensatory', label: 'Compensatory Leave', total: 2, used: 0, remaining: 2 },
];

export const mockSalarySummary: SalarySummary = {
  month: 'January 2026',
  baseSalary: 5000,
  allowances: 800,
  deductions: 750,
  netSalary: 5050,
  status: 'processing',
  expectedDate: 'Jan 31, 2026',
};

export const mockSalaryHistory: SalarySummary[] = [
  mockSalarySummary,
  { month: 'December 2025', baseSalary: 5000, allowances: 800, deductions: 750, netSalary: 5050, status: 'credited', creditedDate: 'Dec 31, 2025' },
  { month: 'November 2025', baseSalary: 5000, allowances: 500, deductions: 500, netSalary: 5000, status: 'credited', creditedDate: 'Nov 30, 2025' },
];

export const mockSyncQueue: SyncQueueItem[] = [
  { id: 'sq1', type: 'attendance', title: 'ATTENDANCE', subtitle: 'Class 10-A · 45 students', status: 'ready', timestamp: 'Jan 15, 9:00 AM' },
  { id: 'sq2', type: 'marks', title: 'MARKS ENTRY', subtitle: 'Class 10-B Math · 42 marks', status: 'ready', timestamp: 'Jan 14, 2:45 PM' },
  { id: 'sq3', type: 'leave', title: 'LEAVE REQUEST', subtitle: 'Casual · Jan 20', status: 'ready', timestamp: 'Jan 10' },
];

export const mockSyncHistory: SyncHistoryItem[] = [
  { id: 'sh1', timestamp: 'Jan 15, 10:15 AM', message: 'Attendance synced (Class 9-A)', success: true },
  { id: 'sh2', timestamp: 'Jan 14, 3:30 PM', message: 'Marks synced (10-A Math)', success: true },
  { id: 'sh3', timestamp: 'Jan 13, 5:00 PM', message: 'Sync failed — retry available', success: false },
];

export const mockExamDuties: ExamDuty[] = [
  { id: 'ed1', date: 'Jan 27 (Monday)', role: 'invigilator', subject: 'Mathematics', time: '9:00 - 12:00 PM', room: '101', classes: '10-A, 10-B', status: 'active' },
  { id: 'ed2', date: 'Jan 29 (Wednesday)', role: 'evaluator', subject: 'English Exam', time: 'Paper collection', room: 'Office', classes: '10-A', status: 'active' },
  { id: 'ed3', date: 'Feb 5 (Wednesday)', role: 'invigilator', subject: 'Mathematics (H.S.)', time: '2:00 - 4:30 PM', room: '103', classes: '11-A, 11-B', status: 'pending' },
];

export const mockTeachingPerformance: TeachingPerformance = {
  classesHandled: 3,
  totalStudents: 135,
  attendanceMarkRate: 95,
  examsEvaluated: 3,
  homeworkAssigned: 15,
  submissionRate: 82,
  feedbackRating: 4.2,
  feedbackCount: 45,
  classAttendanceRate: 92,
};

export const monthlyAttendance = [
  { month: 'September', present: 22, absent: 2, total: 24 },
  { month: 'October', present: 19, absent: 1, total: 20 },
  { month: 'November', present: 15, absent: 4, total: 19 },
];
