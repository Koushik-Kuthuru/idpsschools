export const principalProfile = {
  name: 'Dr. Ramesh Sharma',
  shortName: 'Principal Ramesh',
  role: 'Principal',
  school: 'International Delhi Public School',
  empId: 'EMP-PRN-001',
  yearsExp: 12,
  students: 1248,
  staff: 92,
  dob: '15 March 1978',
  gender: 'Male',
  bloodGroup: 'B+',
  nationality: 'Indian',
  qualification: 'Ph.D. Education, M.Ed.',
  phone: '+91 98765 43210',
  email: 'ramesh@idps.edu',
  address: '24B Galaxy Apartments, Outer Ring Road, New Delhi',
  campus: 'IDPS (Main)',
  board: 'CBSE',
  udise: '07190101502',
  joined: '12 July 2018',
  employment: 'Permanent',
};

export interface AgendaItem {
  id: string;
  title: string;
  location: string;
  time: string;
}

export const initialAgendaItems: AgendaItem[] = [
  { id: 'ag1', title: 'Weekly Staff Briefing', location: 'Main Auditorium', time: '09:00 AM' },
  { id: 'ag2', title: 'Parent–Teacher Council Meet', location: 'Conference Room B', time: '11:00 AM' },
  { id: 'ag3', title: 'Board Meeting — Term Review', location: 'Principal Office', time: '02:30 PM' },
  { id: 'ag4', title: 'Sports Day Planning', location: 'Sports Ground', time: '04:00 PM' },
];

export interface LatestPost {
  id: string;
  icon: 'campaign' | 'event' | 'school' | 'notifications';
  title: string;
  preview: string;
  body: string;
  time: string;
  unread: boolean;
}

export const initialLatestPosts: LatestPost[] = [
  {
    id: 'lp1',
    icon: 'campaign',
    title: 'Annual Sports Day Schedule',
    preview: 'Preliminary events to commence next Monday at 08:00 AM...',
    body: 'Annual Sports Day will be held on 15 June. Preliminary events commence Monday at 08:00 AM. Students must report in full sports uniform. Parents are welcome to attend the opening ceremony at the main ground.',
    time: '2 hours ago',
    unread: true,
  },
  {
    id: 'lp2',
    icon: 'event',
    title: 'Summer Break Dates',
    preview: 'The ministry has approved the summer vacation dates for 2025...',
    body: 'The ministry has approved summer vacation from 1 July to 15 July 2026. Staff reporting date is 16 July. Online assignments will continue during the first week of the break.',
    time: 'Yesterday',
    unread: true,
  },
  {
    id: 'lp3',
    icon: 'school',
    title: 'CBSE Inspection Readiness',
    preview: 'Departments to submit compliance folders by Friday...',
    body: 'All HODs must submit updated compliance folders including lab safety logs, attendance registers, and CCE records by Friday 5:00 PM. Inspection team visit is scheduled for next week.',
    time: '2 days ago',
    unread: false,
  },
  {
    id: 'lp4',
    icon: 'notifications',
    title: 'Fee Reminder — Term II',
    preview: 'Gentle reminder to clear Term II fees by month end...',
    body: 'This is a gentle reminder for parents to clear Term II fees by 30 June to avoid late payment charges. Defaulter lists will be shared with class teachers on 1 July.',
    time: '3 days ago',
    unread: false,
  },
];

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

export const initialPriorityApprovals: PriorityApproval[] = [
  { id: 'pa1', initials: 'AK', name: 'Anil Kumar', detail: 'Sick Leave • 2 Days', type: 'leave' },
  { id: 'pa2', initials: '', name: 'Exam Schedule', detail: 'Final Term • Grade 10-12', type: 'exam' },
];

/** @deprecated Use initialPriorityApprovals */
export const priorityApprovals = initialPriorityApprovals;

export interface DashboardStat {
  icon: 'group' | 'fact-check' | 'badge' | 'pending-actions';
  label: string;
  value: string;
  highlight?: boolean;
}

export const initialDashboardStats: DashboardStat[] = [
  { icon: 'group', label: 'Enrolled', value: '1,248' },
  { icon: 'fact-check', label: 'Attendance', value: '94.2%' },
  { icon: 'badge', label: 'Staff', value: '87/92' },
  { icon: 'pending-actions', label: 'Awaiting', value: '14', highlight: true },
];

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

export const staffSummary = { total: 92, present: 87, onLeave: 5 };

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

export const staffMembers: StaffMember[] = [
  { id: 's1', name: 'Dr. Meena Iyer', role: 'HOD · Senior Teacher', department: 'Mathematics', category: 'Teaching', status: 'present', empId: 'STF-2023-042', joined: '12 Aug 2015', qualification: 'Ph.D. in Topology', email: 'meena.iyer@school.edu', phone: '+91 98765 43210', rating: 4.8 },
  { id: 's2', name: 'Arjun Khanna', role: 'Mathematics Teacher', department: 'Mathematics', category: 'Teaching', status: 'present', empId: 'STF-2022-031', joined: '08 Jul 2022', qualification: 'M.Sc. Mathematics', email: 'arjun.k@school.edu', phone: '+91 98765 43211', rating: 4.5 },
  { id: 's3', name: 'Priya Nair', role: 'HOD · Senior Teacher', department: 'Science', category: 'Teaching', status: 'present', empId: 'STF-2020-015', joined: '02 Feb 2020', qualification: 'M.Sc. Chemistry', email: 'priya.nair@school.edu', phone: '+91 98765 43212', rating: 4.7 },
  { id: 's4', name: 'Vikram Singh', role: 'Physics Teacher', department: 'Science', category: 'Teaching', status: 'present', empId: 'STF-2021-022', joined: '11 Nov 2021', qualification: 'M.Sc. Physics', email: 'vikram.s@school.edu', phone: '+91 98765 43213', rating: 4.4 },
  { id: 's5', name: 'Deepa Menon', role: 'Biology Teacher', department: 'Science', category: 'Teaching', status: 'leave', empId: 'STF-2019-011', joined: '20 May 2019', qualification: 'M.Sc. Botany', email: 'deepa.m@school.edu', phone: '+91 98765 43214', rating: 4.6 },
  { id: 's6', name: 'Sarah Khan', role: 'HOD · Senior Teacher', department: 'English', category: 'Teaching', status: 'present', empId: 'STF-2018-009', joined: '04 Apr 2018', qualification: 'M.A. English Literature', email: 'sarah.k@school.edu', phone: '+91 98765 43215', rating: 4.9 },
  { id: 's7', name: 'Rohan Das', role: 'English Teacher', department: 'English', category: 'Teaching', status: 'present', empId: 'STF-2023-055', joined: '16 Jun 2023', qualification: 'B.A. B.Ed.', email: 'rohan.d@school.edu', phone: '+91 98765 43216', rating: 4.3, onProbation: true },
  { id: 's8', name: 'Kavita Shah', role: 'History Teacher', department: 'Social Studies', category: 'Teaching', status: 'present', empId: 'STF-2017-004', joined: '09 Sep 2017', qualification: 'M.A. History', email: 'kavita.s@school.edu', phone: '+91 98765 43217', rating: 4.5 },
  { id: 's9', name: 'Anil Kumar', role: 'Geography Teacher', department: 'Social Studies', category: 'Teaching', status: 'absent', empId: 'STF-2020-028', joined: '23 Jan 2020', qualification: 'M.A. Geography', email: 'anil.k@school.edu', phone: '+91 98765 43218', rating: 4.1 },
  { id: 's10', name: 'Neha Singh', role: 'Hindi Teacher', department: 'Languages', category: 'Teaching', status: 'present', empId: 'STF-2016-002', joined: '01 Jul 2016', qualification: 'M.A. Hindi', email: 'neha.s@school.edu', phone: '+91 98765 43219', rating: 4.6 },
  { id: 's11', name: 'Leo Das', role: 'French Teacher', department: 'Languages', category: 'Teaching', status: 'present', empId: 'STF-2022-040', joined: '14 Mar 2022', qualification: 'B.A. French', email: 'leo.d@school.edu', phone: '+91 98765 43220', rating: 4.4 },
  { id: 's12', name: 'Sanjay Rao', role: 'Sports Instructor', department: 'Physical Education', category: 'Teaching', status: 'absent', empId: 'STF-2021-018', joined: '03 Jan 2021', qualification: 'M.P.Ed.', email: 'sanjay.rao@school.edu', phone: '+91 98765 11111', rating: 4.2 },
  { id: 's13', name: 'Meera Nair', role: 'Art Teacher', department: 'Arts & Music', category: 'Teaching', status: 'present', empId: 'STF-2019-019', joined: '10 Oct 2019', qualification: 'BFA', email: 'meera.n@school.edu', phone: '+91 98765 43221', rating: 4.5 },
  { id: 's14', name: 'Lakshmi Devi', role: 'Office Administrator', department: 'Administration', category: 'Non-Teaching', status: 'leave', empId: 'STF-2019-007', joined: '15 Jun 2019', qualification: 'B.Com', email: 'lakshmi@school.edu', phone: '+91 98765 22222', rating: 4.5 },
  { id: 's15', name: 'Ramesh Gupta', role: 'Accounts Head', department: 'Accounts', category: 'Admin', status: 'present', empId: 'STF-2015-001', joined: '01 Apr 2015', qualification: 'M.Com, CA Inter', email: 'ramesh.gupta@school.edu', phone: '+91 98765 43222', rating: 4.7 },
  { id: 's16', name: 'Raju Pillai', role: 'Support Staff', department: 'Support', category: 'Support', status: 'present', empId: 'STF-2018-003', joined: '01 Apr 2018', qualification: '—', email: 'raju@school.edu', phone: '+91 98765 33333', rating: 4.0 },
];

export const teachingDepartments = staffDepartments.filter((d) => d !== 'All Departments' && !['Administration', 'Accounts', 'Support'].includes(d));

export const academicTerms = ['Term 1', 'Term 2', 'Term 3'] as const;

export const gradePerformance = [
  { grade: 'G12', avg: '84%', pass: '98%', trend: 'up' as const },
  { grade: 'G11', avg: '76%', pass: '92%', trend: 'flat' as const },
  { grade: 'G10', avg: '89%', pass: '100%', trend: 'up' as const },
  { grade: 'G9', avg: '65%', pass: '81%', trend: 'down' as const },
  { grade: 'G8', avg: '78%', pass: '94%', trend: 'up' as const },
];

export const subjectPerformance = [
  { subject: 'Math', percent: 72, color: '#3b82f6' },
  { subject: 'Science', percent: 79, color: '#0fbd83' },
  { subject: 'English', percent: 85, color: '#a855f7' },
  { subject: 'Social Sci', percent: 80, color: '#f59e0b' },
  { subject: 'Hindi', percent: 68, color: '#fb923c' },
  { subject: 'Computer', percent: 90, color: '#006c49' },
];

export const schoolToppers = [
  { name: 'Arjun Mehta', grade: 'G12A', score: '98.4%', medal: 'gold' as const },
  { name: 'Sarah Khan', grade: 'G10B', score: '97.2%', medal: 'silver' as const },
  { name: 'Leo Das', grade: 'G8C', score: '96.8%', medal: 'bronze' as const },
];

export const attendanceSummary = { present: 1174, absent: 52, late: 22, leave: 0, rate: '94.8%' };

export interface ClassAttendanceRow {
  class: string;
  grade: string;
  present: number;
  absent: number;
  rate: number;
  alert: boolean;
}

export const classAttendance: ClassAttendanceRow[] = [
  { class: 'G6A', grade: 'Grade 1', present: 38, absent: 2, rate: 95, alert: false },
  { class: 'G6B', grade: 'Grade 1', present: 36, absent: 4, rate: 90, alert: false },
  { class: 'G7A', grade: 'Grade 2', present: 40, absent: 0, rate: 100, alert: false },
  { class: 'G8B', grade: 'Grade 3', present: 35, absent: 3, rate: 92, alert: false },
  { class: 'G9C', grade: 'Grade 4', present: 30, absent: 10, rate: 75, alert: true },
  { class: 'Staff', grade: 'Staff', present: 87, absent: 5, rate: 95, alert: false },
];

export interface ChronicAbsentee {
  id: string;
  name: string;
  class: string;
  days: number;
}

export const chronicAbsentees: ChronicAbsentee[] = [
  { id: 'ca1', name: 'Riya Sharma', class: '9B', days: 5 },
  { id: 'ca2', name: 'Arjun Mehta', class: '7A', days: 4 },
  { id: 'ca3', name: 'Priya Nair', class: '11C', days: 4 },
];

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

export const commItems: CommItem[] = [
  {
    id: 'c1',
    channel: 'Announcements',
    category: 'Holiday',
    title: 'Academic Council Meeting',
    body: 'All department heads must attend the academic council meeting on Friday at 3:00 PM in the conference hall.',
    time: '2h ago',
    period: 'today',
    audience: 'Staff',
    audienceKey: 'Staff',
    views: 248,
    notifications: 32,
    pinned: true,
  },
  {
    id: 'c2',
    channel: 'Announcements',
    category: 'Academic',
    title: 'Term 2 Result Upload',
    body: 'Class teachers must upload Term 2 marks by 6:00 PM today. Late submissions require HOD approval.',
    time: 'Yesterday',
    period: 'week',
    audience: 'Staff + Parents',
    audienceKey: 'Staff',
    views: 412,
    notifications: 18,
  },
  {
    id: 'c3',
    channel: 'Announcements',
    category: 'Alert',
    title: 'Weather Update — Early Dismissal',
    body: 'Due to heavy rainfall warning, after-school activities are cancelled. Buses will depart at 1:30 PM.',
    time: '3 days ago',
    period: 'week',
    audience: 'All Students',
    audienceKey: 'Students',
    views: 890,
    notifications: 210,
  },
  {
    id: 'c4',
    channel: 'Circulars',
    category: 'Academic',
    title: 'CIR/2026/0042 — Exam Conduct Guidelines',
    body: 'Invigilation duties, seating plans, and malpractice reporting procedures for the final term examinations.',
    time: 'Yesterday',
    period: 'week',
    audience: 'Staff',
    audienceKey: 'Staff',
    views: 156,
    notifications: 0,
  },
  {
    id: 'c5',
    channel: 'Circulars',
    category: 'General',
    title: 'CIR/2026/0041 — Dress Code Reminder',
    body: 'Students must wear full school uniform including ID cards. Non-compliance will be noted in discipline records.',
    time: '5 days ago',
    period: 'week',
    audience: 'Parents',
    audienceKey: 'Parents',
    views: 620,
    notifications: 45,
  },
  {
    id: 'c6',
    channel: 'Notice Board',
    category: 'Holiday',
    title: 'Annual Day — Jun 28',
    body: 'Mandatory attendance for all teaching staff. Rehearsal schedule attached on the staff portal.',
    time: '1 week ago',
    period: 'month',
    audience: 'Staff',
    audienceKey: 'Staff',
    views: 0,
    notifications: 0,
    pinned: true,
  },
  {
    id: 'c7',
    channel: 'Notice Board',
    category: 'Academic',
    title: 'Science Exhibition Entries',
    body: 'Grades 6–10 may submit project titles to the science department by 15 June.',
    time: '2 weeks ago',
    period: 'month',
    audience: 'Students',
    audienceKey: 'Students',
    views: 0,
    notifications: 0,
  },
  {
    id: 'c8',
    channel: 'SMS/Email',
    category: 'Alert',
    title: 'Fee Reminder — Term II',
    body: 'Automated SMS sent to 342 parent accounts. Email digest scheduled for 6:00 PM.',
    time: 'Today',
    period: 'today',
    audience: 'Parents',
    audienceKey: 'Parents',
    views: 0,
    notifications: 342,
  },
  {
    id: 'c9',
    channel: 'SMS/Email',
    category: 'General',
    title: 'Staff Meeting Reminder',
    body: 'Email blast to 92 staff members for Monday briefing at 9:00 AM.',
    time: '2 days ago',
    period: 'week',
    audience: 'Staff',
    audienceKey: 'Staff',
    views: 0,
    notifications: 92,
  },
];

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

export const recentMessages: CommMessage[] = [
  {
    id: 'm1',
    name: 'Dr. Meena Iyer',
    role: 'Vice Principal',
    preview: 'Board inspection checklist is ready for review...',
    body: 'Board inspection checklist is ready for review. Please confirm the slot for the walkthrough tomorrow at 11 AM.',
    time: '10:30 AM',
    unread: true,
  },
  {
    id: 'm2',
    name: 'Sanjay Rao',
    role: 'Accounts Head',
    preview: 'Term II collection report attached...',
    body: 'Term II collection report attached. We are at 78% collection with 42 defaulters in Grades 9–12.',
    time: 'Yesterday',
    unread: false,
  },
  {
    id: 'm3',
    name: 'Priya Nair',
    role: 'HOD Science',
    preview: 'Lab safety audit completed...',
    body: 'Lab safety audit completed. Two minor compliance items need sign-off before the CBSE visit.',
    time: '2 days ago',
    unread: false,
  },
];

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

export const initialUpcomingExams: UpcomingExam[] = [
  {
    id: 'e1',
    title: 'Grade 10 Pre-Board',
    grades: 'Grade 10',
    term: 'Term 2',
    status: 'DRAFT',
    dates: 'Jun 12–24, 2026',
    startDate: '2026-06-12',
    endDate: '2026-06-24',
    subjects: 'Math, Science, English',
  },
  {
    id: 'e2',
    title: 'Grade 12 Mid-Term',
    grades: 'Grade 12',
    term: 'Term 2',
    status: 'IN PROGRESS',
    dates: 'Jun 5–20, 2026',
    startDate: '2026-06-05',
    endDate: '2026-06-20',
    subjects: 'Physics, Chemistry, Biology',
  },
  {
    id: 'e3',
    title: 'Grade 8 Unit Test',
    grades: 'Grade 8',
    term: 'Term 2',
    status: 'COMPLETED',
    dates: 'May 20–25, 2026',
    startDate: '2026-05-20',
    endDate: '2026-05-25',
    subjects: 'All core subjects',
  },
];

export const initialExamSchedule: ExamScheduleRow[] = [
  { id: 'es1', examId: 'e1', date: 'Jun 12', subject: 'Mathematics', class: '10-A', time: '09:00 AM' },
  { id: 'es2', examId: 'e1', date: 'Jun 13', subject: 'English', class: '10-B', time: '09:00 AM' },
  { id: 'es3', examId: 'e2', date: 'Jun 15', subject: 'Physics', class: '12-A', time: '01:30 PM' },
  { id: 'es4', examId: 'e2', date: 'Jun 16', subject: 'Chemistry', class: '12-B', time: '09:00 AM' },
  { id: 'es5', examId: 'e3', date: 'May 20', subject: 'Science', class: '8-A', time: '09:00 AM' },
];

export const initialResultsStatus: ClassResultStatus[] = [
  { grade: 'Grade 6', percent: 100, label: 'Published', sectionsPublished: 4, totalSections: 4 },
  { grade: 'Grade 7', percent: 100, label: 'Published', sectionsPublished: 4, totalSections: 4 },
  { grade: 'Grade 8', percent: 75, label: 'In Review', sectionsPublished: 3, totalSections: 4 },
  { grade: 'Grade 9', percent: 50, label: 'Pending', sectionsPublished: 2, totalSections: 4 },
  { grade: 'Grade 10', percent: 100, label: 'Published', sectionsPublished: 4, totalSections: 4 },
  { grade: 'Grade 11', percent: 25, label: 'Pending', sectionsPublished: 1, totalSections: 4 },
  { grade: 'Grade 12', percent: 0, label: 'Not Started', sectionsPublished: 0, totalSections: 4 },
];

export const initialPassFailDistribution: PassFailDistribution[] = [
  { grade: 'Grade 6', passPercent: 96, failPercent: 4, passCount: 154, failCount: 6 },
  { grade: 'Grade 7', passPercent: 94, failPercent: 6, passCount: 150, failCount: 10 },
  { grade: 'Grade 8', passPercent: 91, failPercent: 9, passCount: 145, failCount: 14 },
  { grade: 'Grade 9', passPercent: 88, failPercent: 12, passCount: 140, failCount: 19 },
  { grade: 'Grade 10', passPercent: 86, failPercent: 14, passCount: 137, failCount: 22 },
  { grade: 'Grade 11', passPercent: 89, failPercent: 11, passCount: 124, failCount: 15 },
  { grade: 'Grade 12', passPercent: 92, failPercent: 8, passCount: 118, failCount: 10 },
];

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
  total: '₹ 18,42,500',
  progress: 76.2,
  target: '₹ 22,00,000',
  balance: '₹ 3,57,500',
  month: 'June 2025',
};

export const feeCategories = [
  { label: 'Tuition', amount: '₹ 12,40,000', percent: 65, color: '#3b82f6' },
  { label: 'Transport', amount: '₹ 2,80,000', percent: 25, color: '#a855f7' },
  { label: 'Hostel', amount: '₹ 1,90,000', percent: 18, color: '#fb923c' },
  { label: 'Activities', amount: '₹ 72,500', percent: 10, color: '#0fbd83' },
];

export interface FeeDefaulter {
  id: string;
  name: string;
  class: string;
  amount: string;
  days: number;
  reminded?: boolean;
}

export const feeDefaulters: FeeDefaulter[] = [
  { id: 'fd1', name: 'Aditi Rao', class: 'G8A', amount: '₹ 24,500', days: 45 },
  { id: 'fd2', name: 'Vikram Singh', class: 'G11B', amount: '₹ 18,000', days: 32 },
  { id: 'fd3', name: 'Rohan Das', class: 'G9C', amount: '₹ 15,200', days: 28 },
  { id: 'fd4', name: 'Meera Nair', class: 'G10A', amount: '₹ 31,000', days: 52 },
  { id: 'fd5', name: 'Karan Mehta', class: 'G7B', amount: '₹ 12,400', days: 21 },
];

export const allFeeDefaulters: FeeDefaulter[] = [
  ...feeDefaulters,
  { id: 'fd6', name: 'Sneha Pillai', class: 'G12A', amount: '₹ 42,000', days: 60 },
  { id: 'fd7', name: 'Arjun Khanna', class: 'G6A', amount: '₹ 9,800', days: 14 },
  { id: 'fd8', name: 'Divya Reddy', class: 'G11A', amount: '₹ 22,500', days: 38 },
];

export interface ConcessionRequest {
  id: string;
  student: string;
  class: string;
  amount: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

export const concessionRequests: ConcessionRequest[] = [
  { id: 'cr1', student: 'Aisha Khan', class: 'G9B', amount: '₹ 8,000', reason: 'Sibling discount — 2nd child', status: 'pending' },
  { id: 'cr2', student: 'Ravi Kumar', class: 'G10C', amount: '₹ 12,000', reason: 'Staff ward concession', status: 'pending' },
  { id: 'cr3', student: 'Neha Singh', class: 'G8A', amount: '₹ 5,500', reason: 'Merit scholarship partial waiver', status: 'approved' },
];

export interface ScholarshipEntry {
  id: string;
  student: string;
  class: string;
  type: string;
  amount: string;
  term: string;
}

export const scholarshipList: ScholarshipEntry[] = [
  { id: 'sch1', student: 'Arjun Mehta', class: 'G12A', type: 'Academic Excellence', amount: '₹ 25,000', term: 'Term 2' },
  { id: 'sch2', student: 'Priya Nair', class: 'G11C', type: 'Sports Quota', amount: '₹ 15,000', term: 'Term 2' },
  { id: 'sch3', student: 'Leo Das', class: 'G10B', type: 'Need-based', amount: '₹ 20,000', term: 'Term 2' },
  { id: 'sch4', student: 'Sarah Khan', class: 'G9A', type: 'Academic Excellence', amount: '₹ 18,000', term: 'Term 2' },
];

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

export const leaveRequests: PrincipalLeaveRequest[] = [
  { id: 'lr1', name: 'Anil Kumar', dept: 'Teaching Staff', type: 'Sick Leave', days: '2 Days', dates: 'Jun 4–5', submitted: '2h ago', status: 'pending' },
  { id: 'lr2', name: 'Sarah Jenkins', dept: 'Admin', type: 'Casual Leave', days: '1 Day', dates: 'Jun 6', submitted: '5h ago', status: 'pending' },
  { id: 'lr3', name: 'Raj Patel', dept: 'Teaching Staff', type: 'Earned Leave', days: '5 Days', dates: 'Jun 10–14', submitted: '1d ago', status: 'pending' },
  { id: 'lr4', name: 'Meena Iyer', dept: 'Teaching Staff', type: 'Sick Leave', days: '3 Days', dates: 'Jun 3–5', submitted: '3h ago', status: 'pending' },
  { id: 'lr5', name: 'Sanjay Rao', dept: 'Accounts', type: 'Casual Leave', days: '1 Day', dates: 'Jun 8', submitted: 'Yesterday', status: 'pending' },
  { id: 'lr6', name: 'Priya Nair', dept: 'Science', type: 'Earned Leave', days: '2 Days', dates: 'Jun 4–5', submitted: '2d ago', status: 'approved', onLeaveToday: true },
  { id: 'lr7', name: 'Vikram Singh', dept: 'Mathematics', type: 'Sick Leave', days: '1 Day', dates: 'Jun 4', submitted: '3d ago', status: 'approved', onLeaveToday: true },
  { id: 'lr8', name: 'Deepa Menon', dept: 'English', type: 'Casual Leave', days: '1 Day', dates: 'Jun 2', submitted: '4d ago', status: 'approved' },
  { id: 'lr9', name: 'Arjun Khanna', dept: 'PE', type: 'Earned Leave', days: '4 Days', dates: 'Jun 1–4', submitted: '5d ago', status: 'approved', onLeaveToday: true },
  { id: 'lr10', name: 'Kavita Shah', dept: 'Admin', type: 'Casual Leave', days: '2 Days', dates: 'May 28–29', submitted: '1w ago', status: 'rejected' },
  { id: 'lr11', name: 'Rohan Das', dept: 'Support', type: 'Sick Leave', days: '1 Day', dates: 'May 30', submitted: '1w ago', status: 'rejected' },
];

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

export const reportCategories: ReportCategory[] = [
  { id: 'academic', label: 'Academic', count: 4, color: '#3b82f6', icon: 'school', description: 'Grades, exams, and term performance' },
  { id: 'attendance', label: 'Attendance', count: 3, color: '#0fbd83', icon: 'fact-check', description: 'Student and staff attendance trends' },
  { id: 'finance', label: 'Finance', count: 3, color: '#ff9500', icon: 'payments', description: 'Fee collection and defaulters' },
  { id: 'staff', label: 'Staff', count: 2, color: '#a855f7', icon: 'badge', description: 'Staffing, leave, and appraisals' },
  { id: 'custom', label: 'Custom', count: 2, color: '#6b7280', icon: 'tune', description: 'Build your own report snapshot' },
];

export interface QuickDownloadReport {
  id: string;
  title: string;
  format: 'PDF';
  date: string;
  category: ReportCategoryId;
  summary: string;
}

export const quickDownloads: QuickDownloadReport[] = [
  { id: 'qd1', title: 'Monthly Attendance Report', format: 'PDF', date: 'June 2026', category: 'attendance', summary: 'Campus-wide attendance for June including class-wise breakdown.' },
  { id: 'qd2', title: 'Term 2 Academic Report', format: 'PDF', date: 'June 2026', category: 'academic', summary: 'Grade averages, pass rates, and topper summary for Term 2.' },
  { id: 'qd3', title: 'Fee Collection Summary', format: 'PDF', date: 'June 2026', category: 'finance', summary: 'Term II collection progress, category split, and defaulter snapshot.' },
];

export interface ScheduledReport {
  id: string;
  title: string;
  schedule: string;
  frequency: string;
  nextRun: string;
  enabled: boolean;
  category: ReportCategoryId;
}

export const scheduledReports: ScheduledReport[] = [
  { id: 'sr1', title: 'Weekly Enrollment Update', schedule: 'Every Monday · 09:00 AM', frequency: 'Weekly', nextRun: 'Next Monday, 09:00 AM', enabled: true, category: 'academic' },
  { id: 'sr2', title: 'Monthly Expense Analysis', schedule: '1st of month · 08:00 AM', frequency: 'Monthly', nextRun: 'July 1, 08:00 AM', enabled: false, category: 'finance' },
  { id: 'sr3', title: 'Daily Attendance Digest', schedule: 'Weekdays · 04:00 PM', frequency: 'Daily', nextRun: 'Today, 04:00 PM', enabled: true, category: 'attendance' },
];

export const categoryReportCatalog: Record<ReportCategoryId, { title: string; description: string }[]> = {
  academic: [
    { title: 'Term Performance Summary', description: 'Grade-wise averages and pass rates' },
    { title: 'Exam Results Overview', description: 'Published vs pending result uploads' },
    { title: 'Topper List — Term 2', description: 'School toppers by grade band' },
    { title: 'CBSE Compliance Pack', description: 'Academic records readiness checklist' },
  ],
  attendance: [
    { title: 'Daily Attendance Snapshot', description: 'Present, absent, and late counts' },
    { title: 'Chronic Absentee List', description: 'Students below attendance threshold' },
    { title: 'Staff Attendance Log', description: 'Teaching staff presence this month' },
  ],
  finance: [
    { title: 'Fee Collection Dashboard', description: 'Target vs collected with category split' },
    { title: 'Defaulter Register', description: 'Outstanding fees by class' },
    { title: 'Scholarship & Concession Summary', description: 'Approved waivers this term' },
  ],
  staff: [
    { title: 'Staff Directory Export', description: 'Department-wise staff listing' },
    { title: 'Leave & Appraisal Status', description: 'Pending leave and appraisal queue' },
  ],
  custom: [
    { title: 'Executive Snapshot', description: 'Cross-domain KPI summary for board review' },
    { title: 'Principal Briefing Pack', description: 'Customizable weekly briefing PDF' },
  ],
};

export const timetableClasses = ['Grade 10A', '10B', '11A', '11B', '12C'] as const;

export const timetableConflicts = [
  'Anil Rao Tue P3 assigned to 2 classes',
  'Room 204 Mon P5 double-booked',
];

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

export const initialPrincipalNotifications: PrincipalNotificationSeed[] = [
  {
    id: 'pn1',
    title: 'Leave Approval Pending',
    body: 'Anil Kumar · Sick Leave 14–15 Nov',
    type: 'approval',
    time: '1h ago',
    groupLabel: 'TODAY',
    actions: ['Approve', 'Review'],
  },
  {
    id: 'pn2',
    title: 'Exam Schedule Draft',
    body: 'Grade 10 Pre-Board awaiting principal sign-off',
    type: 'urgent',
    time: '2h ago',
    groupLabel: 'TODAY',
    actions: ['Review', 'Dismiss'],
  },
  {
    id: 'pn3',
    title: 'Attendance Alert — G9C',
    body: 'Class attendance dropped to 75% today',
    type: 'academic',
    time: '3h ago',
    groupLabel: 'TODAY',
  },
  {
    id: 'pn4',
    title: 'Fee Defaulter Threshold',
    body: '23 students crossed 30-day overdue mark',
    type: 'system',
    time: 'Yesterday',
    groupLabel: 'YESTERDAY',
  },
  {
    id: 'pn5',
    title: 'Substitute Required',
    body: 'Sanjay Rao absent — 2 periods uncovered',
    type: 'staff',
    time: 'Yesterday',
    groupLabel: 'YESTERDAY',
    actions: ['Assign', 'Dismiss'],
  },
];
