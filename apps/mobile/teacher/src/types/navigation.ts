import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Splash: undefined;
  TeacherLogin: { passwordUpdated?: boolean } | undefined;
  ForgotPassword: undefined;
  VerifyOtp: { email?: string; flow?: 'login' | 'reset' };
  ResetPassword: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Classes: undefined;
  Attendance: undefined;
  Marks: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  FacultyMenu: undefined;
  AttendanceOverview: undefined;
  AttendanceClasses: undefined;
  AttendanceHistory: undefined;
  SubmittedAttendance: { classId: string };
  AttendanceSuccess: { classId?: string; className?: string; present?: number; absent?: number } | undefined;
  TakeAttendance: undefined;
  SwipeAttendance: { classId?: string; variant?: 1 | 2 } | undefined;
  AttendanceReview: { classId?: string } | undefined;
  SwipeStackAttendance: { variant?: 1 | 2 };
  ClassTimetable: undefined;
  ExamSchedule: undefined;
  ExamDuties: undefined;
  MyClassesList: undefined;
  MyStudentsList: undefined;
  StudentDetail: { studentId: string };
  AssignmentsList: undefined;
  CreateAssignment: undefined;
  AssignmentSubmissionsReview: { assignmentId?: string };
  MarksOverview: undefined;
  MarksClasses: undefined;
  MarksHistory: undefined;
  MarksSuccess: { className?: string; examName?: string } | undefined;
  MarksReview: undefined;
  EnterMarks: { examId?: string; classId?: string } | undefined;
  AnnouncementsManagement: undefined;
  MessagesList: undefined;
  ChatDetail: { conversationId: string };
  LeaveManagement: undefined;
  ApplyLeave: undefined;
  LeaveBalance: undefined;
  SalaryOverview: undefined;
  SalaryHistory: undefined;
  SyncQueue: undefined;
  TeachingPerformance: undefined;
  TeacherProfile: undefined;
  TeacherSettings: undefined;
  NotificationsAlerts: undefined;
  ChangePassword: undefined;
  OfflineModeIndicator: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
