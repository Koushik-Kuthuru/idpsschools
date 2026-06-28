export const managerAvatar =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAlcbZB1kkWqNnwNrvQWmHFg3NnySi-IMZM3MGqB_mm0HsRJhF8AcetRnLkhwiMhM8t1MIHctvVleXsROx8M1m9Gc0coiSPePEbD_mxfn9O5cfYKtiDaPCAtzXhOeO4CQ4kf-syYXAvXa3Iyy7n0rIHzWgLc2E_nNQlE-qv6brSCDW9FCctB4bKl2hh3Tia13C6Yiyo-Aqhec0NXiVA-Vv5ROA0nUdWnSr7Wo-aivDW3MqSEXxbE0bTHf2atg9YvqQbJh4WsBwDlGDa';

export const kpiCards: {
  label: string;
  value: string;
  sub: string;
  tone?: 'primary' | 'tertiary' | 'error';
  subTone?: 'primary' | 'error';
}[] = [];

export type ManagerPriorityTone = 'error' | 'tertiary' | 'primary';
export type ManagerPriorityKind = 'substitution' | 'calendar-upload' | 'timetable-clash';

export interface ManagerPriorityTask {
  id: string;
  title: string;
  tone: ManagerPriorityTone;
  kind: ManagerPriorityKind;
  actionLabel: string;
}

export const initialPriorityTasks: ManagerPriorityTask[] = [];

/** @deprecated Use initialPriorityTasks */
export const priorityTasks = initialPriorityTasks;

export type ManagerCalendarTone = 'primary' | 'tertiary' | 'error';

export interface ManagerCalendarEvent {
  id: string;
  title: string;
  hour: number;
  minute: number;
  location: string;
  tone: ManagerCalendarTone;
  dayOffset: number;
}

export const initialCalendarEvents: ManagerCalendarEvent[] = [];

/** @deprecated Use initialCalendarEvents */
export const calendarEvents = initialCalendarEvents;

export interface SubstitutionItem {
  id: string;
  grade: string;
  period: string;
  subject: string;
  teacher: string;
  urgent: boolean;
  status: 'pending' | 'assigned';
  absentTeacher?: string;
}

export const initialSubstitutions: SubstitutionItem[] = [];

/** @deprecated Use initialSubstitutions */
export const substitutions = initialSubstitutions;

export const SUBSTITUTE_CANDIDATES: string[] = [];

export const GRADE_FILTERS = ['All Classes', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4'] as const;
export const TIMETABLE_SECTIONS = ['A', 'B', 'C', 'D'] as const;

export interface TimetableSlot {
  id: string;
  label: string;
  subject: string;
  teacher: string;
  room: string;
  gradeLabel: string;
  section: string;
  isBreak?: boolean;
  sub?: boolean;
  hasConflict?: boolean;
}

export const timetableSlots: TimetableSlot[] = [];

/** @deprecated Use timetableSlots */
export const timetablePeriods = timetableSlots;

export const academicRecords: { name: string; meta: string; tag: string; date?: string; detail?: string }[] = [];

export const curriculumSubjects: {
  name: string;
  progress: number;
  chapter: string;
  status: string;
  tone: 'primary' | 'tertiary' | 'error';
}[] = [];

export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  name: string;
  dept: string;
  type: string;
  dates: string;
  doc: string;
  status: LeaveRequestStatus;
}

export type DutyAssignmentStatus = 'pending' | 'assigned' | 'completed';

export interface DutyAssignment {
  id: string;
  title: string;
  staffName: string;
  date: string;
  location: string;
  time: string;
  status: DutyAssignmentStatus;
}

export const initialLeaveRequests: LeaveRequest[] = [];

export const initialDutyAssignments: DutyAssignment[] = [];

export const DUTY_STAFF_CANDIDATES: string[] = [];

/** @deprecated Use initialLeaveRequests */
export const leaveRequests = initialLeaveRequests;

export const upcomingExams: { title: string; grades: string; dates: string; subjects?: string; status: string }[] = [];

export type ManagerCircularTab = 'Circulars' | 'Notices' | 'PTM';

export interface ManagerCircular {
  id: string;
  circularNo: string;
  title: string;
  body: string;
  date: string;
  status: string;
  tab: ManagerCircularTab;
  audience: string;
}

export const initialManagerCirculars: ManagerCircular[] = [];

/** @deprecated Use initialManagerCirculars */
export const circulars = initialManagerCirculars;

export type ManagerNotificationType = 'urgent' | 'approval' | 'academic' | 'staff' | 'system';

export interface ManagerNotificationSeed {
  id: string;
  title: string;
  body: string;
  type: ManagerNotificationType;
  time: string;
  groupLabel: string;
  actions?: [string, string];
}

export const initialManagerNotifications: ManagerNotificationSeed[] = [];

/** @deprecated Use initialManagerNotifications */
export const notifications = initialManagerNotifications;

export const staffList: { name: string; role: string; status: string; detail: string }[] = [];
