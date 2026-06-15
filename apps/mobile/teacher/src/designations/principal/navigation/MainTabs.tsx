import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  AcademicPerformanceScreen,
  DashboardScreen,
  ProfileHubScreen,
  ReportsAnalyticsScreen,
  StaffManagementScreen,
} from '../screens';
import type { PrincipalTabParamList } from './types';

const Tab = createBottomTabNavigator<PrincipalTabParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="AcademicPerformance" component={AcademicPerformanceScreen} />
      <Tab.Screen name="StaffManagement" component={StaffManagementScreen} />
      <Tab.Screen name="ReportsAnalytics" component={ReportsAnalyticsScreen} />
      <Tab.Screen name="Profile" component={ProfileHubScreen} />
    </Tab.Navigator>
  );
}
