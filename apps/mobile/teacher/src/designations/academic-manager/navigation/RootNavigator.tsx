import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  AcademicRecordsScreen,
  CurriculumTrackerScreen,
  NotificationsAlertsScreen,
  ParentCommunicationsScreen,
  ReportsAnalyticsScreen,
  StaffCoordinationScreen,
} from '../screens';
import { MainTabs } from './MainTabs';
import type { ManagerStackParamList } from './types';

const Stack = createNativeStackNavigator<ManagerStackParamList>();

export function AcademicManagerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="AcademicRecords" component={AcademicRecordsScreen} />
      <Stack.Screen name="CurriculumTracker" component={CurriculumTrackerScreen} />
      <Stack.Screen name="NotificationsAlerts" component={NotificationsAlertsScreen} />
      <Stack.Screen name="ParentCommunications" component={ParentCommunicationsScreen} />
      <Stack.Screen name="ReportsAnalytics" component={ReportsAnalyticsScreen} />
      <Stack.Screen name="StaffCoordination" component={StaffCoordinationScreen} />
    </Stack.Navigator>
  );
}
