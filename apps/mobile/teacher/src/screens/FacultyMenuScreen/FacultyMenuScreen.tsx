import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppHeader, AppIcon, ScreenLayout } from '@/components';
import { getRoleConfig, type FacultyMenuRoute } from '@/config/roleConfig';
import { useAuthStore } from '@/store';
import type { RootStackParamList } from '@/types';
import { colors, textStyle } from '@/theme';
import { StyleSheet } from 'react-native';
import { borderRadius, spacing } from '@/theme';

const MENU: { icon: string; label: string; route: FacultyMenuRoute }[] = [
  { icon: 'assignment', label: 'Homework / Assignments', route: 'AssignmentsList' },
  { icon: 'event_busy', label: 'Leave Management', route: 'LeaveManagement' },
  { icon: 'payments', label: 'Salary / Payroll', route: 'SalaryOverview' },
  { icon: 'mail', label: 'Messages', route: 'MessagesList' },
  { icon: 'calendar_month', label: 'Timetable', route: 'ClassTimetable' },
  { icon: 'campaign', label: 'Announcements', route: 'AnnouncementsManagement' },
  { icon: 'leaderboard', label: 'Performance', route: 'TeachingPerformance' },
  { icon: 'sync', label: 'Sync Queue', route: 'SyncQueue' },
  { icon: 'settings', label: 'Settings', route: 'TeacherSettings' },
];

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.sm,
  },
  logout: { marginTop: spacing.lg, alignItems: 'center' },
  logoutText: { color: colors.error, fontWeight: '700' },
});

export function FacultyMenuScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const logout = useAuthStore((s) => s.logout);
  const designation = useAuthStore((s) => s.user?.designation ?? 'teacher');
  const allowedRoutes = getRoleConfig(designation).menuRoutes;
  const visibleMenu = MENU.filter((m) => allowedRoutes.includes(m.route));

  return (
    <ScreenLayout scroll header={<AppHeader variant="back" title="MENU" />}>
      <View style={styles.content}>
        {visibleMenu.map((m) => (
          <TouchableOpacity key={m.label} style={styles.row} onPress={() => navigation.navigate(m.route)}>
            <AppIcon name={m.icon} size={22} color={colors.primaryContainer} />
            <Text style={[textStyle('labelLg')]}>{m.label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={styles.logout}
          onPress={async () => {
            await logout();
          }}
        >
          <Text style={[textStyle('headlineSm'), styles.logoutText]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
}
