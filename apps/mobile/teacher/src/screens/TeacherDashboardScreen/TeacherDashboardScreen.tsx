import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DashboardCard, DashboardTopBar, DashboardWelcomeSection, FacultyStatusBanner, ScreenLayout } from '@/components';
import { mockApi } from '@/services/api';
import { useAuthStore } from '@/store';
import type { RootStackParamList } from '@/types';
import { colors } from '@/theme';
import { getRoleConfig } from '@/config/roleConfig';
import { handleBottomNavPress } from '@/utils/navigationHelpers';
import { styles } from './TeacherDashboardScreen.styles';

const TASK_PALETTES: Record<string, { iconColor: string; iconBgColor: string; accentColor: string }> = {
  fact_check: { iconColor: colors.primary, iconBgColor: `${colors.primary}14`, accentColor: colors.primary },
  grade: { iconColor: '#d97706', iconBgColor: '#fef3c7', accentColor: '#d97706' },
  event_busy: { iconColor: '#2563eb', iconBgColor: '#dbeafe', accentColor: '#2563eb' },
  campaign: { iconColor: '#db2777', iconBgColor: '#fce7f3', accentColor: '#db2777' },
  sync: { iconColor: colors.secondary, iconBgColor: colors.secondaryContainer, accentColor: colors.secondary },
};

const DEFAULT_TASK_PALETTE = {
  iconColor: colors.primary,
  iconBgColor: `${colors.primary}14`,
  accentColor: colors.primary,
};

function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity onPress={onAction} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function TeacherDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const teacher = useAuthStore((s) => s.user);
  const [overview, setOverview] = useState<Awaited<ReturnType<typeof mockApi.dashboard.getOverview>> | null>(null);
  const [tasks, setTasks] = useState<Awaited<ReturnType<typeof mockApi.faculty.getPendingTasks>>>([]);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const refreshDashboard = useCallback(() => {
    mockApi.dashboard.getOverview().then(setOverview);
    mockApi.notifications.list().then((items) => {
      setUnreadNotifications(items.filter((n) => !n.read).length);
    });
    mockApi.faculty.getPendingTasks().then((items) => {
      setTasks(items);
      setTasksLoaded(true);
    });
  }, []);

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  useFocusEffect(
    useCallback(() => {
      refreshDashboard();
      mockApi.teacher.getProfile().then((profile) => {
        useAuthStore.getState().setUser(profile);
      });
    }, [refreshDashboard]),
  );

  const openTask = (action: string) => {
    if (action === 'AttendanceClasses') navigation.navigate('AttendanceClasses');
    else if (action === 'MarksClasses') navigation.navigate('MarksClasses');
    else if (action === 'LeaveManagement') navigation.navigate('LeaveManagement');
    else if (action === 'AnnouncementsManagement') navigation.navigate('AnnouncementsManagement');
    else if (action === 'SyncQueue') navigation.navigate('SyncQueue');
    else navigation.navigate('FacultyMenu');
  };

  const roleConfig = teacher ? getRoleConfig(teacher.designation) : null;
  const subtitle = teacher
    ? roleConfig?.showClassSubtitle && teacher.className
      ? `${teacher.role} · Class ${teacher.className}`
      : teacher.role
    : 'Staff';

  const nextClass = overview?.nextClass ?? 'Mathematics (9:00 AM) — Room 102';
  const displayName = teacher?.name ?? 'Staff';

  return (
    <ScreenLayout
      scroll
      header={
        <DashboardTopBar
          name={displayName}
          avatarUrl={teacher?.avatarUrl}
          notificationCount={unreadNotifications}
          onProfilePress={() => navigation.navigate('TeacherProfile')}
          onNotificationPress={() => navigation.navigate('NotificationsAlerts')}
        />
      }
      bottomNav={{
        activeTab: 'home',
        onTabPress: (tab) => handleBottomNavPress(navigation, tab),
      }}
    >
      <DashboardWelcomeSection name={displayName} subtitle={subtitle} />
      <View style={styles.content}>
        <FacultyStatusBanner onViewQueue={() => navigation.navigate('SyncQueue')} pendingCount={3} />

        <SectionHeader title="Today's overview" />
        <View style={styles.overviewStack}>
          <DashboardCard
            icon="menu_book"
            iconColor={colors.primary}
            iconBgColor={`${colors.primary}14`}
            accentColor={colors.primary}
            title={`${overview?.classesToday ?? 6} classes today`}
            subtitle={`Next up · ${nextClass}`}
            badge="Active"
            onPress={() => navigation.navigate('ClassTimetable')}
          />
          <DashboardCard
            icon="person_check"
            iconColor={colors.secondary}
            iconBgColor={colors.secondaryContainer}
            accentColor={colors.secondary}
            title={`Class ${teacher?.className ?? '10-A'} attendance`}
            subtitle={`${overview?.absentToday ?? 3} students absent today`}
            onPress={() => navigation.navigate('AttendanceClasses')}
          />
        </View>

        {tasksLoaded && tasks.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pending tasks</Text>
              <View style={styles.taskCountBadge}>
                <Text style={styles.taskCountText}>{tasks.length}</Text>
              </View>
            </View>
            <View style={styles.tasksStack}>
              {tasks.map((t) => {
                const palette = TASK_PALETTES[t.icon] ?? DEFAULT_TASK_PALETTE;
                return (
                  <DashboardCard
                    key={t.id}
                    icon={t.icon}
                    iconColor={palette.iconColor}
                    iconBgColor={palette.iconBgColor}
                    accentColor={palette.accentColor}
                    title={t.title}
                    subtitle={t.subtitle}
                    badge="Pending"
                    onPress={() => openTask(t.action)}
                  />
                );
              })}
            </View>
          </>
        ) : null}
      </View>
    </ScreenLayout>
  );
}
