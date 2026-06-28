import type { MaterialIcons } from '@expo/vector-icons';
import type { AcademicStackRoute } from '../navigation/types';

export const academicHealth = {
  score: 0,
  growth: '',
  attendance: '0%',
  examPass: '0%',
  syllabus: '0%',
  teacherScore: '0/5',
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

export const initialPriorityActions: PriorityAction[] = [];

/** @deprecated use initialPriorityActions */
export const priorityActions = initialPriorityActions;

export const curriculumSubjects: { name: string; icon: string; progress: number; target: number; status: string; tone: 'primary' | 'tertiary' }[] = [];

export const curriculumTerms: {
  id: string;
  termLabel: string;
  month: string;
  year: number;
  academicYear: string;
  period: string;
  targetDate: string;
  shortLabel: string;
}[] = [];

export const curriculumCoverage = { done: 0, active: 0, pending: 0, target: 0, goalGap: 0 };

export const curriculumBySubject: {
  id: string;
  name: string;
  icon: 'calculate' | 'science' | 'auto-stories';
  hod: string;
  progress: number;
  status: 'ON TRACK' | 'LAGGING';
  teacherCount: number;
  chaptersDone: number;
  chaptersTotal: number;
  classes: { name: string; progress: number }[];
  teachers: string[];
  topics: string[];
  lastUpdated: string;
}[] = [];

export const curriculumByClass: {
  id: string;
  name: string;
  classTeacher: string;
  progress: number;
  status: 'ON TRACK' | 'LAGGING';
  subjects: { name: string; progress: number; teacher: string }[];
}[] = [];

export const curriculumByTeacher: {
  id: string;
  name: string;
  subject: string;
  role: string;
  progress: number;
  status: 'ON TRACK' | 'LAGGING';
  classes: string[];
  chaptersDone: number;
  chaptersTotal: number;
}[] = [];

export const curriculumCalendarEvents: { date: string; label: string; tone: 'primary' | 'tertiary' | 'error' }[] = [];

export const departmentPerformance: { name: string; percent: number }[] = [];

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

export const initialDepartments: DepartmentItem[] = [];

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

export const initialCirculars: CircularItem[] = [];

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
}[] = [];

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
> = {};

export const examHallTickets: Record<string, { grade: string; issued: number; total: number; status: 'ready' | 'pending' }[]> = {};

export const examUploadTeachers: {
  id: string;
  name: string;
  subject: string;
  status: 'uploaded' | 'pending' | 'overdue';
  uploadedAt?: string;
}[] = [];

export const notifications: { id: string; title: string; body: string; time: string; type: 'urgent' | 'reminder' | 'info' }[] = [];

export const notificationGroups: {
  label: string;
  items: {
    id: string;
    title: string;
    body: string;
    time: string;
    type: 'urgent' | 'reminder' | 'info';
    category: 'results' | 'approvals' | 'exam' | 'curriculum';
    urgent?: boolean;
    reminder?: boolean;
    actions?: [string, string];
  }[];
}[] = [];

export const reportCategories: {
  title: string;
  count: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  route?: AcademicStackRoute;
}[] = [];

export const recentReports: { title: string; generated: string; period: string; type: 'pdf' | 'excel' }[] = [];

export const quickExports: { label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [];

export const studentKpis: { label: string; value: string; delta: string; negative?: boolean }[] = [];

export const gradePerformance: { label: string; percent: number }[] = [];

export const atRiskStudents: { name: string; className: string; risk: string; avatar: string }[] = [];

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

export const departmentTeacherLabels: Record<string, string> = {};

export const teachers: TeacherPerformanceItem[] = [];

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

export const timetableConflict = { title: '', detail: '', classId: '', periodLabel: '' };

export const timetableSubstitutions: { from: string; to: string; detail: string }[] = [];

export const timetableByClass: TimetableClassEntry[] = [];

export const timetableByTeacher: TimetableTeacherEntry[] = [];

export const timetableBySubject: TimetableSubjectEntry[] = [];

/** @deprecated use timetableByClass */
export const timetableClasses = timetableByClass;
