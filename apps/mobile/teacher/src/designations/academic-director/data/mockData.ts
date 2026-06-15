import type { MaterialIcons } from '@expo/vector-icons';
import type { AcademicStackRoute } from '../navigation/types';

export const academicHealth = {
  score: 87,
  growth: '+2.4 pts growth',
  attendance: '94.2%',
  examPass: '88.7%',
  syllabus: '76.4%',
  teacherScore: '4.3/5',
};

export type PriorityActionTone = 'error' | 'tertiary' | 'warning';
export type PriorityActionKind = 'exam-upload' | 'hod-reminder' | 'timetable-conflict';

export interface PriorityAction {
  id: string;
  title: string;
  sub: string;
  tone: PriorityActionTone;
  actionLabel: string;
  kind: PriorityActionKind;
  icon: keyof typeof MaterialIcons.glyphMap;
  examId?: string;
}

export const initialPriorityActions: PriorityAction[] = [
  {
    id: '1',
    title: 'Unit Test 3 results not uploaded',
    sub: 'Due: 2h ago · 12 teachers pending',
    tone: 'error',
    actionLabel: 'Upload',
    kind: 'exam-upload',
    examId: '2',
    icon: 'upload-file',
  },
  {
    id: '2',
    title: '3 HODs missed monthly report',
    sub: 'Science, English & Social Studies',
    tone: 'tertiary',
    actionLabel: 'Remind',
    kind: 'hod-reminder',
    icon: 'notifications-active',
  },
  {
    id: '3',
    title: 'Timetable conflict: Gr 10B P4',
    sub: 'Science · Room 204 double-booked',
    tone: 'error',
    actionLabel: 'Resolve',
    kind: 'timetable-conflict',
    icon: 'event-busy',
  },
];

/** @deprecated use initialPriorityActions */
export const priorityActions = initialPriorityActions;

export const curriculumSubjects = [
  { name: 'Mathematics', icon: 'functions', progress: 78, target: 75, status: 'ON TRACK', tone: 'primary' as const },
  { name: 'Science', icon: 'science', progress: 64, target: 72, status: 'BEHIND', tone: 'tertiary' as const },
];

export const curriculumTerms = [
  {
    id: 'term2',
    termLabel: 'Term II',
    month: 'June',
    year: 2025,
    academicYear: '2024–25',
    period: 'Apr 1 – Jun 30, 2025',
    targetDate: 'June 30, 2025',
    shortLabel: 'Term II · June 2025',
  },
  {
    id: 'term1',
    termLabel: 'Term I',
    month: 'March',
    year: 2025,
    academicYear: '2024–25',
    period: 'Jan 1 – Mar 31, 2025',
    targetDate: 'March 31, 2025',
    shortLabel: 'Term I · March 2025',
  },
];

export const curriculumCoverage = {
  done: 76,
  active: 14,
  pending: 10,
  target: 85,
  goalGap: 9,
};

export const curriculumBySubject = [
  {
    id: 'math',
    name: 'Mathematics',
    icon: 'calculate' as const,
    hod: 'Dr. Sharma',
    progress: 88,
    status: 'ON TRACK' as const,
    teacherCount: 4,
    chaptersDone: 18,
    chaptersTotal: 24,
    classes: [
      { name: 'Grade 10A', progress: 88 },
      { name: 'Grade 9B', progress: 72 },
      { name: 'Grade 8C', progress: 54 },
    ],
    teachers: ['Dr. Sharma', 'Mr. Patel', 'Ms. Nair', 'Mr. Khan'],
    topics: ['Algebra II', 'Trigonometry', 'Statistics', 'Geometry'],
    lastUpdated: 'Jun 4, 2025',
  },
  {
    id: 'science',
    name: 'Science',
    icon: 'science' as const,
    hod: 'Mrs. Verma',
    progress: 74,
    status: 'LAGGING' as const,
    teacherCount: 5,
    chaptersDone: 15,
    chaptersTotal: 22,
    classes: [
      { name: 'Grade 10B', progress: 74 },
      { name: 'Grade 9A', progress: 68 },
      { name: 'Grade 8A', progress: 82 },
    ],
    teachers: ['Mrs. Verma', 'Mr. Iyer', 'Dr. Gupta', 'Ms. Roy', 'Mr. Das'],
    topics: ['Physics: Motion', 'Chemistry: Acids', 'Biology: Cells', 'Lab Practicals'],
    lastUpdated: 'Jun 3, 2025',
  },
  {
    id: 'english',
    name: 'English',
    icon: 'auto-stories' as const,
    hod: 'Ms. Kapoor',
    progress: 92,
    status: 'ON TRACK' as const,
    teacherCount: 3,
    chaptersDone: 20,
    chaptersTotal: 22,
    classes: [
      { name: 'Grade 10A', progress: 94 },
      { name: 'Grade 9C', progress: 90 },
      { name: 'Grade 8B', progress: 91 },
    ],
    teachers: ['Ms. Kapoor', 'Mr. Thomas', 'Mrs. Singh'],
    topics: ['Prose & Poetry', 'Grammar', 'Creative Writing', 'Comprehension'],
    lastUpdated: 'Jun 4, 2025',
  },
];

export const curriculumByClass = [
  {
    id: 'grade-10a',
    name: 'Grade 10A',
    classTeacher: 'Mr. Patel',
    progress: 86,
    status: 'ON TRACK' as const,
    subjects: [
      { name: 'Mathematics', progress: 88, teacher: 'Dr. Sharma' },
      { name: 'Science', progress: 79, teacher: 'Mrs. Verma' },
      { name: 'English', progress: 94, teacher: 'Ms. Kapoor' },
      { name: 'Social Studies', progress: 81, teacher: 'Mr. Thomas' },
    ],
  },
  {
    id: 'grade-10b',
    name: 'Grade 10B',
    classTeacher: 'Mrs. Verma',
    progress: 74,
    status: 'LAGGING' as const,
    subjects: [
      { name: 'Mathematics', progress: 70, teacher: 'Mr. Khan' },
      { name: 'Science', progress: 74, teacher: 'Mrs. Verma' },
      { name: 'English', progress: 78, teacher: 'Mrs. Singh' },
      { name: 'Social Studies', progress: 72, teacher: 'Mr. Thomas' },
    ],
  },
  {
    id: 'grade-9b',
    name: 'Grade 9B',
    classTeacher: 'Ms. Nair',
    progress: 68,
    status: 'LAGGING' as const,
    subjects: [
      { name: 'Mathematics', progress: 72, teacher: 'Ms. Nair' },
      { name: 'Science', progress: 65, teacher: 'Mr. Iyer' },
      { name: 'English', progress: 71, teacher: 'Mr. Thomas' },
      { name: 'Social Studies', progress: 64, teacher: 'Prof. Sarah Miller' },
    ],
  },
  {
    id: 'grade-8c',
    name: 'Grade 8C',
    classTeacher: 'Dr. Sharma',
    progress: 58,
    status: 'LAGGING' as const,
    subjects: [
      { name: 'Mathematics', progress: 54, teacher: 'Dr. Sharma' },
      { name: 'Science', progress: 60, teacher: 'Dr. Gupta' },
      { name: 'English', progress: 62, teacher: 'Mrs. Singh' },
      { name: 'Social Studies', progress: 56, teacher: 'Robert Miller' },
    ],
  },
];

export const curriculumByTeacher = [
  {
    id: 'dr-sharma',
    name: 'Dr. Sharma',
    subject: 'Mathematics',
    role: 'HOD',
    progress: 88,
    status: 'ON TRACK' as const,
    classes: ['Grade 10A', 'Grade 9B', 'Grade 8C'],
    chaptersDone: 18,
    chaptersTotal: 24,
  },
  {
    id: 'mrs-verma',
    name: 'Mrs. Verma',
    subject: 'Science',
    role: 'HOD',
    progress: 74,
    status: 'LAGGING' as const,
    classes: ['Grade 10B', 'Grade 9A', 'Grade 8A'],
    chaptersDone: 15,
    chaptersTotal: 22,
  },
  {
    id: 'ms-kapoor',
    name: 'Ms. Kapoor',
    subject: 'English',
    role: 'HOD',
    progress: 92,
    status: 'ON TRACK' as const,
    classes: ['Grade 10A', 'Grade 9C', 'Grade 8B'],
    chaptersDone: 20,
    chaptersTotal: 22,
  },
  {
    id: 'robert-miller',
    name: 'Robert Miller',
    subject: 'Social Studies',
    role: 'TGT',
    progress: 58,
    status: 'LAGGING' as const,
    classes: ['Grade 8C', 'Grade 9B'],
    chaptersDone: 10,
    chaptersTotal: 20,
  },
];

export const curriculumCalendarEvents = [
  { date: 'Jun 4', label: 'Term 2 mid-review', tone: 'primary' as const },
  { date: 'Jun 12', label: 'Science syllabus audit', tone: 'tertiary' as const },
  { date: 'Jun 20', label: 'Mid-term exams begin', tone: 'error' as const },
  { date: 'Jun 30', label: '85% coverage target', tone: 'primary' as const },
];

export const departmentPerformance = [
  { name: 'Mathematics', percent: 88 },
  { name: 'English', percent: 84 },
  { name: 'Science', percent: 81 },
  { name: 'Social Studies', percent: 78 },
];

export interface DepartmentItem {
  id: string;
  name: string;
  hod: string;
  score: number;
  teachers: number;
  coverage: number;
  avg: number;
  icon: 'calculate' | 'menu-book' | 'science' | 'public' | 'translate' | 'computer';
  monthlyReportSubmitted: boolean;
  resultsUploaded: number;
  resultsTotal: number;
  reportRequested?: boolean;
  reminderSent?: boolean;
}

export const initialDepartments: DepartmentItem[] = [
  {
    id: 'math',
    name: 'Mathematics',
    hod: 'Dr. Ramesh Kumar',
    score: 88,
    teachers: 18,
    coverage: 78,
    avg: 82,
    icon: 'calculate',
    monthlyReportSubmitted: true,
    resultsUploaded: 6,
    resultsTotal: 6,
  },
  {
    id: 'english',
    name: 'English',
    hod: 'Prof. Sarah Miller',
    score: 74,
    teachers: 14,
    coverage: 65,
    avg: 79,
    icon: 'menu-book',
    monthlyReportSubmitted: false,
    resultsUploaded: 4,
    resultsTotal: 6,
  },
  {
    id: 'science',
    name: 'Science',
    hod: 'Mrs. Verma',
    score: 81,
    teachers: 16,
    coverage: 74,
    avg: 80,
    icon: 'science',
    monthlyReportSubmitted: true,
    resultsUploaded: 5,
    resultsTotal: 6,
  },
  {
    id: 'social',
    name: 'Social Studies',
    hod: 'Mr. Thomas',
    score: 79,
    teachers: 12,
    coverage: 71,
    avg: 77,
    icon: 'public',
    monthlyReportSubmitted: false,
    resultsUploaded: 3,
    resultsTotal: 5,
  },
  {
    id: 'hindi',
    name: 'Hindi',
    hod: 'Mrs. Singh',
    score: 83,
    teachers: 10,
    coverage: 76,
    avg: 81,
    icon: 'translate',
    monthlyReportSubmitted: false,
    resultsUploaded: 4,
    resultsTotal: 5,
  },
  {
    id: 'cs',
    name: 'Computer Science',
    hod: 'Mr. Patel',
    score: 86,
    teachers: 8,
    coverage: 82,
    avg: 84,
    icon: 'computer',
    monthlyReportSubmitted: true,
    resultsUploaded: 5,
    resultsTotal: 5,
  },
];

/** @deprecated use initialDepartments */
export const departments = initialDepartments;

export type CircularStatus = 'published' | 'draft' | 'scheduled';

export interface CircularItem {
  id: string;
  title: string;
  body: string;
  audience: string;
  time: string;
  tag: string;
  status: CircularStatus;
  read?: number;
  total?: number;
  scheduledFor?: string;
}

export const initialCirculars: CircularItem[] = [
  {
    id: '1',
    title: 'Urgent: School Inspection Tomorrow',
    body: 'All department heads must ensure classrooms, labs, and records are inspection-ready by 8:00 AM. Submit readiness checklist to the Academic Office before end of day.',
    audience: 'Teachers, HODs',
    time: 'Today, 09:30 AM',
    tag: 'Urgent',
    status: 'published',
    read: 142,
    total: 180,
  },
  {
    id: '2',
    title: 'Revised Term 2 Schedule',
    body: 'Term 2 examination and activity calendar has been updated. Parents and students are requested to review the revised dates for unit tests and PTM sessions.',
    audience: 'Parents, Students',
    time: 'Yesterday',
    tag: 'Academic',
    status: 'published',
    read: 450,
    total: 1200,
  },
  {
    id: '3',
    title: 'Faculty Meeting Agenda',
    body: 'Draft agenda: curriculum review, examination protocol, and sports day planning. Please add department points before publishing.',
    audience: 'All Staff',
    time: 'Draft',
    tag: 'Draft',
    status: 'draft',
  },
  {
    id: '4',
    title: 'PTM Reminder — Grade 10',
    body: 'Parent-Teacher meeting for Grade 10 is scheduled for Friday. Class teachers to share individual student progress sheets.',
    audience: 'Parents',
    time: 'Scheduled',
    tag: 'Academic',
    status: 'scheduled',
    scheduledFor: 'Jun 13, 10:00 AM',
  },
  {
    id: '5',
    title: 'Sports Day Volunteer Call',
    body: 'Teachers required for event coordination, registration desks, and student supervision. Confirm availability with the Sports Department.',
    audience: 'Teachers',
    time: 'Scheduled',
    tag: 'General',
    status: 'scheduled',
    scheduledFor: 'Jun 15, 08:30 AM',
  },
];

/** @deprecated use initialCirculars */
export const circulars = initialCirculars;

export type ExamStatus = 'Upcoming' | 'Ongoing' | 'Results Pending' | 'Completed';
export type ExamGradeBand = 'all-grades' | 'primary' | 'secondary' | 'senior';
export type ExamType = 'mid-term' | 'unit-test' | 'practical';

export const examGradeFilters = [
  { key: 'all', label: 'All Grades' },
  { key: 'primary', label: 'Primary (1–5)' },
  { key: 'secondary', label: 'Secondary (6–8)' },
  { key: 'senior', label: 'Senior (9–12)' },
  { key: 'all-grades', label: 'School-wide' },
] as const;

export const examTypeFilters = [
  { key: 'all', label: 'All Types' },
  { key: 'mid-term', label: 'Mid-Term' },
  { key: 'unit-test', label: 'Unit Test' },
  { key: 'practical', label: 'Practical' },
] as const;

export const examSortOptions = [
  { key: 'date-desc', label: 'Date (Newest first)' },
  { key: 'date-asc', label: 'Date (Oldest first)' },
  { key: 'name', label: 'Name (A–Z)' },
] as const;

export const exams: {
  id: string;
  title: string;
  status: ExamStatus;
  dates: string;
  gradeBand: ExamGradeBand;
  examType: ExamType;
  sortOrder: number;
  grades?: string;
  duration?: string;
  subjects?: string[];
  progress?: number;
  uploadDone?: number;
  uploadTotal?: number;
  passRate?: string;
  avg?: string;
  toppers?: string;
  prepChecklist?: { label: string; done: boolean }[];
}[] = [
  {
    id: '1',
    title: 'Mid-Term Examination 2025',
    status: 'Upcoming',
    dates: 'Jun 20 – Jun 30, 2025',
    gradeBand: 'all-grades',
    examType: 'mid-term',
    sortOrder: 4,
    duration: '3 hrs',
    grades: 'Grade 1–12',
    subjects: ['Mathematics', 'Science', 'English', 'History'],
    progress: 70,
    prepChecklist: [
      { label: 'Timetable', done: true },
      { label: 'Hall Tickets', done: true },
      { label: 'Question Papers', done: false },
      { label: 'Invigilators', done: false },
    ],
  },
  {
    id: '2',
    title: 'Unit Test 3 — Secondary',
    status: 'Results Pending',
    dates: 'May 15 – May 22, 2025',
    gradeBand: 'secondary',
    examType: 'unit-test',
    sortOrder: 2,
    grades: 'Grade 6–8',
    uploadDone: 18,
    uploadTotal: 30,
    progress: 60,
  },
  {
    id: '3',
    title: 'Unit Test 2 — Primary',
    status: 'Completed',
    dates: 'Apr 8 – Apr 15, 2025',
    gradeBand: 'primary',
    examType: 'unit-test',
    sortOrder: 1,
    grades: 'Grade 1–5',
    passRate: '88.7%',
    avg: '74.2%',
    toppers: '24',
  },
  {
    id: '4',
    title: 'Annual Practical Exams',
    status: 'Ongoing',
    dates: 'Jun 4 – Jun 12, 2025',
    gradeBand: 'senior',
    examType: 'practical',
    sortOrder: 3,
    grades: 'Grade 9–12',
    progress: 45,
  },
];

export const examTimetables: Record<
  string,
  {
    examTitle: string;
    dates: string;
    venue: string;
    days: {
      dateLabel: string;
      weekday: string;
      slots: {
        time: string;
        subject: string;
        grades: string;
        hall: string;
        invigilator: string;
        duration: string;
      }[];
    }[];
  }
> = {
  '1': {
    examTitle: 'Mid-Term Examination 2025',
    dates: 'Jun 20 – Jun 30, 2025',
    venue: 'Main Campus · Blocks A & B',
    days: [
      {
        dateLabel: 'Jun 20',
        weekday: 'Friday',
        slots: [
          { time: '09:00 AM', subject: 'Mathematics', grades: 'Grade 10', hall: 'Hall A', invigilator: 'Dr. Sharma', duration: '3 hrs' },
          { time: '09:00 AM', subject: 'Mathematics', grades: 'Grade 8', hall: 'Hall C', invigilator: 'Mr. Khan', duration: '3 hrs' },
          { time: '02:00 PM', subject: 'English', grades: 'Grade 9', hall: 'Hall B', invigilator: 'Ms. Kapoor', duration: '3 hrs' },
        ],
      },
      {
        dateLabel: 'Jun 21',
        weekday: 'Saturday',
        slots: [
          { time: '09:00 AM', subject: 'Science', grades: 'Grade 10', hall: 'Hall A', invigilator: 'Mrs. Verma', duration: '3 hrs' },
          { time: '09:00 AM', subject: 'Science', grades: 'Grade 7', hall: 'Hall D', invigilator: 'Mr. Iyer', duration: '3 hrs' },
          { time: '02:00 PM', subject: 'Social Studies', grades: 'Grade 9', hall: 'Hall B', invigilator: 'Mr. Patel', duration: '3 hrs' },
        ],
      },
      {
        dateLabel: 'Jun 23',
        weekday: 'Monday',
        slots: [
          { time: '09:00 AM', subject: 'History', grades: 'Grade 11', hall: 'Hall A', invigilator: 'Robert Miller', duration: '3 hrs' },
          { time: '02:00 PM', subject: 'Physics', grades: 'Grade 12', hall: 'Lab Block', invigilator: 'David Chen', duration: '3 hrs' },
        ],
      },
    ],
  },
  '4': {
    examTitle: 'Annual Practical Exams',
    dates: 'Jun 4 – Jun 12, 2025',
    venue: 'Science Labs · Sports Complex',
    days: [
      {
        dateLabel: 'Jun 4',
        weekday: 'Wednesday',
        slots: [
          { time: '10:00 AM', subject: 'Physics Practical', grades: 'Grade 12-A', hall: 'Lab 1', invigilator: 'David Chen', duration: '2 hrs' },
          { time: '10:00 AM', subject: 'Chemistry Practical', grades: 'Grade 12-B', hall: 'Lab 2', invigilator: 'Mrs. Verma', duration: '2 hrs' },
        ],
      },
      {
        dateLabel: 'Jun 5',
        weekday: 'Thursday',
        slots: [
          { time: '10:00 AM', subject: 'Biology Practical', grades: 'Grade 11-A', hall: 'Lab 3', invigilator: 'Dr. Gupta', duration: '2 hrs' },
          { time: '02:00 PM', subject: 'Computer Science', grades: 'Grade 11-B', hall: 'IT Lab', invigilator: 'Mr. Das', duration: '2 hrs' },
        ],
      },
    ],
  },
};

export const examHallTickets: Record<string, { grade: string; issued: number; total: number; status: 'ready' | 'pending' }[]> = {
  '1': [
    { grade: 'Grade 10', issued: 186, total: 186, status: 'ready' },
    { grade: 'Grade 9', issued: 172, total: 178, status: 'pending' },
    { grade: 'Grade 8', issued: 164, total: 164, status: 'ready' },
    { grade: 'Grade 11–12', issued: 210, total: 224, status: 'pending' },
  ],
};

export const examUploadTeachers = [
  { id: '1', name: 'Dr. Sharma', subject: 'Mathematics', status: 'uploaded' as const, uploadedAt: 'May 20, 2:14 PM' },
  { id: '2', name: 'Mrs. Verma', subject: 'Science', status: 'uploaded' as const, uploadedAt: 'May 21, 10:05 AM' },
  { id: '3', name: 'Ms. Kapoor', subject: 'English', status: 'uploaded' as const, uploadedAt: 'May 19, 4:30 PM' },
  { id: '4', name: 'Mr. Patel', subject: 'Social Studies', status: 'pending' as const },
  { id: '5', name: 'Robert Miller', subject: 'History', status: 'pending' as const },
  { id: '6', name: 'Anita Rao', subject: 'English', status: 'pending' as const },
  { id: '7', name: 'David Chen', subject: 'Physics', status: 'overdue' as const },
];

export const notifications = [
  { id: '1', title: 'Results Upload Overdue', body: '12 teachers pending Unit Test 3 upload', time: '2h ago', type: 'urgent' as const },
  { id: '2', title: 'HOD Report Pending', body: 'Dr. Ramesh Kumar monthly report', time: '4h ago', type: 'reminder' as const },
  { id: '3', title: 'Timetable Updated', body: 'Grade 10B Period 4 conflict resolved', time: 'Yesterday', type: 'info' as const },
];

export const notificationGroups = [
  {
    label: 'Today',
    items: [
      {
        id: '1',
        title: 'Results Upload Overdue',
        body: '12 teachers have not uploaded Unit Test 3 results. Deadline was Jun 8.',
        time: '2h ago',
        type: 'urgent' as const,
        category: 'results' as const,
        urgent: true,
        actions: ['Review List', 'Dismiss'] as [string, string],
      },
      {
        id: '2',
        title: 'HOD Report Pending',
        body: 'Dr. Ramesh Kumar (Math HOD) has not submitted the monthly department report.',
        time: '4h ago',
        type: 'reminder' as const,
        category: 'approvals' as const,
        reminder: true,
      },
    ],
  },
  {
    label: 'Yesterday',
    items: [
      {
        id: '3',
        title: 'Timetable Updated',
        body: 'Grade 10B Period 4 conflict resolved. Substitute assigned for Science.',
        time: 'Yesterday',
        type: 'info' as const,
        category: 'exam' as const,
      },
      {
        id: '4',
        title: 'Curriculum Review Complete',
        body: 'Term 2 syllabus coverage report is ready for Mathematics department.',
        time: 'Yesterday',
        type: 'info' as const,
        category: 'curriculum' as const,
      },
    ],
  },
];

export const reportCategories: {
  title: string;
  count: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  route?: AcademicStackRoute;
}[] = [
  { title: 'Academic Performance', count: '8', icon: 'bar-chart', route: 'StudentAnalytics' },
  { title: 'Teacher Analytics', count: '6', icon: 'supervisor-account', route: 'TeacherPerformance' },
  { title: 'Curriculum Reports', count: '5', icon: 'menu-book' },
  { title: 'Exam & Results', count: '7', icon: 'assessment' },
  { title: 'Student Reports', count: '10', icon: 'school', route: 'StudentAnalytics' },
  { title: 'Compliance & Audit', count: '4', icon: 'playlist-add-check' },
];

export const recentReports = [
  { title: 'Annual Performance Summary', generated: 'Jun 9, 2025 · 2:45 PM', period: 'May 2025', type: 'pdf' as const },
  { title: 'Teacher Attendance Log', generated: 'Jun 8, 2025 · 10:12 AM', period: 'June 2025', type: 'excel' as const },
];

export const quickExports: { label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { label: 'Attendance Summary', icon: 'fact-check' },
  { label: 'Result Sheet', icon: 'assignment-turned-in' },
  { label: 'Teacher Report', icon: 'person-search' },
];

export const studentKpis = [
  { label: 'Total Students', value: '5,248', delta: '+124 new' },
  { label: 'Avg Attendance', value: '94.2%', delta: '+0.4%' },
  { label: 'Avg Pass Rate', value: '88.7%', delta: '+1.2%' },
  { label: 'At-Risk Students', value: '312', delta: '-18', negative: true },
];

export const gradePerformance = [
  { label: 'Grades 1-5', percent: 94 },
  { label: 'Grades 6-8', percent: 82 },
  { label: 'Grades 9-10', percent: 76 },
  { label: 'Grades 11-12', percent: 89 },
];

export const atRiskStudents = [
  {
    name: 'Arav Sharma',
    className: 'Class 9-C',
    risk: 'Failing Math',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAT_hOwJQCFTca-z1WKYiOj0UKEC67WycU2pyV6FPjB37adhop4arkcUm8T3N2jd42lSzwB5QVRVwrCAh9PHnjKxHyf4YVZdUE3Wqzul5_F_uHrO3F3Jqc6gwJats0ESW0I_aDY_OABj9iysZWeLzqIBvQEVyPMy0GB-Z2JnhpCUaUgC5WK0lpy7TMrgm9FeUb2hHPikKzuE9iM0B-FDmX__r94_5BJs3aAqsN_CWSLhs4geQgmUetNpx8x8_9BwYhXl9AR60FEnu5O',
  },
  {
    name: 'Priya Reddy',
    className: 'Class 11-A',
    risk: 'Low Attendance',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA9-vy-VH_1BVECFyfVym0gmDJnCXQenl8pqqdgmaUJM50d9xuaF51L0n8Fd3MxdsgtAgS4uG1DeRSqjTYpAmTrm4XW7lW4KK3WSjB1yOdiQpydKTcT1G-Xls9-RUtBgz9kLdcMOTWTAqJtJKG5Eq5sxN41C8da6QuWT0sSt-OCplKNmQoMXuoMO-RP4waJ7ZV-qeyCGKrkFvoTer9DUQXDj2U4u35Uw95rtKXFfozfPPWYTG6hLRix20WoXC9TvHv_C7nEcotupJ-J',
  },
  {
    name: 'Kabir Das',
    className: 'Class 7-B',
    risk: 'Behavior Issue',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB3-9lS_ALJglbnvuVQmuH1uMe6e6fVx2OhC2CZwJd67EOHEpuV4VoVS95Wgm_aKtkWqcDo3KBeU1MgcBBP0RddBIVeryd1qp4f2k1EuNDSRzB3Ns5GhMbdqmjJsv6_977qr9ePo8huJjyIcesCMSxECpOHQZYaWz96LHGPFnun--pXH1A-J9-ttW1vtGF5PE4QFYk-4dLpF5swAPCT15X8BNrvR1iboM6lU5YHBOmEi9tkHun1L4jjpz3zFn7Fil38xfo0b_eCRh85',
  },
];

export interface TeacherPerformanceItem {
  id: string;
  departmentId: string;
  name: string;
  role: string;
  score: number;
  attendance: number;
  syllabus: number;
  studentAvg: string;
  online?: boolean;
  atRisk?: boolean;
  compact?: boolean;
  scoreTone?: 'secondary';
  avatar: string;
}

export const departmentTeacherLabels: Record<string, string> = {
  math: 'Mathematics',
  english: 'English',
  science: 'Science',
  social: 'Social Studies',
  hindi: 'Hindi',
  cs: 'Computer Science',
};

const AVATAR_A =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDf_7UlOYcDgWjo4uc3eYXpkf06t0eXF5n_MUwiHckelHYI4CnSzt9y7ECHIm9ZjHbYAq98MjGlVagWzs2sGgG-BKEwEf9-b1eNFlNShITfNvpPKThqonZSb9zEb9Bg_izd3w72NlYZoQKD_61R_bZQEDNlnSQNc4ZS6-wQd_mrTg_90fnpexuewK43I6qT1uHi3zZJcqkWFlQvCIb-_wUd9q27XxP5Vjcnfv7wnbs-Mdlq57T4JEZ2gJxm1uYCxSH5RTmA2C_9bcm4';
const AVATAR_B =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA3-6aHXySWjuPrtZUiZ3PCONTRO39UdIOQDcqY3O7dhAmEwXwNLRApsKUEgvDST0z3irme0xl8bPrmpqBzxmKNehIHCmFqoOtT1XxUA0CYvCxHUUDm5Njl8RTr2vuVsO-OlxPVjm1YMHxZ8DJWlE05nqb9w8m9kyQAElRrrBXnNp03gDMcaCwauzra8FMl5wco5o63AQCbK2H8Net2D0cHzShtm3hsQnhNY8fer4xv-MlB5i68pZJpc3l0vDhnFLae0EkFilcbhcHM';
const AVATAR_C =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCqtGTh-9g8xUob0Zz331zh7gGqT4sboIYvYRPfhQsiV5k_uGm3gis8LTypscl9yVPe9lGqqQObLQNO2coTyWOd09u536ABEuBxzvtfJo7byOnGIRUkNnELaG9QEWvfx1QETMp4ZXzOsRfLpc_qLIak4C-4hLCG8VrgWmf9JY7Eehhb70TD92iY_0zoF8aRrKFmlbYG6wyHtlKAH172dj3oumceWiNntZ4k60nEFDmG6CmuxYTTPEOeH4W6yfVtP0rzpo7G0JT3Zg9F';
const AVATAR_D =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDl7hzgzbnG-ekhlUdh0wFHkO4fSbSQgbeLI7lrdJdedUNypwLx8kvlIE39sK24fP_6vqp6HsIc5gU2jb-_4pAIEeYRUbffHE0R1ObKbdarDxki38S7sxp795nbjqjIfWxhbnvyLtEt7TVrrtnLJ2Uvv33-pCfZOXZXuwjDrpll-0gDhieSGLeniPtknj65HB_S7hKWr7lnvA5UMOp7ZmQRjR1mOuEY5sTmn9bCI9ElRA8oj-MZoUXDpLdcPbE-g8GLOHP9V8U2alrm';

export const teachers: TeacherPerformanceItem[] = [
  { id: 't-m1', departmentId: 'math', name: 'Dr. Sarah Jenkins', role: 'PGT • Mathematics', score: 94, attendance: 98, syllabus: 88, studentAvg: '91.2', online: true, avatar: AVATAR_A },
  { id: 't-m2', departmentId: 'math', name: 'Dr. Sharma', role: 'HOD • Mathematics', score: 91, attendance: 96, syllabus: 85, studentAvg: '89.4', online: true, avatar: AVATAR_D },
  { id: 't-m3', departmentId: 'math', name: 'Mr. Khan', role: 'TGT • Mathematics', score: 78, attendance: 90, syllabus: 72, studentAvg: '80.1', avatar: AVATAR_B },
  { id: 't-m4', departmentId: 'math', name: 'Ms. Nair', role: 'TGT • Mathematics', score: 82, attendance: 93, syllabus: 76, studentAvg: '81.5', compact: true, avatar: AVATAR_C },
  { id: 't-e1', departmentId: 'english', name: 'Anita Rao', role: 'PRT • English', score: 81, attendance: 92, syllabus: 78, studentAvg: '82.0', compact: true, scoreTone: 'secondary', avatar: AVATAR_C },
  { id: 't-e2', departmentId: 'english', name: 'Ms. Kapoor', role: 'PGT • English', score: 88, attendance: 95, syllabus: 84, studentAvg: '86.3', online: true, avatar: AVATAR_A },
  { id: 't-e3', departmentId: 'english', name: 'Mrs. Reed', role: 'TGT • English', score: 76, attendance: 88, syllabus: 70, studentAvg: '78.2', avatar: AVATAR_B },
  { id: 't-s1', departmentId: 'science', name: 'David Chen', role: 'PGT • Physics', score: 89, attendance: 100, syllabus: 82, studentAvg: '88.5', compact: true, online: true, avatar: AVATAR_D },
  { id: 't-s2', departmentId: 'science', name: 'Mrs. Verma', role: 'HOD • Science', score: 87, attendance: 97, syllabus: 80, studentAvg: '85.0', online: true, avatar: AVATAR_C },
  { id: 't-s3', departmentId: 'science', name: 'Mr. Iyer', role: 'TGT • Chemistry', score: 79, attendance: 91, syllabus: 74, studentAvg: '79.8', avatar: AVATAR_B },
  { id: 't-s4', departmentId: 'science', name: 'Dr. Gupta', role: 'PGT • Biology', score: 84, attendance: 94, syllabus: 77, studentAvg: '83.1', avatar: AVATAR_A },
  { id: 't-so1', departmentId: 'social', name: 'Robert Miller', role: 'TGT • Social Studies', score: 58, attendance: 72, syllabus: 45, studentAvg: '64.5', online: true, atRisk: true, avatar: AVATAR_B },
  { id: 't-so2', departmentId: 'social', name: 'Mr. Thomas', role: 'PGT • History', score: 83, attendance: 90, syllabus: 79, studentAvg: '81.0', avatar: AVATAR_D },
  { id: 't-so3', departmentId: 'social', name: 'Ms. Roy', role: 'TGT • Geography', score: 75, attendance: 86, syllabus: 68, studentAvg: '76.4', compact: true, avatar: AVATAR_C },
  { id: 't-h1', departmentId: 'hindi', name: 'Mrs. Singh', role: 'HOD • Hindi', score: 85, attendance: 93, syllabus: 80, studentAvg: '84.2', online: true, avatar: AVATAR_C },
  { id: 't-h2', departmentId: 'hindi', name: 'Mr. Joshi', role: 'TGT • Hindi', score: 77, attendance: 89, syllabus: 73, studentAvg: '77.5', avatar: AVATAR_B },
  { id: 't-c1', departmentId: 'cs', name: 'Mr. Patel', role: 'PGT • Computer Science', score: 90, attendance: 98, syllabus: 86, studentAvg: '89.0', online: true, avatar: AVATAR_A },
  { id: 't-c2', departmentId: 'cs', name: 'Ms. Desai', role: 'TGT • Computer Science', score: 83, attendance: 92, syllabus: 78, studentAvg: '82.6', compact: true, avatar: AVATAR_D },
];

export function getTeachersForDepartment(departmentId: string): TeacherPerformanceItem[] {
  return teachers.filter((t) => t.departmentId === departmentId);
}

export type TimetablePeriod = {
  label: string;
  subject: string;
  sub?: boolean;
  conflict?: boolean;
  free?: boolean;
};

export type TimetableClassEntry = {
  id: string;
  name: string;
  meta: string;
  dots?: string[];
  periods: TimetablePeriod[];
};

export type TimetableTeacherEntry = {
  id: string;
  name: string;
  role: string;
  meta: string;
  periods: TimetablePeriod[];
};

export type TimetableSubjectEntry = {
  id: string;
  name: string;
  hod: string;
  meta: string;
  periods: { label: string; className: string; teacher: string; sub?: boolean }[];
};

export const timetableConflict = {
  title: '1 Timetable Conflict Detected',
  detail: 'Grade 10B · Period 4 · Math & Science overlap',
  classId: '10b',
  periodLabel: 'P4 · 10:30',
};

export const timetableSubstitutions = [
  { from: 'Mr. Henderson', to: 'Ms. Lane', detail: 'Class 8A · P3 Math' },
  { from: 'Dr. Aris', to: 'Mr. Grant', detail: 'Class 10B · P2 History' },
  { from: 'Mrs. Verma', to: 'Mr. Iyer', detail: 'Class 9C · P5 Science' },
  { from: 'Ms. Kapoor', to: 'Anita Rao', detail: 'Class 11A · P1 English' },
];

const periods8A: TimetablePeriod[] = [
  { label: 'P1 · 08:00', subject: 'Mathematics' },
  { label: 'P2 · 08:50', subject: 'English' },
  { label: 'P3 · 09:40', subject: 'Math (Sub)', sub: true },
  { label: 'P4 · 10:30', subject: 'Science' },
  { label: 'P5 · 11:20', subject: 'Social Studies' },
  { label: 'P6 · 12:10', subject: 'Lunch Break' },
  { label: 'P7 · 01:00', subject: 'Hindi' },
  { label: 'P8 · 01:50', subject: 'Art' },
];

const periods10B: TimetablePeriod[] = [
  { label: 'P1 · 08:00', subject: 'English' },
  { label: 'P2 · 08:50', subject: 'Hist (Sub)', sub: true },
  { label: 'P3 · 09:40', subject: 'Physics' },
  { label: 'P4 · 10:30', subject: 'Math / Science', conflict: true },
  { label: 'P5 · 11:20', subject: 'Chemistry' },
  { label: 'P6 · 12:10', subject: 'Free', free: true },
  { label: 'P7 · 01:00', subject: 'Computer' },
  { label: 'P8 · 01:50', subject: 'PE' },
];

const periods9C: TimetablePeriod[] = [
  { label: 'P1 · 08:00', subject: 'English' },
  { label: 'P2 · 08:50', subject: 'Mathematics' },
  { label: 'P3 · 09:40', subject: 'Science' },
  { label: 'P4 · 10:30', subject: 'Free', free: true },
  { label: 'P5 · 11:20', subject: 'History' },
  { label: 'P6 · 12:10', subject: 'Lunch Break' },
  { label: 'P7 · 01:00', subject: 'Computer' },
  { label: 'P8 · 01:50', subject: '—', free: true },
];

const periods7B: TimetablePeriod[] = [
  { label: 'P1 · 08:00', subject: 'Science' },
  { label: 'P2 · 08:50', subject: 'Mathematics' },
  { label: 'P3 · 09:40', subject: 'English' },
  { label: 'P4 · 10:30', subject: 'Hindi' },
  { label: 'P5 · 11:20', subject: 'Social Studies' },
  { label: 'P6 · 12:10', subject: 'Lunch Break' },
  { label: 'P7 · 01:00', subject: 'Music' },
  { label: 'P8 · 01:50', subject: 'Games' },
];

const periods11A: TimetablePeriod[] = [
  { label: 'P1 · 08:00', subject: 'English (Sub)', sub: true },
  { label: 'P2 · 08:50', subject: 'Physics' },
  { label: 'P3 · 09:40', subject: 'Chemistry' },
  { label: 'P4 · 10:30', subject: 'Mathematics' },
  { label: 'P5 · 11:20', subject: 'Biology' },
  { label: 'P6 · 12:10', subject: 'Lunch Break' },
  { label: 'P7 · 01:00', subject: 'Economics' },
  { label: 'P8 · 01:50', subject: 'Physical Ed.' },
];

export const timetableByClass: TimetableClassEntry[] = [
  {
    id: '8a',
    name: 'Grade 8A',
    meta: '8/8 periods',
    dots: ['#0fbd83', '#0fbd83', '#3b82f6', '#0fbd83', '#0fbd83', '#0fbd83', '#0fbd83', '#0fbd83'],
    periods: periods8A,
  },
  {
    id: '10b',
    name: 'Grade 10B',
    meta: 'Conflict identified',
    periods: periods10B,
  },
  {
    id: '9c',
    name: 'Grade 9C',
    meta: '7/8 periods',
    dots: ['#0fbd83', '#0fbd83', '#0fbd83', '#fbbf24', '#0fbd83', '#0fbd83', '#0fbd83', '#94a3b8'],
    periods: periods9C,
  },
  {
    id: '7b',
    name: 'Grade 7B',
    meta: '8/8 periods',
    dots: ['#0fbd83', '#0fbd83', '#0fbd83', '#0fbd83', '#0fbd83', '#0fbd83', '#0fbd83', '#0fbd83'],
    periods: periods7B,
  },
  {
    id: '11a',
    name: 'Grade 11A',
    meta: '8/8 periods',
    dots: ['#0fbd83', '#0fbd83', '#0fbd83', '#0fbd83', '#0fbd83', '#0fbd83', '#0fbd83', '#0fbd83'],
    periods: periods11A,
  },
];

export const timetableByTeacher: TimetableTeacherEntry[] = [
  {
    id: 'sharma',
    name: 'Dr. Sharma',
    role: 'Mathematics · HOD',
    meta: '6 periods today',
    periods: [
      { label: 'P1 · 08:00', subject: 'Grade 8A' },
      { label: 'P2 · 08:50', subject: 'Grade 9C' },
      { label: 'P3 · 09:40', subject: 'Grade 11A' },
      { label: 'P4 · 10:30', subject: 'Grade 10B', conflict: true },
      { label: 'P5 · 11:20', subject: 'Grade 7B' },
      { label: 'P7 · 01:00', subject: 'Grade 8A' },
    ],
  },
  {
    id: 'verma',
    name: 'Mrs. Verma',
    role: 'Science · HOD',
    meta: '5 periods today',
    periods: [
      { label: 'P1 · 08:00', subject: 'Grade 7B' },
      { label: 'P3 · 09:40', subject: 'Grade 8A' },
      { label: 'P4 · 10:30', subject: 'Grade 10B', conflict: true },
      { label: 'P6 · 12:10', subject: 'Grade 9C' },
      { label: 'P8 · 01:50', subject: 'Grade 11A' },
    ],
  },
  {
    id: 'kapoor',
    name: 'Ms. Kapoor',
    role: 'English · HOD',
    meta: '4 periods today',
    periods: [
      { label: 'P1 · 08:00', subject: 'Grade 11A', sub: true },
      { label: 'P2 · 08:50', subject: 'Grade 8A' },
      { label: 'P5 · 11:20', subject: 'Grade 10B' },
      { label: 'P7 · 01:00', subject: 'Grade 9C' },
    ],
  },
  {
    id: 'chen',
    name: 'David Chen',
    role: 'Physics · PGT',
    meta: '3 periods today',
    periods: [
      { label: 'P3 · 09:40', subject: 'Grade 10B' },
      { label: 'P4 · 10:30', subject: 'Grade 11A' },
      { label: 'P6 · 12:10', subject: 'Grade 7B' },
    ],
  },
];

export const timetableBySubject: TimetableSubjectEntry[] = [
  {
    id: 'math',
    name: 'Mathematics',
    hod: 'Dr. Sharma',
    meta: '6 slots today',
    periods: [
      { label: 'P1 · 08:00', className: 'Grade 8A', teacher: 'Dr. Sharma' },
      { label: 'P2 · 08:50', className: 'Grade 9C', teacher: 'Dr. Sharma' },
      { label: 'P3 · 09:40', className: 'Grade 11A', teacher: 'Dr. Sharma' },
      { label: 'P4 · 10:30', className: 'Grade 10B', teacher: 'Dr. Sharma', sub: true },
      { label: 'P5 · 11:20', className: 'Grade 7B', teacher: 'Mr. Khan' },
      { label: 'P7 · 01:00', className: 'Grade 8A', teacher: 'Dr. Sharma' },
    ],
  },
  {
    id: 'science',
    name: 'Science',
    hod: 'Mrs. Verma',
    meta: '5 slots today',
    periods: [
      { label: 'P1 · 08:00', className: 'Grade 7B', teacher: 'Mrs. Verma' },
      { label: 'P3 · 09:40', className: 'Grade 8A', teacher: 'Mrs. Verma' },
      { label: 'P4 · 10:30', className: 'Grade 10B', teacher: 'Mrs. Verma' },
      { label: 'P6 · 12:10', className: 'Grade 9C', teacher: 'Mr. Iyer', sub: true },
      { label: 'P8 · 01:50', className: 'Grade 11A', teacher: 'Dr. Gupta' },
    ],
  },
  {
    id: 'english',
    name: 'English',
    hod: 'Ms. Kapoor',
    meta: '4 slots today',
    periods: [
      { label: 'P1 · 08:00', className: 'Grade 11A', teacher: 'Anita Rao', sub: true },
      { label: 'P2 · 08:50', className: 'Grade 8A', teacher: 'Ms. Kapoor' },
      { label: 'P5 · 11:20', className: 'Grade 10B', teacher: 'Ms. Kapoor' },
      { label: 'P7 · 01:00', className: 'Grade 9C', teacher: 'Mrs. Singh' },
    ],
  },
  {
    id: 'physics',
    name: 'Physics',
    hod: 'David Chen',
    meta: '3 slots today',
    periods: [
      { label: 'P3 · 09:40', className: 'Grade 10B', teacher: 'David Chen' },
      { label: 'P4 · 10:30', className: 'Grade 11A', teacher: 'David Chen' },
      { label: 'P6 · 12:10', className: 'Grade 7B', teacher: 'David Chen' },
    ],
  },
];

/** @deprecated use timetableByClass */
export const timetableClasses = timetableByClass;
