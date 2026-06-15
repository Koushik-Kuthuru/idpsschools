import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  DashboardScreen,
  ExaminationCalendarScreen,
  LeaveDutyManagementScreen,
  ProfileHubScreen,
  TimetableManagementScreen,
} from '../screens';
import type { ManagerTabParamList } from './types';

const Tab = createBottomTabNavigator<ManagerTabParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Timetable" component={TimetableManagementScreen} />
      <Tab.Screen name="Calendar" component={ExaminationCalendarScreen} />
      <Tab.Screen name="Tasks" component={LeaveDutyManagementScreen} />
      <Tab.Screen name="Profile" component={ProfileHubScreen} />
    </Tab.Navigator>
  );
}
