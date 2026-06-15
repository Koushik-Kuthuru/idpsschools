export type VicePrincipalTab = 'home' | 'schedule' | 'events' | 'data' | 'profile';

export type VicePrincipalTabParamList = {
  Dashboard: undefined;
  TimetableSubstitution: undefined;
  CalendarEvents: undefined;
  ReportsAnalytics: undefined;
  Profile: undefined;
};

import type { NavigatorScreenParams } from '@react-navigation/native';

export type VicePrincipalStackParamList = {
  MainTabs: NavigatorScreenParams<VicePrincipalTabParamList> | undefined;
  AcademicPerformance: undefined;
  StaffManagement: undefined;
  CampusOperations: undefined;
  DepartmentCoordination: undefined;
  ExaminationOversight: undefined;
  LeaveApprovals: undefined;
  Notifications: undefined;
  ParentCommunication: undefined;
  StudentDiscipline: undefined;
  ChangePassword: undefined;
};
