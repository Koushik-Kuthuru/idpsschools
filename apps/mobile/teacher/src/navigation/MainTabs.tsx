import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  TeacherDashboardScreen,
  MyClassesListScreen,
  AttendanceClassesScreen,
  MarksClassesScreen,
  TeacherProfileScreen,
} from '@/screens';
import type { MainTabParamList } from '@/types/navigation';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tab.Screen name="Dashboard" component={TeacherDashboardScreen} />
      <Tab.Screen name="Classes" component={MyClassesListScreen} />
      <Tab.Screen name="Attendance" component={AttendanceClassesScreen} />
      <Tab.Screen name="Marks" component={MarksClassesScreen} />
      <Tab.Screen name="Profile" component={TeacherProfileScreen} />
    </Tab.Navigator>
  );
}
