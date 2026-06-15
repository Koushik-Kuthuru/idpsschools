import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  CalendarEventsScreen,
  DashboardScreen,
  ProfileHubScreen,
  ReportsAnalyticsScreen,
  TimetableSubstitutionScreen,
} from '../screens';
import type { VicePrincipalTabParamList } from './types';

const Tab = createBottomTabNavigator<VicePrincipalTabParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="TimetableSubstitution" component={TimetableSubstitutionScreen} />
      <Tab.Screen name="CalendarEvents" component={CalendarEventsScreen} />
      <Tab.Screen name="ReportsAnalytics" component={ReportsAnalyticsScreen} />
      <Tab.Screen name="Profile" component={ProfileHubScreen} />
    </Tab.Navigator>
  );
}
