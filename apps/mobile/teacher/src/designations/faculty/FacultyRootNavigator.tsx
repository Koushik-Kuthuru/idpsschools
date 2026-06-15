import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';
import { MainTabs } from '@/navigation/MainTabs';
import {
  AttendanceOverviewScreen,
  AttendanceClassesScreen,
  AttendanceHistoryScreen,
  SubmittedAttendanceScreen,
  AttendanceSuccessScreen,
  TakeAttendanceScreen,
  SwipeAttendanceScreen,
  AttendanceReviewScreen,
  SwipeStackAttendanceScreen,
  ClassTimetableScreen,
  ExamScheduleScreen,
  ExamDutiesScreen,
  MyClassesListScreen,
  MyStudentsListScreen,
  StudentDetailScreen,
  AssignmentsListScreen,
  CreateAssignmentScreen,
  AssignmentSubmissionsReviewScreen,
  MarksOverviewScreen,
  MarksClassesScreen,
  MarksHistoryScreen,
  MarksSuccessScreen,
  EnterMarksScreen,
  AnnouncementsManagementScreen,
  MessagesListScreen,
  ChatDetailScreen,
  LeaveManagementScreen,
  ApplyLeaveScreen,
  LeaveBalanceScreen,
  SalaryOverviewScreen,
  SalaryHistoryScreen,
  SyncQueueScreen,
  TeachingPerformanceScreen,
  FacultyMenuScreen,
  TeacherProfileScreen,
  TeacherSettingsScreen,
  NotificationsAlertsScreen,
  ChangePasswordScreen,
  OfflineModeIndicatorScreen,
} from '@/screens';
import type { RootStackParamList } from '@/types/navigation';

if (Platform.OS === 'web') {
  enableScreens(false);
}

const Stack = createNativeStackNavigator<RootStackParamList>();

/** Faculty designation navigator — teacher, principal, coordinator, admin, manager, etc. */
export function FacultyRootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="FacultyMenu" component={FacultyMenuScreen} />
      <Stack.Screen name="AttendanceOverview" component={AttendanceOverviewScreen} />
      <Stack.Screen name="AttendanceClasses" component={AttendanceClassesScreen} />
      <Stack.Screen name="AttendanceHistory" component={AttendanceHistoryScreen} />
      <Stack.Screen name="SubmittedAttendance" component={SubmittedAttendanceScreen} />
      <Stack.Screen name="AttendanceSuccess" component={AttendanceSuccessScreen} />
      <Stack.Screen name="TakeAttendance" component={TakeAttendanceScreen} />
      <Stack.Screen name="SwipeAttendance" component={SwipeAttendanceScreen} />
      <Stack.Screen name="AttendanceReview" component={AttendanceReviewScreen} />
      <Stack.Screen name="SwipeStackAttendance" component={SwipeStackAttendanceScreen} />
      <Stack.Screen name="ClassTimetable" component={ClassTimetableScreen} />
      <Stack.Screen name="ExamSchedule" component={ExamScheduleScreen} />
      <Stack.Screen name="ExamDuties" component={ExamDutiesScreen} />
      <Stack.Screen name="MyClassesList" component={MyClassesListScreen} />
      <Stack.Screen name="MyStudentsList" component={MyStudentsListScreen} />
      <Stack.Screen name="StudentDetail" component={StudentDetailScreen} />
      <Stack.Screen name="AssignmentsList" component={AssignmentsListScreen} />
      <Stack.Screen name="CreateAssignment" component={CreateAssignmentScreen} />
      <Stack.Screen name="AssignmentSubmissionsReview" component={AssignmentSubmissionsReviewScreen} />
      <Stack.Screen name="MarksOverview" component={MarksOverviewScreen} />
      <Stack.Screen name="MarksClasses" component={MarksClassesScreen} />
      <Stack.Screen name="MarksHistory" component={MarksHistoryScreen} />
      <Stack.Screen name="MarksSuccess" component={MarksSuccessScreen} />
      <Stack.Screen name="EnterMarks" component={EnterMarksScreen} />
      <Stack.Screen name="AnnouncementsManagement" component={AnnouncementsManagementScreen} />
      <Stack.Screen name="MessagesList" component={MessagesListScreen} />
      <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
      <Stack.Screen name="LeaveManagement" component={LeaveManagementScreen} />
      <Stack.Screen name="ApplyLeave" component={ApplyLeaveScreen} />
      <Stack.Screen name="LeaveBalance" component={LeaveBalanceScreen} />
      <Stack.Screen name="SalaryOverview" component={SalaryOverviewScreen} />
      <Stack.Screen name="SalaryHistory" component={SalaryHistoryScreen} />
      <Stack.Screen name="SyncQueue" component={SyncQueueScreen} />
      <Stack.Screen name="TeachingPerformance" component={TeachingPerformanceScreen} />
      <Stack.Screen name="TeacherProfile" component={TeacherProfileScreen} />
      <Stack.Screen name="TeacherSettings" component={TeacherSettingsScreen} />
      <Stack.Screen name="NotificationsAlerts" component={NotificationsAlertsScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="OfflineModeIndicator" component={OfflineModeIndicatorScreen} />
    </Stack.Navigator>
  );
}
