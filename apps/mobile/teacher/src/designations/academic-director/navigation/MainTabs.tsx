import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  CurriculumTrackerScreen,
  DashboardScreen,
  ExamManagementScreen,
  HodDepartmentScreen,
  ProfileHubScreen,
} from '../screens';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Staff" component={HodDepartmentScreen} />
      <Tab.Screen name="Curriculum" component={CurriculumTrackerScreen} />
      <Tab.Screen name="Exams" component={ExamManagementScreen} />
      <Tab.Screen name="Profile" component={ProfileHubScreen} />
    </Tab.Navigator>
  );
}
