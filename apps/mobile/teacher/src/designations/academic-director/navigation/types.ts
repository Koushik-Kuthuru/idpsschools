export type AcademicTab = 'home' | 'staff' | 'curriculum' | 'exams' | 'profile';

export type RootStackParamList = {
  MainTabs: undefined;
  Circulars: undefined;
  Notifications: undefined;
  ReportsAnalytics: undefined;
  StudentAnalytics: undefined;
  TeacherPerformance: { departmentId?: string } | undefined;
  TimetableOverview: undefined;
  ExamTimetable: { examId: string };
  Settings: undefined;
  ChangePassword: undefined;
};

/** Stack screens navigable without route params */
export type AcademicStackRoute = Exclude<keyof RootStackParamList, 'MainTabs' | 'ExamTimetable'>;

export type MainTabParamList = {
  Dashboard: undefined;
  Staff: undefined;
  Curriculum: undefined;
  Exams: undefined;
  Profile: undefined;
};
