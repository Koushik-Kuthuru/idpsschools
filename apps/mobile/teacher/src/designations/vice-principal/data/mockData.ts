export const vpAvatar =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD9hyUsuAOsKKayQJ0CxkImKhT4h-SoAg0CLxnUFYh_igzrLkPUG_QXvpkeIZidpH5eTckl83K4fCBzI30gEpRsfl2CxvKo0pxPm227V9LAcSMyeLX7mCeON8ldqeuFr-a5vJ7SzmR2mBZ7mcJXDbC-btUtvPWHlO3EJixyxQX8-Y9c3k_GmSos_wR5fpT2aiUdTLv9iXMMkod1vfu2VE18IDAXdtKzQ8SjH8p_RdVkKsli5uYhJRTRcMkfzjaclf2MaX9oAa6GIHxB';

export const vpProfile = {
  name: '',
  role: '',
  school: '',
  empId: '',
  email: '',
  phone: '',
  joined: '',
  experience: '',
  degree: '',
  qualification: '',
  workLocation: '',
  workHours: '',
};

export const dashboardStats: {
  icon: 'groups' | 'gavel' | 'event' | 'campaign';
  label: string;
  value: string;
  colorKey: 'primary' | 'tertiary' | 'error' | 'secondary';
}[] = [];

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

export const initialPriorityActions: PriorityAction[] = [];

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

export const initialTodayOverview: TodayOverviewItem[] = [];

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

export const initialRecentActivity: RecentActivityItem[] = [];

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

export const staffMembers: { id: string; name: string; dept: string; status: 'present' | 'on-leave' | 'absent'; idNo: string }[] = [];

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

export const leaveStats = { pending: 0, approvedToday: 0, rejected: 0, onLeaveNow: 0 };

export const leaveRequests: LeaveRequest[] = [];

export const disciplineCases: { id: string; name: string; class: string; issue: string; severity: string; date: string }[] = [];

export const calendarEvents: { id: string; title: string; date: string; time: string; type: string; color: string }[] = [];

export const reportCategories: {
  id: string;
  label: string;
  count: number;
  icon: 'school' | 'fact-check' | 'gavel' | 'badge';
  color: string;
}[] = [];

export const scheduleDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export const availableTeachers: { id: string; name: string; free: string; avatar: string }[] = [];

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

export const initialSchedulePeriods: SchedulePeriod[] = [];

/** @deprecated Use initialSchedulePeriods */
export const schedulePeriods = initialSchedulePeriods;

export const substituteSuggestions: { id: string; name: string; fit: string; avatar: string; selected?: boolean }[] = [];

export const reportFilters = ['All', 'Academic', 'Attendance', 'Discipline', 'Staff', 'Financial'] as const;

export const kpiMetrics: {
  label: string;
  value: string;
  progress: number;
  colorKey: 'primary' | 'secondary' | 'tertiary';
  icon: 'trending-up' | 'show-chart' | 'check-circle' | 'warning';
}[] = [];

export const availableReports: {
  id: string;
  title: string;
  meta: string;
  icon: 'fact-check' | 'school' | 'badge' | 'gavel';
  color: string;
}[] = [];

export const calendarGridDays: { day: number; muted?: boolean; today?: boolean; dots?: string[] }[] = [];

export const todayTimelineEvents: {
  id: string;
  time: string;
  title: string;
  location: string;
  bg: string;
  border: string;
  titleColor: string;
  metaColor: string;
}[] = [];

export const substitutions: {
  id: string;
  class: string;
  subject: string;
  period: string;
  teacher: string;
  status: 'open' | 'assigned';
}[] = [];

export type VpNotificationType = 'urgent' | 'approval' | 'academic' | 'system';

export interface VpNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  type: VpNotificationType;
  read: boolean;
}

export const initialNotifications: VpNotification[] = [];
