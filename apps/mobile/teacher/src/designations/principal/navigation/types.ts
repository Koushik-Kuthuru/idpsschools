export type PrincipalTab = 'home' | 'academics' | 'staff' | 'reports' | 'profile';

export type PrincipalTabParamList = {
  Dashboard: undefined;
  AcademicPerformance: undefined;
  StaffManagement: undefined;
  ReportsAnalytics: undefined;
  Profile: undefined;
};

import type { NavigatorScreenParams } from '@react-navigation/native';

export type PrincipalStackParamList = {
  MainTabs: NavigatorScreenParams<PrincipalTabParamList> | undefined;
  AttendanceOverview: undefined;
  CommunicationAnnouncements: undefined;
  ExamResultsManagement: undefined;
  FeeFinanceOverview: undefined;
  LeaveApprovalsCentre: undefined;
  TimetableManagement: undefined;
  Notifications: undefined;
  ChangePassword: undefined;
};
