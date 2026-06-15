import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  AcademicSettingsScreen,
  CircularsScreen,
  NotificationsScreen,
  ReportsAnalyticsScreen,
  StudentAnalyticsScreen,
  TeacherPerformanceScreen,
  TimetableOverviewScreen,
  ExamTimetableScreen,
} from '../screens';
import { AcademicThemeProvider } from '../theme';
import { MainTabs } from './MainTabs';
import type { RootStackParamList } from './types';
import { ChangePasswordScreen } from '@/screens/ChangePasswordScreen/ChangePasswordScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AcademicDirectorNavigator() {
  return (
    <AcademicThemeProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Circulars" component={CircularsScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="ReportsAnalytics" component={ReportsAnalyticsScreen} />
        <Stack.Screen name="StudentAnalytics" component={StudentAnalyticsScreen} />
        <Stack.Screen name="TeacherPerformance" component={TeacherPerformanceScreen} />
        <Stack.Screen name="TimetableOverview" component={TimetableOverviewScreen} />
        <Stack.Screen name="ExamTimetable" component={ExamTimetableScreen} />
        <Stack.Screen name="Settings" component={AcademicSettingsScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      </Stack.Navigator>
    </AcademicThemeProvider>
  );
}
