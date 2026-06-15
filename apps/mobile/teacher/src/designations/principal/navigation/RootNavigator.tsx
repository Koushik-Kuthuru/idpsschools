import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  AttendanceOverviewScreen,
  CommunicationAnnouncementsScreen,
  ExamResultsManagementScreen,
  FeeFinanceOverviewScreen,
  LeaveApprovalsCentreScreen,
  ChangePasswordScreen,
  NotificationsScreen,
  TimetableManagementScreen,
} from '../screens';
import { MainTabs } from './MainTabs';
import { PrincipalThemeProvider } from '../theme';
import type { PrincipalStackParamList } from './types';

const Stack = createNativeStackNavigator<PrincipalStackParamList>();

export function PrincipalNavigator() {
  return (
    <PrincipalThemeProvider>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="AttendanceOverview" component={AttendanceOverviewScreen} />
      <Stack.Screen name="CommunicationAnnouncements" component={CommunicationAnnouncementsScreen} />
      <Stack.Screen name="ExamResultsManagement" component={ExamResultsManagementScreen} />
      <Stack.Screen name="FeeFinanceOverview" component={FeeFinanceOverviewScreen} />
      <Stack.Screen name="LeaveApprovalsCentre" component={LeaveApprovalsCentreScreen} />
      <Stack.Screen name="TimetableManagement" component={TimetableManagementScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
    </Stack.Navigator>
    </PrincipalThemeProvider>
  );
}
