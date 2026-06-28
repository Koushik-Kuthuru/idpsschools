export const principalProfile = {
  name: '',
  shortName: '',
  role: '',
  school: '',
  empId: '',
  yearsExp: 0,
  students: 0,
  staff: 0,
  dob: '',
  gender: '',
  bloodGroup: '',
  nationality: '',
  qualification: '',
  phone: '',
  email: '',
  address: '',
  campus: '',
  board: '',
  udise: '',
  joined: '',
  employment: '',
};

export interface AgendaItem {
  id: string;
  title: string;
  location: string;
  time: string;
}

export const initialAgendaItems: AgendaItem[] = [];

export interface LatestPost {
  id: string;
  icon: 'campaign' | 'event' | 'school' | 'notifications';
  title: string;
  preview: string;
  body: string;
  time: string;
  unread: boolean;
}

export const initialLatestPosts: LatestPost[] = [];

/** @deprecated Use initialAgendaItems */
export const agendaItems = initialAgendaItems;

/** @deprecated Use initialLatestPosts */
export const latestPosts = initialLatestPosts;

export interface PriorityApproval {
  id: string;
  initials: string;
  name: string;
  detail: string;
  type: 'leave' | 'exam';
}

export const initialPriorityApprovals: PriorityApproval[] = [];

/** @deprecated Use initialPriorityApprovals */
export const priorityApprovals = initialPriorityApprovals;

export interface DashboardStat {
  icon: 'group' | 'fact-check' | 'badge' | 'pending-actions';
  label: string;
  value: string;
  highlight?: boolean;
}

export const initialDashboardStats: DashboardStat[] = [];

/** @deprecated Use initialDashboardStats */
export const dashboardStats = initialDashboardStats;

export const quickModules = [
  { icon: 'fact-check' as const, label: 'Attendance', route: 'AttendanceOverview' as const },
  { icon: 'campaign' as const, label: 'Communication', route: 'CommunicationAnnouncements' as const },
  { icon: 'school' as const, label: 'Exams', route: 'ExamResultsManagement' as const },
  { icon: 'payments' as const, label: 'Finance', route: 'FeeFinanceOverview' as const },
  { icon: 'task-alt' as const, label: 'Leave', route: 'LeaveApprovalsCentre' as const },
  { icon: 'schedule' as const, label: 'Timetable', route: 'TimetableManagement' as const },
];

export const staffSummary = { total: 0, present: 0, onLeave: 0 };

export const staffFilters = ['All', 'Teaching', 'Non-Teaching', 'Admin', 'Support', 'On Probation'] as const;

export const staffDepartments = [
  'All Departments',
  'Mathematics',
  'Science',
  'English',
  'Social Studies',
  'Languages',
  'Physical Education',
  'Arts & Music',
  'Administration',
  'Accounts',
  'Support',
] as const;

export type StaffDepartment = (typeof staffDepartments)[number];

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  department: StaffDepartment;
  category: 'Teaching' | 'Non-Teaching' | 'Admin' | 'Support';
  status: 'present' | 'absent' | 'leave';
  empId: string;
  joined: string;
  qualification: string;
  email: string;
  phone: string;
  rating: number;
  onProbation?: boolean;
}

export const staffMembers: StaffMember[] = [];

export const teachingDepartments = staffDepartments.filter((d) => d !== 'All Departments' && !['Administration', 'Accounts', 'Support'].includes(d));

export const academicTerms = ['Term 1', 'Term 2', 'Term 3'] as const;

export const gradePerformance: { grade: string; avg: string; pass: string; trend: 'up' | 'down' | 'flat' }[] = [];

export const subjectPerformance: { subject: string; percent: number; color: string }[] = [];

export const schoolToppers: { name: string; grade: string; score: string; medal: 'gold' | 'silver' | 'bronze' }[] = [];

export const attendanceSummary = { present: 0, absent: 0, late: 0, leave: 0, rate: '0%' };

export interface ClassAttendanceRow {
  class: string;
  grade: string;
  present: number;
  absent: number;
  rate: number;
  alert: boolean;
}

export const classAttendance: ClassAttendanceRow[] = [];

export interface ChronicAbsentee {
  id: string;
  name: string;
  class: string;
  days: number;
}

export const chronicAbsentees: ChronicAbsentee[] = [];

export const commChannels = ['Announcements', 'Circulars', 'Messages', 'Notice Board', 'SMS/Email'] as const;
export type CommChannel = (typeof commChannels)[number];

export const commCategories = ['All', 'Holiday', 'Academic', 'Alert', 'General'] as const;
export type CommCategory = (typeof commCategories)[number];

export const commAudiences = ['All', 'Staff', 'Parents', 'Students'] as const;
export type CommAudienceFilter = (typeof commAudiences)[number];

export const commPeriods = [
  { key: 'all' as const, label: 'All time' },
  { key: 'today' as const, label: 'Today' },
  { key: 'week' as const, label: 'This week' },
  { key: 'month' as const, label: 'This month' },
];
export type CommPeriodFilter = (typeof commPeriods)[number]['key'];

export interface CommItem {
  id: string;
  channel: CommChannel;
  category: Exclude<CommCategory, 'All'>;
  title: string;
  body: string;
  time: string;
  period: CommPeriodFilter;
  audience: string;
  audienceKey: Exclude<CommAudienceFilter, 'All'>;
  views: number;
  notifications: number;
  pinned?: boolean;
}

export const commItems: CommItem[] = [];

/** @deprecated Use commItems filtered by channel Announcements */
export const announcements = commItems
  .filter((i) => i.channel === 'Announcements')
  .map((i) => ({
    id: i.id,
    category: i.category,
    title: i.title,
    time: i.time,
    audience: i.audience,
    views: i.views,
    notifications: i.notifications,
  }));

export interface CommMessage {
  id: string;
  name: string;
  role: string;
  preview: string;
  body: string;
  time: string;
  unread: boolean;
}

export const recentMessages: CommMessage[] = [];

export type ExamStatus = 'DRAFT' | 'IN PROGRESS' | 'COMPLETED';
export type ExamTerm = 'Term 1' | 'Term 2' | 'Term 3' | 'Final';

export interface UpcomingExam {
  id: string;
  title: string;
  grades: string;
  term: ExamTerm;
  status: ExamStatus;
  dates: string;
  startDate: string;
  endDate: string;
  subjects?: string;
}

export interface ExamScheduleRow {
  id: string;
  examId: string;
  date: string;
  subject: string;
  class: string;
  time: string;
}

export type ResultPublishLabel = 'Published' | 'Pending' | 'In Review' | 'Not Started';

export interface ClassResultStatus {
  grade: string;
  percent: number;
  label: ResultPublishLabel;
  sectionsPublished: number;
  totalSections: number;
}

export interface PassFailDistribution {
  grade: string;
  passPercent: number;
  failPercent: number;
  passCount: number;
  failCount: number;
}

export const EXAM_GRADES = ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'] as const;
export const EXAM_TYPES = ['Unit Test', 'Mid-Term', 'Pre-Board', 'Practical', 'Annual Exam'] as const;

export const initialUpcomingExams: UpcomingExam[] = [];

export const initialExamSchedule: ExamScheduleRow[] = [];

export const initialResultsStatus: ClassResultStatus[] = [];

export const initialPassFailDistribution: PassFailDistribution[] = [];

/** @deprecated Use initialUpcomingExams */
export const upcomingExams = initialUpcomingExams;

/** @deprecated Use initialExamSchedule */
export const examSchedule = initialExamSchedule;

/** @deprecated Use initialResultsStatus */
export const resultsStatus = initialResultsStatus.map((r) => ({
  grade: r.grade.replace('Grade ', 'G'),
  percent: r.percent,
  label: r.label,
}));

export const financeOverview = {
  total: '₹ 0',
  progress: 0,
  target: '₹ 0',
  balance: '₹ 0',
  month: '',
};

export const feeCategories: { label: string; amount: string; percent: number; color: string }[] = [];

export interface FeeDefaulter {
  id: string;
  name: string;
  class: string;
  amount: string;
  days: number;
  reminded?: boolean;
}

export const feeDefaulters: FeeDefaulter[] = [];

export const allFeeDefaulters: FeeDefaulter[] = [];

export interface ConcessionRequest {
  id: string;
  student: string;
  class: string;
  amount: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

export const concessionRequests: ConcessionRequest[] = [];

export interface ScholarshipEntry {
  id: string;
  student: string;
  class: string;
  type: string;
  amount: string;
  term: string;
}

export const scholarshipList: ScholarshipEntry[] = [];

export const FINANCE_REPORT_RANGES = [
  { id: 'month' as const, label: 'This month', includeDefaulters: true },
  { id: 'lastMonth' as const, label: 'Last month', includeDefaulters: false },
  { id: 'term' as const, label: 'This term', includeDefaulters: true },
  { id: 'categories' as const, label: 'Category breakdown only', includeDefaulters: false },
] as const;

export type FinanceReportRange = (typeof FINANCE_REPORT_RANGES)[number]['id'];

export type PrincipalLeaveStatus = 'pending' | 'approved' | 'rejected';

export interface PrincipalLeaveRequest {
  id: string;
  name: string;
  dept: string;
  type: string;
  days: string;
  dates: string;
  submitted: string;
  status: PrincipalLeaveStatus;
  onLeaveToday?: boolean;
}

export const leaveRequests: PrincipalLeaveRequest[] = [];

export function computeLeaveSummary(requests: PrincipalLeaveRequest[]) {
  return {
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
    onLeaveToday: requests.filter((r) => r.status === 'approved' && r.onLeaveToday).length,
  };
}

/** @deprecated Use computeLeaveSummary(leaveRequests) */
export const leaveSummary = computeLeaveSummary(leaveRequests);

export type ReportCategoryId = 'academic' | 'attendance' | 'finance' | 'staff' | 'custom';

export interface ReportCategory {
  id: ReportCategoryId;
  label: string;
  count: number;
  color: string;
  icon: 'school' | 'fact-check' | 'payments' | 'badge' | 'tune';
  description: string;
}

export const reportCategories: ReportCategory[] = [];

export interface QuickDownloadReport {
  id: string;
  title: string;
  format: 'PDF';
  date: string;
  category: ReportCategoryId;
  summary: string;
}

export const quickDownloads: QuickDownloadReport[] = [];

export interface ScheduledReport {
  id: string;
  title: string;
  schedule: string;
  frequency: string;
  nextRun: string;
  enabled: boolean;
  category: ReportCategoryId;
}

export const scheduledReports: ScheduledReport[] = [];

export const categoryReportCatalog: Record<ReportCategoryId, { title: string; description: string }[]> = {
  academic: [],
  attendance: [],
  finance: [],
  staff: [],
  custom: [],
};

export const timetableClasses = ['Grade 10A', '10B', '11A', '11B', '12C'] as const;

export const timetableConflicts: string[] = [];

export type PrincipalNotificationType = 'urgent' | 'approval' | 'academic' | 'staff' | 'system';

export interface PrincipalNotificationSeed {
  id: string;
  title: string;
  body: string;
  type: PrincipalNotificationType;
  time: string;
  groupLabel: string;
  actions?: [string, string];
}

export const initialPrincipalNotifications: PrincipalNotificationSeed[] = [];
