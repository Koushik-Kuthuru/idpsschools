export const vpAvatar =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD9hyUsuAOsKKayQJ0CxkImKhT4h-SoAg0CLxnUFYh_igzrLkPUG_QXvpkeIZidpH5eTckl83K4fCBzI30gEpRsfl2CxvKo0pxPm227V9LAcSMyeLX7mCeON8ldqeuFr-a5vJ7SzmR2mBZ7mcJXDbC-btUtvPWHlO3EJixyxQX8-Y9c3k_GmSos_wR5fpT2aiUdTLv9iXMMkod1vfu2VE18IDAXdtKzQ8SjH8p_RdVkKsli5uYhJRTRcMkfzjaclf2MaX9oAa6GIHxB';

export const vpProfile = {
  name: 'Dr. Priya Sharma',
  role: 'Vice Principal',
  school: 'Delhi Public School, Hyderabad',
  empId: 'EMP-2024-0042',
  email: 'priya.s@dps.edu',
  phone: '+91 98765 43210',
  joined: '2018',
  experience: '12 yrs',
  degree: 'Ph.D. Ed',
  qualification: 'Ph.D. Educational Leadership',
  workLocation: 'Admin Block B2',
  workHours: '08:00 - 16:30',
};

export const dashboardStats = [
  { icon: 'groups' as const, label: 'Staff Present', value: '87/102', colorKey: 'primary' as const },
  { icon: 'person' as const, label: 'Students Today', value: '1,204', colorKey: 'secondary' as const },
  { icon: 'event-busy' as const, label: 'Leaves', value: '6', colorKey: 'tertiary' as const },
  { icon: 'report' as const, label: 'Issues', value: '4', colorKey: 'error' as const },
];

export type PriorityActionRoute = 'TimetableSubstitution' | 'LeaveApprovals' | 'ParentCommunication';

export type PriorityAction = {
  id: string;
  title: string;
  subtitle: string;
  accent: string;
  iconBg: string;
  iconColor: string;
  icon: 'swap-horiz' | 'assignment-ind' | 'groups-3';
  cta: string;
  ctaFilled: boolean;
  route: PriorityActionRoute;
};

export const initialPriorityActions: PriorityAction[] = [
  {
    id: 'pa1',
    title: 'Substitution Required',
    subtitle: 'Class 9-B, Physics Dept.',
    accent: '#f59e0b',
    iconBg: '#fef3c7',
    iconColor: '#92400e',
    icon: 'swap-horiz',
    cta: 'Assign',
    ctaFilled: true,
    route: 'TimetableSubstitution',
  },
  {
    id: 'pa2',
    title: 'Leave Approval',
    subtitle: 'Mr. Rohan S. (Medical)',
    accent: '#3b82f6',
    iconBg: '#dbeafe',
    iconColor: '#1e40af',
    icon: 'assignment-ind',
    cta: 'Review',
    ctaFilled: false,
    route: 'LeaveApprovals',
  },
  {
    id: 'pa3',
    title: 'Parent Meeting',
    subtitle: 'Aryan V. (Academic Prog)',
    accent: '#a855f7',
    iconBg: '#f3e8ff',
    iconColor: '#6b21a8',
    icon: 'groups-3',
    cta: 'Schedule',
    ctaFilled: true,
    route: 'ParentCommunication',
  },
];

/** @deprecated Use initialPriorityActions */
export const priorityActions = initialPriorityActions;

export type TodayOverviewRoute =
  | 'StaffManagement'
  | 'StudentDiscipline'
  | 'TimetableSubstitution'
  | 'ExaminationOversight';

export type TodayOverviewItem = {
  icon: 'percent' | 'gavel' | 'play-circle-outline' | 'quiz';
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  colorKey: 'primary' | 'tertiary' | 'secondary' | 'primaryContainer';
  route: TodayOverviewRoute;
};

export const initialTodayOverview: TodayOverviewItem[] = [
  { icon: 'percent', label: 'Attendance', value: '89.2%', trend: '+1.2%', trendUp: true, colorKey: 'primary', route: 'StaffManagement' },
  { icon: 'gavel', label: 'Discipline', value: '07', trend: '-2', trendUp: false, colorKey: 'tertiary', route: 'StudentDiscipline' },
  { icon: 'play-circle-outline', label: 'Active Classes', value: '42/48', colorKey: 'secondary', route: 'TimetableSubstitution' },
  { icon: 'quiz', label: 'Upcoming Exams', value: '03', colorKey: 'primaryContainer', route: 'ExaminationOversight' },
];

/** @deprecated Use initialTodayOverview */
export const todayOverview = initialTodayOverview;

export type RecentActivityDot = 'primary' | 'amber' | 'blue';

export type RecentActivityItem = {
  id: string;
  text: string;
  time: string;
  source: string;
  dot: RecentActivityDot;
};

export const initialRecentActivity: RecentActivityItem[] = [
  { id: 'ra1', text: 'Staff Meeting minutes uploaded for May.', time: '10:45 AM', source: 'Academic Dept', dot: 'primary' },
  { id: 'ra2', text: 'Critical substitution alert for Chemistry lab.', time: '09:30 AM', source: 'HR Portal', dot: 'amber' },
  { id: 'ra3', text: 'Fees report generated for Q1 academic year.', time: '08:15 AM', source: 'Finance', dot: 'blue' },
];

/** @deprecated Use initialRecentActivity */
export const recentActivity = initialRecentActivity;

export const quickModules = [
  { icon: 'school' as const, label: 'Academic', route: 'AcademicPerformance' as const },
  { icon: 'badge' as const, label: 'Staff', route: 'StaffManagement' as const },
  { icon: 'gavel' as const, label: 'Discipline', route: 'StudentDiscipline' as const },
  { icon: 'domain' as const, label: 'Campus Ops', route: 'CampusOperations' as const },
  { icon: 'hub' as const, label: 'Departments', route: 'DepartmentCoordination' as const },
  { icon: 'quiz' as const, label: 'Exams', route: 'ExaminationOversight' as const },
  { icon: 'campaign' as const, label: 'Parents', route: 'ParentCommunication' as const },
  { icon: 'notifications' as const, label: 'Alerts', route: 'Notifications' as const },
];

export const staffMembers = [
  { id: 's1', name: 'Arjun Nair', dept: 'Physics', status: 'present' as const, idNo: 'STF-102' },
  { id: 's2', name: 'Preethi Suresh', dept: 'Mathematics', status: 'present' as const, idNo: 'STF-087' },
  { id: 's3', name: 'Ravi Kumar', dept: 'Chemistry', status: 'on-leave' as const, idNo: 'STF-064' },
];

export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected';

export type LeaveRequest = {
  id: string;
  name: string;
  dept: string;
  type: string;
  days: string;
  dates: string;
  status: LeaveRequestStatus;
  avatar?: string;
  badges?: string[];
  reason?: string;
  remaining?: string;
  coverage?: string;
  coverageWarning?: boolean;
  attachment?: string;
  alert?: string;
  approveLabel?: string;
};

export const leaveStats = {
  pending: 6,
  approvedToday: 3,
  rejected: 1,
  onLeaveNow: 8,
};

export const leaveRequests: LeaveRequest[] = [
  {
    id: 'l1',
    name: 'Mr. Arjun Nair',
    dept: 'Physics',
    type: 'Casual Leave',
    days: '2 days',
    dates: '12-13 Jun',
    status: 'pending',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB1Madv4fHx83Ph4ALH-UjCAWWcHRf-4FH6hoo8IM9tAfvlwVswr6Bt18Z9tKQ08Cm9xaZW9DU8LDcDyIxGHglkH6MHPRyzYOzf44wlCVDDJA6eCXkCPPIVZjytNqARAX0ymoiCZehuKqlhmqNLc_dq0mBzikrq1WHH0-BjJ9d_PAaWQLWGvcTIXkfKSRQ90eVnfnXLlT3GtLhwwhMV_CnWArdxkScQfOb5Y3qSs35s2iWwmBDGVUm-5I6nnM5RnyyEyAY5y59mn-Hs',
    badges: ['CASUAL LEAVE', 'URGENT'],
    reason: 'Family emergency',
    remaining: '8 days',
    coverage: 'Requested Mr. Harish',
    approveLabel: 'Approve',
  },
  {
    id: 'l2',
    name: 'Ms. Preethi Suresh',
    dept: 'Mathematics',
    type: 'Medical Leave',
    days: '6 days',
    dates: '10-15 Jun',
    status: 'pending',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD7liwkV0yVybw6vDLyCunDiY56H4SgxIBGFpEL8j9sjTBfua07DaJfo-cMMeDGnEPLchBfHxBQmRZbwnRbiE_MLEvz86RGbFOTyjYEg1dff9PvZ3EkLhT_LQxSaBrXyXwja1EPNuGWy-2KgOcKQqXEr5VszwiuA0vEP4W2wa_6jDjzuJeOgeXYhCerr0V5iqmUz5SZgQ56ET5oCHno1qlWfn1Dl8fA4QEdA4AlxqXSFUQQJkOB7iJ2M5t_EBbxOB8B36oTnDzmtzEz',
    badges: ['MEDICAL LEAVE'],
    attachment: 'Medical_Certificate.pdf',
    remaining: '14 days',
    approveLabel: 'Approve',
  },
  {
    id: 'l3',
    name: 'Mr. Ravi Kumar',
    dept: 'Chemistry',
    type: 'Earned Leave',
    days: '3 days',
    dates: '18-20 Jun',
    status: 'pending',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCzdfZ2ns4PyWJcFRKvjohJONvYuo-tcp5n82kQ8i-6yKFZwq84wwnNFh2FfSV4PMtn95buX99Suo7demrZiH6lACdTSeslLG-I773WRoYfH0wv5cuUHj23yBtRKB8Wf6miHTOR0tlsrtCXfI2UvvzyJcJVgCORnVx1QHoWj2dyX3rOm6qC0N-oPfTvvM_lLMOLgU3nObkQCmaYQYFfL2JjK2LZ1CU7OFPACSJTQv-Qa_KKMZsZq8G6QadCQsyT7MBILG38qH2_J5rS',
    badges: ['EARNED LEAVE'],
    reason: 'Personal - family function',
    coverage: 'Not arranged yet',
    coverageWarning: true,
    alert: 'HOD absence during exam period',
    approveLabel: 'Approve with Note',
  },
];

export const disciplineCases = [
  { id: 'd1', name: 'Aditya Kumar', class: '10A', issue: 'Uniform Violation', severity: 'Low', date: '10 Jun 2025' },
  { id: 'd2', name: 'Riya Sharma', class: '8B', issue: 'Late Arrival', severity: 'Medium', date: '09 Jun 2025' },
  { id: 'd3', name: 'Mohammed Irfan', class: '7C', issue: 'Classroom Disruption', severity: 'High', date: '08 Jun 2025' },
  { id: 'd4', name: 'Sneha Patel', class: '11A', issue: 'Mobile Phone Usage', severity: 'Medium', date: '07 Jun 2025' },
];

export const calendarEvents = [
  { id: 'e1', title: 'Parent-Teacher Meeting', date: '12 Jun 2025', time: '10:00 AM', type: 'Meeting', color: '#0fbd83' },
  { id: 'e2', title: 'Science Exhibition', date: '15 Jun 2025', time: '09:00 AM', type: 'Event', color: '#3b82f6' },
  { id: 'e3', title: 'Staff Development Workshop', date: '18 Jun 2025', time: '02:00 PM', type: 'Training', color: '#a855f7' },
];

export const reportCategories = [
  { id: 'academic', label: 'Academic', count: 5, icon: 'school' as const, color: '#3b82f6' },
  { id: 'attendance', label: 'Attendance', count: 4, icon: 'fact-check' as const, color: '#0fbd83' },
  { id: 'discipline', label: 'Discipline', count: 3, icon: 'gavel' as const, color: '#a43b37' },
  { id: 'staff', label: 'Staff', count: 4, icon: 'badge' as const, color: '#a855f7' },
];

export const scheduleDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export const availableTeachers = [
  {
    id: 't1',
    name: 'Mr. Harish',
    free: 'Free: P3, P5',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC682jPE7fUn5jRkRpJ0ASg-WOlrmfZ8bJYbxeBnyGzLOtP_eTNN_sfeUDDUGagdAqPNcF4RmI3fFqCRXGmIAD3QQnTOX6nTCCptXb1eIPW8ye_qUtyhdI2wJny4Dq8BoJTE0ls5BUarMsqM1sFOTIhLNFvdyzZWfBRZfJ7H91hXPOf7I-1v_mSm55lVa4xXx7bUPWmHzj4auPta5KTOFw6fHh_WpN0zCbjzkPohmvPxfzhkq8CsD1sh2V9wUMrbYFZKc8gJO_DcXD-',
  },
  {
    id: 't2',
    name: 'Mrs. Asha',
    free: 'Free: P4',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDiwOoBPLhuAxNZVmtbEfK3EdP1J1FaC5v-uaqDH9a9Z01k4RmIAKVWuqXHzxAeh1QiV0wTKywUDpylP2e4nbpB9bfVaVXTG6TcqZg3UFlf0qmIdaXYRU3FQyEbiCcbfuB_E-FlOCTu0nAQIuCJonQKPYre3Ay1tM7eWiXE1Rx69TMPuC_NMTOBnMDfv_MRtULiVzvllb4_CgP1DZQxvdy0JTGYwTSjShvazDTAwvq9P9PovArr0__zov8rzDukj1213x5m96q1iP4w',
  },
  {
    id: 't3',
    name: 'Mr. Deepak',
    free: 'Free: P3, P4, P7',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD74yL9GQxDN207D4npLQj9a_clgGu-cH45lKZ_kGhVJ0YC3eNuvhYKZdtpYOToh3JlzfzlvlnctKkHWHhnIzeWphvbkvy3aJLUx0VD8TSyX1Thqt2VJMbEKO5QMS2TnLeaQAp3BozPLkUI0KjKypZnH9-7lJs7AW0eip7ciMhPn6o_IA2X2BJTxmZFTexBfX6z48R-qF4ACWcI8mdvJjV220cH-fU2Wt4Sk0R75I1y_SlwpPOz7AugwGGAvwr_5962gckt2EZus4Yy',
  },
];

export type SchedulePeriodStatus = 'running' | 'substitute' | 'unassigned';

export type SchedulePeriod = {
  id: string;
  period: string;
  time: string;
  className: string;
  subject: string;
  teacher: string;
  teacherAvatar?: string;
  room?: string;
  substitute?: string;
  status: SchedulePeriodStatus;
};

export const initialSchedulePeriods: SchedulePeriod[] = [
  {
    id: 'p1',
    period: 'P1',
    time: '8:00 AM',
    className: 'Class 9A',
    subject: 'Mathematics',
    teacher: 'Mr. Arjun Nair',
    teacherAvatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC81zFfDVBh3jb1Cn2GdJMvDoeGAUF2snQc5mCtuOhfhJyn7eknIh3UpwJFRr40HZr0_49qi5ILckUS5MPhno82pNjaRuaw0saQ1AiVqcoYs6qJQrxX3yvPSNKGyXTIP9mxUKVjbBemZBNH7cl5COzg_F3MJXCH5QRJtQDOzc9Nda8ZyvTPc2Zyu3Wpdky8gvWBpZZZ9yq4Kv_fBQIgZO4lHwsJ35g60NYOg9CwCyhxzv0eqITrPTZQvkRzBARaOiGXhgJIC3mEFSAB',
    room: 'Room 204',
    status: 'running' as SchedulePeriodStatus,
  },
  {
    id: 'p2',
    period: 'P2',
    time: '8:45 AM',
    className: 'Class 10B',
    subject: 'Science',
    teacher: 'Ms. Preethi',
    substitute: 'Mr. Harish Kumar',
    status: 'substitute' as SchedulePeriodStatus,
  },
  {
    id: 'p3',
    period: 'P3',
    time: '9:30 AM',
    className: 'Class 8C',
    subject: 'English',
    teacher: 'Mr. Ravi (On Leave)',
    status: 'unassigned' as SchedulePeriodStatus,
  },
  {
    id: 'p4',
    period: 'P4',
    time: '10:15 AM',
    className: 'Class 7A',
    subject: 'Hindi',
    teacher: 'Vacant Period',
    status: 'unassigned',
  },
];

/** @deprecated Use initialSchedulePeriods */
export const schedulePeriods = initialSchedulePeriods;

export const substituteSuggestions = [
  {
    id: 'sug1',
    name: 'Mr. Deepak Sharma',
    fit: '95% Fit • Free P3, P4',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAuq0VCN0f2N51z2E7rWxOT7AVfReURtlBwEGySsZnVWnZjnSFhAmegCavfLujfF4tLtonFvWkGv9lymBVU3Tya99ect3ZrESA2TYNLzYpuTVEeR4eEofusCyNxrE2fZlLkQ7R5hgw56zacNkXqq1od3bONIWLeLiqItLWzYVMepS3DNPEDjk1frqYIB9Ap1b3J17LitNee6VCrhs6VgT5EwQaMS9_PxOqWPDmzFSGZLfVd5hajzvW3hMyWi-MuzZUT3Hxv-4WhYaF8',
    selected: true,
  },
  {
    id: 'sug2',
    name: 'Mrs. Asha Mehta',
    fit: 'Free P4 only',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBCcNoSn5f50IFVL1J86h2twtr5gIKpOEGOPaPi8H6geKBMeXOUU9idoC8MpEk3PN3aaYOE-4GhO4MT-1Tt2naeUE8NzSZa2On6_iS-976UmGdwYEDwZefHv4I07q5LzaoTMcWd19t8rCJpCuCXgWnXR9fQO0yfigAxMEb8Rxo-NJY5tBqN89BESEHvd02IS8LcsAXMjCuJ4BUaRDGhINQq0Xi1afljR1GLwuoLgi_I6CupXk2GYUubMBwqyX60EDzfBMeJ7ZmrVvU1',
    selected: false,
  },
];

export const reportFilters = ['All', 'Academic', 'Attendance', 'Discipline', 'Staff', 'Financial'] as const;

export const kpiMetrics = [
  { label: 'Avg Attendance', value: '89.2%', progress: 89.2, colorKey: 'primary' as const, icon: 'trending-up' as const },
  { label: 'Pass Rate', value: '88.4%', progress: 88.4, colorKey: 'secondary' as const, icon: 'show-chart' as const },
  { label: 'Staff Punctuality', value: '93%', progress: 93, colorKey: 'primary' as const, icon: 'check-circle' as const },
  { label: 'Discipline Cases', value: '49', progress: 40, colorKey: 'tertiary' as const, icon: 'warning' as const },
];

export const availableReports = [
  { id: 'r1', title: 'Monthly Attendance Summary', meta: 'Generated 08 Jun · PDF', icon: 'fact-check' as const, color: '#0fbd83' },
  { id: 'r2', title: 'Class-wise Performance Report', meta: 'Term 2 · Excel', icon: 'school' as const, color: '#3b82f6' },
  { id: 'r3', title: 'Staff Punctuality Log', meta: 'Last 30 days · PDF', icon: 'badge' as const, color: '#a855f7' },
  { id: 'r4', title: 'Discipline Incident Tracker', meta: 'Q1 2025 · PDF', icon: 'gavel' as const, color: '#a43b37' },
];

export const calendarGridDays = [
  { day: 25, muted: true }, { day: 26, muted: true }, { day: 27, muted: true }, { day: 28, muted: true },
  { day: 29, muted: true }, { day: 30, muted: true }, { day: 1, dots: ['#3b82f6'] },
  { day: 2 }, { day: 3, dots: ['#f59e0b'] }, { day: 4 }, { day: 5 }, { day: 6, dots: ['#0fbd83'] },
  { day: 7 }, { day: 8 }, { day: 9 }, { day: 10, today: true, dots: ['#3b82f6', '#f59e0b'] },
  { day: 11 }, { day: 12 }, { day: 13, dots: ['#ef4444'] }, { day: 14 }, { day: 15 },
];

export const todayTimelineEvents = [
  {
    id: 'te1',
    time: '9:00 AM',
    title: 'HOD Coordination Meeting',
    location: 'Conference Hall',
    bg: '#eff6ff',
    border: '#dbeafe',
    titleColor: '#1e3a8a',
    metaColor: '#1d4ed8',
  },
  {
    id: 'te2',
    time: '11:00 AM',
    title: 'Parent Meeting — Mrs. Kavitha Reddy',
    location: 'VP Office · Room B2',
    bg: '#fce7f3',
    border: '#fbcfe8',
    titleColor: '#831843',
    metaColor: '#be185d',
  },
  {
    id: 'te3',
    time: '2:00 PM',
    title: 'Science Exhibition Prep',
    location: 'Auditorium',
    bg: '#ecfdf5',
    border: '#d1fae5',
    titleColor: '#065f46',
    metaColor: '#047857',
  },
  {
    id: 'te4',
    time: '4:30 PM',
    title: 'Staff Briefing',
    location: 'Staff Room',
    bg: '#fef3c7',
    border: '#fde68a',
    titleColor: '#92400e',
    metaColor: '#b45309',
  },
];

export const substitutions = [
  { id: 'sub1', class: '9-B', subject: 'Physics', period: 'P3', teacher: 'Mr. Ravi Kumar', status: 'open' as const },
  { id: 'sub2', class: '10-A', subject: 'Chemistry Lab', period: 'P5', teacher: 'Ms. Ananya', status: 'assigned' as const },
];

export type VpNotificationType = 'urgent' | 'approval' | 'academic' | 'system';

export interface VpNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  type: VpNotificationType;
  read: boolean;
}

export const initialNotifications: VpNotification[] = [
  { id: 'n1', title: 'Substitution Alert', body: 'Class 9-B Physics requires immediate substitute.', time: '10 min ago', type: 'urgent', read: false },
  { id: 'n2', title: 'Leave Request', body: 'Mr. Arjun Nair submitted a medical leave request.', time: '1 hour ago', type: 'approval', read: false },
  { id: 'n3', title: 'Exam Schedule', body: 'Term 2 exam timetable published for review.', time: '3 hours ago', type: 'academic', read: false },
];
