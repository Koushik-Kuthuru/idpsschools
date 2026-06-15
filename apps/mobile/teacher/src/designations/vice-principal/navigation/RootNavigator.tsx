import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  AcademicPerformanceScreen,
  CampusOperationsScreen,
  DepartmentCoordinationScreen,
  ExaminationOversightScreen,
  LeaveApprovalsScreen,
  NotificationsScreen,
  ParentCommunicationScreen,
  StaffManagementScreen,
  StudentDisciplineScreen,
  ChangePasswordScreen,
} from '../screens';
import { VicePrincipalThemeProvider } from '../theme';
import { MainTabs } from './MainTabs';
import type { VicePrincipalStackParamList } from './types';

const Stack = createNativeStackNavigator<VicePrincipalStackParamList>();

export function VicePrincipalNavigator() {
  return (
    <VicePrincipalThemeProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="AcademicPerformance" component={AcademicPerformanceScreen} />
        <Stack.Screen name="StaffManagement" component={StaffManagementScreen} />
        <Stack.Screen name="CampusOperations" component={CampusOperationsScreen} />
        <Stack.Screen name="DepartmentCoordination" component={DepartmentCoordinationScreen} />
        <Stack.Screen name="ExaminationOversight" component={ExaminationOversightScreen} />
        <Stack.Screen name="LeaveApprovals" component={LeaveApprovalsScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="ParentCommunication" component={ParentCommunicationScreen} />
        <Stack.Screen name="StudentDiscipline" component={StudentDisciplineScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      </Stack.Navigator>
    </VicePrincipalThemeProvider>
  );
}
