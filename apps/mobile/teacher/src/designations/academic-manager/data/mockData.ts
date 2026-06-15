export const managerAvatar =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAlcbZB1kkWqNnwNrvQWmHFg3NnySi-IMZM3MGqB_mm0HsRJhF8AcetRnLkhwiMhM8t1MIHctvVleXsROx8M1m9Gc0coiSPePEbD_mxfn9O5cfYKtiDaPCAtzXhOeO4CQ4kf-syYXAvXa3Iyy7n0rIHzWgLc2E_nNQlE-qv6brSCDW9FCctB4bKl2hh3Tia13C6Yiyo-Aqhec0NXiVA-Vv5ROA0nUdWnSr7Wo-aivDW3MqSEXxbE0bTHf2atg9YvqQbJh4WsBwDlGDa';

export const kpiCards = [
  { label: 'Timetable Filled', value: '97%', sub: '3 gaps' },
  { label: 'Events This Week', value: '3', sub: '1 upcoming', subTone: 'primary' as const },
  { label: 'Awaiting Action', value: '12', sub: '5 urgent', subTone: 'error' as const },
  { label: 'Unit Test I', value: '8 days', sub: 'On track', subTone: 'primary' as const },
];

export type ManagerPriorityTone = 'error' | 'tertiary' | 'primary';
export type ManagerPriorityKind = 'substitution' | 'calendar-upload' | 'timetable-clash';

export interface ManagerPriorityTask {
  id: string;
  title: string;
  tone: ManagerPriorityTone;
  kind: ManagerPriorityKind;
  actionLabel: string;
}

export const initialPriorityTasks: ManagerPriorityTask[] = [
  {
    id: 'pt1',
    title: 'Finalise Substitution for Grade 9B — Physics',
    tone: 'error',
    kind: 'substitution',
    actionLabel: 'Assign',
  },
  {
    id: 'pt2',
    title: 'Upload Revised Academic Calendar — Term 2',
    tone: 'tertiary',
    kind: 'calendar-upload',
    actionLabel: 'Upload',
  },
  {
    id: 'pt3',
    title: 'Review Timetable Clashes — Grade 11 Science',
    tone: 'primary',
    kind: 'timetable-clash',
    actionLabel: 'Review',
  },
];

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

export const initialCalendarEvents: ManagerCalendarEvent[] = [
  { id: 'ce1', title: 'PTM Prep Meeting', hour: 14, minute: 30, location: 'Conference Hall', tone: 'primary', dayOffset: 0 },
  { id: 'ce2', title: 'Curriculum Review — Term 2', hour: 16, minute: 0, location: 'Dept. Meeting Room', tone: 'tertiary', dayOffset: 0 },
  { id: 'ce3', title: 'Unit Test Deadline (Final Upload)', hour: 23, minute: 59, location: 'Portal Deadline', tone: 'error', dayOffset: 0 },
  { id: 'ce4', title: 'Staff Briefing — Substitutions', hour: 9, minute: 0, location: 'Admin Block', tone: 'primary', dayOffset: 1 },
  { id: 'ce5', title: 'Exam Seating Plan Review', hour: 11, minute: 30, location: 'Exam Cell', tone: 'tertiary', dayOffset: 3 },
];

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

export const initialSubstitutions: SubstitutionItem[] = [
  { id: 'sub1', grade: '9B', period: 'Period 4', subject: 'Physics', teacher: 'Ms. Priya', urgent: false, status: 'assigned', absentTeacher: 'Mr. Anil Kumar' },
  { id: 'sub2', grade: '6A', period: 'Period 3', subject: 'Hindi', teacher: 'Pending', urgent: true, status: 'pending', absentTeacher: 'Mrs. Kavitha Rao' },
  { id: 'sub3', grade: '11 Sci', period: 'Period 6', subject: 'Chemistry', teacher: 'Free Period', urgent: false, status: 'pending' },
];

/** @deprecated Use initialSubstitutions */
export const substitutions = initialSubstitutions;

export const SUBSTITUTE_CANDIDATES = ['Mrs. Leela M.', 'Ms. Sneha V.', 'Mr. Suresh P.', 'Mrs. Priya Sharma'];

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

export const timetableSlots: TimetableSlot[] = [
  { id: 'g1a-p1', label: 'P1 · 08:00–08:45', subject: 'English', teacher: 'Mrs. Priya S.', room: 'Room 101', gradeLabel: 'Grade 1', section: 'A' },
  { id: 'g1a-p2', label: 'P2 · 08:50–09:35', subject: 'Mathematics', teacher: 'Mr. Ramesh K.', room: 'Room 101', gradeLabel: 'Grade 1', section: 'A' },
  { id: 'g1a-br', label: 'Break · 10:00–10:20', subject: 'Break', teacher: '', room: '', gradeLabel: 'Grade 1', section: 'A', isBreak: true },
  { id: 'g1b-p1', label: 'P1 · 08:00–08:45', subject: 'Hindi', teacher: 'Mrs. Kavitha R.', room: 'Room 102', gradeLabel: 'Grade 1', section: 'B' },
  { id: 'g1b-p2', label: 'P2 · 08:50–09:35', subject: 'EVS', teacher: 'Ms. Sneha V.', room: 'Room 102', gradeLabel: 'Grade 1', section: 'B' },
  { id: 'g2a-p1', label: 'P1 · 08:00–08:45', subject: 'Mathematics', teacher: 'Mr. Ramesh K.', room: 'Room 204', gradeLabel: 'Grade 2', section: 'A' },
  { id: 'g2a-p4', label: 'P4 · 11:00–11:45', subject: 'Physics', teacher: 'Mrs. Priya L. (Sub)', room: 'Room 204', gradeLabel: 'Grade 2', section: 'A', sub: true },
  { id: 'g2b-p1', label: 'P1 · 08:00–08:45', subject: 'Science', teacher: 'Mr. Anil Kumar', room: 'Lab 1', gradeLabel: 'Grade 2', section: 'B', hasConflict: true },
  { id: 'g2b-p2', label: 'P2 · 08:50–09:35', subject: 'English', teacher: 'Mrs. Priya Sharma', room: 'Room 205', gradeLabel: 'Grade 2', section: 'B' },
  { id: 'g3a-p1', label: 'P1 · 08:00–08:45', subject: 'Social Studies', teacher: 'Mr. Suresh P.', room: 'Room 301', gradeLabel: 'Grade 3', section: 'A' },
  { id: 'g3a-p3', label: 'P3 · 10:25–11:10', subject: 'Science', teacher: 'Ms. Anita D.', room: 'Lab 2', gradeLabel: 'Grade 3', section: 'A' },
  { id: 'g3b-p1', label: 'P1 · 08:00–08:45', subject: 'Mathematics', teacher: 'Mr. Ramesh K.', room: 'Room 302', gradeLabel: 'Grade 3', section: 'B' },
  { id: 'g4a-p1', label: 'P1 · 08:00–08:45', subject: 'English', teacher: 'Mrs. Priya Sharma', room: 'Room 401', gradeLabel: 'Grade 4', section: 'A' },
  { id: 'g4a-p5', label: 'P5 · 11:50–12:35', subject: 'Computer', teacher: 'Mr. Dev K.', room: 'Comp Lab', gradeLabel: 'Grade 4', section: 'A' },
  { id: 'g4b-p1', label: 'P1 · 08:00–08:45', subject: 'Mathematics', teacher: 'Mr. Ramesh K.', room: 'Room 402', gradeLabel: 'Grade 4', section: 'B', hasConflict: true },
  { id: 'g4c-p2', label: 'P2 · 08:50–09:35', subject: 'Telugu', teacher: 'Mrs. Leela M.', room: 'Room 403', gradeLabel: 'Grade 4', section: 'C' },
];

/** @deprecated Use timetableSlots */
export const timetablePeriods = timetableSlots;

export const academicRecords = [
  { name: 'Arjun Kapoor', meta: 'G10-B · Roll 1023', tag: 'TC Request', date: '10 Jun' },
  { name: 'Meera Sharma', meta: 'G8→G9', tag: 'Promoted', detail: 'GPA 8.9/10' },
  { name: 'Ravi Das', meta: 'Transfer In', tag: 'Pending Docs', date: '' },
  { name: 'Sneha Nair', meta: 'G5-C', tag: 'Detained', detail: 'Parent Ack Pending' },
];

export const curriculumSubjects = [
  { name: 'Mathematics', progress: 84, chapter: 'Ch 8/10', status: 'On Track', tone: 'primary' as const },
  { name: 'English', progress: 74, chapter: 'Ch 6/10', status: 'At Risk', tone: 'tertiary' as const },
  { name: 'Science', progress: 91, chapter: 'Ch 9/10', status: 'Ahead', tone: 'primary' as const },
  { name: 'Social Studies', progress: 52, chapter: 'Ch 4/10', status: 'ACTION NEEDED', tone: 'error' as const },
];

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

export const initialLeaveRequests: LeaveRequest[] = [
  { id: 'lr1', name: 'Mrs. Kavitha Rao', dept: 'English G6-8', type: 'Medical Leave', dates: '12–13 Jun', doc: 'Medical Certificate attached', status: 'pending' },
  { id: 'lr2', name: 'Mr. Suresh P.', dept: 'Science G9', type: 'Casual Leave', dates: '11 Jun', doc: 'Substitute: Mrs. Leela M.', status: 'pending' },
  { id: 'lr3', name: 'Ms. Anita Deshmukh', dept: 'Maths Primary', type: 'Casual Leave', dates: '15 Jun', doc: '', status: 'pending' },
  { id: 'lr4', name: 'Mr. Dev Kumar', dept: 'Computer Lab', type: 'Personal Leave', dates: '8 Jun', doc: 'Approved by HOD', status: 'approved' },
  { id: 'lr5', name: 'Mrs. Leela M.', dept: 'Telugu G4-6', type: 'Half-day Leave', dates: '5 Jun', doc: 'Insufficient notice', status: 'rejected' },
];

export const initialDutyAssignments: DutyAssignment[] = [
  { id: 'da1', title: 'Morning Gate Duty', staffName: 'Unassigned', date: 'Today', location: 'Main Gate', time: '07:30–08:15', status: 'pending' },
  { id: 'da2', title: 'Exam Hall Invigilation', staffName: 'Mr. Ramesh Kumar', date: '17 Jun', location: 'Hall A', time: '09:00–12:00', status: 'assigned' },
  { id: 'da3', title: 'Library Supervision', staffName: 'Mrs. Priya Sharma', date: '18 Jun', location: 'Central Library', time: '14:00–15:30', status: 'assigned' },
  { id: 'da4', title: 'Sports Day Coordination', staffName: 'Mr. Suresh P.', date: '15 Jun', location: 'Sports Ground', time: '08:00–13:00', status: 'completed' },
];

export const DUTY_STAFF_CANDIDATES = ['Mr. Ramesh Kumar', 'Mrs. Priya Sharma', 'Mr. Suresh P.', 'Mrs. Leela M.', 'Ms. Sneha V.', 'Mr. Anil Kumar'];

/** @deprecated Use initialLeaveRequests */
export const leaveRequests = initialLeaveRequests;

export const upcomingExams = [
  { title: 'Unit Test - I', grades: 'G10 All Sections', dates: '17 Jun · 9 AM–12 PM', subjects: 'Math/Science/English/Social/Telugu', status: 'Seating Plan/Hall/Notice sent' },
  { title: 'Mid-Term', grades: 'G11 & 12', dates: '25 Jun – 2 Jul', status: 'Seating Plan Pending' },
  { title: 'Practical Exam — Science Lab', grades: 'G9', dates: '14 Jun', status: 'Batches A/B/C at 9/11/2' },
];

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

export const initialManagerCirculars: ManagerCircular[] = [
  {
    id: 'mc1',
    circularNo: 'CIR/2026/0041',
    title: 'Annual Sports Day - Notice',
    body: 'Annual Sports Day will be held on 15 June. Students must report by 8:00 AM in full sports uniform. Parents are welcome to attend the opening ceremony.',
    date: '15 Jun',
    status: 'Delivered 1,247/1,250',
    tab: 'Circulars',
    audience: 'All Parents',
  },
  {
    id: 'mc2',
    circularNo: 'CIR/2026/0042',
    title: 'Mid-Term Examination Schedule',
    body: 'Mid-term examinations for Grades 10–12 are scheduled from 25 June to 2 July. Detailed subject-wise timetable will be shared by class teachers.',
    date: 'Draft',
    status: 'Target G10–12',
    tab: 'Circulars',
    audience: 'Senior School Parents',
  },
  {
    id: 'mc3',
    circularNo: 'CIR/2026/0043',
    title: 'Summer Vacation Extension',
    body: 'Due to extreme weather, the school will reopen after 1 July. Online assignments will continue during the extended break.',
    date: 'Urgent',
    status: 'Reopen after July 1',
    tab: 'Notices',
    audience: 'All Parents',
  },
  {
    id: 'mc4',
    circularNo: 'CIR/2026/0044',
    title: 'PTM — Term II Progress Review',
    body: 'Parent-Teacher Meeting for Term II is on 20 June, 2:00–5:00 PM. Please book your slot through the parent portal.',
    date: '20 Jun',
    status: 'Slots open',
    tab: 'PTM',
    audience: 'Grades 6–12',
  },
  {
    id: 'mc5',
    circularNo: 'CIR/2026/0045',
    title: 'Fee Reminder — Term II',
    body: 'This is a gentle reminder to clear Term II fees by 30 June to avoid late payment charges.',
    date: '28 Jun',
    status: 'Scheduled',
    tab: 'Notices',
    audience: 'All Parents',
  },
];

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

export const initialManagerNotifications: ManagerNotificationSeed[] = [
  {
    id: 'mn1',
    title: 'Timetable Conflict',
    body: 'Grade 10 Thursday · Room 205 overlap detected',
    type: 'urgent',
    time: '1h ago',
    groupLabel: 'TODAY',
    actions: ['Resolve', 'Dismiss'],
  },
  {
    id: 'mn2',
    title: 'Leave Request',
    body: 'Mrs. Kavitha Rao · 12–13 Jun Medical Leave',
    type: 'approval',
    time: '2h ago',
    groupLabel: 'TODAY',
    actions: ['Approve', 'Review'],
  },
  {
    id: 'mn3',
    title: 'Mid-Term Scheduled',
    body: 'G11 & 12 · 25 Jun – 2 Jul',
    type: 'academic',
    time: 'Yesterday',
    groupLabel: 'YESTERDAY',
  },
  {
    id: 'mn4',
    title: 'Substitute Assigned',
    body: 'Mrs. Leela M. for Mr. Anil Kumar',
    type: 'staff',
    time: 'Yesterday',
    groupLabel: 'YESTERDAY',
  },
  {
    id: 'mn5',
    title: 'ERP Sync Complete',
    body: 'Attendance and timetable data synced successfully',
    type: 'system',
    time: '2d ago',
    groupLabel: 'EARLIER',
  },
];

/** @deprecated Use initialManagerNotifications */
export const notifications = initialManagerNotifications;

export const staffList = [
  { name: 'Mr. Ramesh Kumar', role: 'HOD Math', status: 'Present', detail: 'Room 204 · Period 3' },
  { name: 'Mrs. Priya Sharma', role: 'English', status: 'On Leave', detail: 'Returns 13 Jun' },
  { name: 'Mr. Anil Kumar', role: 'Science', status: 'Absent', detail: '2 periods need coverage' },
];
