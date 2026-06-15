import type { MaterialIcons } from '@expo/vector-icons';
import type { AcademicStackRoute } from '../navigation/types';

export interface AcademicModuleItem {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  sub: string;
  route: AcademicStackRoute;
}

export const ACADEMIC_MODULES: AcademicModuleItem[] = [
  { icon: 'assessment', label: 'Reports & Analytics', sub: '36 reports available', route: 'ReportsAnalytics' },
  { icon: 'bar-chart', label: 'Student Analytics', sub: '5,248 students tracked', route: 'StudentAnalytics' },
  { icon: 'rate-review', label: 'Teacher Performance', sub: '148 teachers monitored', route: 'TeacherPerformance' },
  { icon: 'calendar-today', label: 'Timetable Overview', sub: '1 conflict detected', route: 'TimetableOverview' },
  { icon: 'campaign', label: 'Circulars', sub: '12 sent this month', route: 'Circulars' },
];
