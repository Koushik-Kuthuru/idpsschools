export interface FacultyClass {
  id: string;
  name: string;
  subject: string;
  studentCount: number;
  period: string;
  attendanceStatus: 'pending' | 'completed';
  avgAttendance?: number;
}

export interface MarksExamSession {
  id: string;
  classId: string;
  className: string;
  subject: string;
  examName: string;
  maxMarks: number;
  status: 'pending' | 'completed';
  enteredCount?: number;
  totalStudents: number;
}

export interface AttendanceHistoryRecord {
  id: string;
  date: string;
  className: string;
  present: number;
  total: number;
  synced: boolean;
}

export interface SubmittedAttendanceStudent {
  id: string;
  name: string;
  rollNo: string;
  className: string;
  status: 'present' | 'absent' | 'late';
}

export interface SubmittedClassAttendance {
  classId: string;
  className: string;
  subject: string;
  submittedAt: string;
  students: SubmittedAttendanceStudent[];
}

export interface MarksHistoryRecord {
  id: string;
  date: string;
  className: string;
  examName: string;
  entered: number;
  total: number;
  average: number;
  synced: boolean;
}

export type LeaveType = 'casual' | 'sick' | 'annual' | 'special' | 'compensatory';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  type: LeaveType;
  fromDate: string;
  toDate: string;
  reason: string;
  description?: string;
  status: LeaveStatus;
  appliedOn: string;
}

export interface LeaveBalanceItem {
  type: LeaveType;
  label: string;
  total: number;
  used: number;
  remaining: number;
}

export interface SalarySummary {
  month: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: 'processing' | 'credited';
  expectedDate?: string;
  creditedDate?: string;
}

export interface SyncQueueItem {
  id: string;
  type: 'attendance' | 'marks' | 'leave';
  title: string;
  subtitle: string;
  status: 'ready' | 'syncing' | 'failed';
  timestamp: string;
}

export interface SyncHistoryItem {
  id: string;
  timestamp: string;
  message: string;
  success: boolean;
}

export interface ExamDuty {
  id: string;
  date: string;
  role: 'invigilator' | 'evaluator';
  subject: string;
  time: string;
  room: string;
  classes: string;
  status: 'active' | 'pending';
}

export interface TeachingPerformance {
  classesHandled: number;
  totalStudents: number;
  attendanceMarkRate: number;
  examsEvaluated: number;
  homeworkAssigned: number;
  submissionRate: number;
  feedbackRating: number;
  feedbackCount: number;
  classAttendanceRate: number;
}
