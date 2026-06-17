import React, { useCallback, useState } from 'react';
import { View, Text } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppIcon, DashboardCard, DashboardTopBar, FacultyStatusBanner, ScreenLayout } from '@/components';
import { mockApi } from '@/services/api';
import { useAuthStore } from '@/store';
import type { FacultyClass, RootStackParamList } from '@/types';
import { colors } from '@/theme';
import { handleBottomNavPress } from '@/utils/navigationHelpers';
import { styles } from './AttendanceClassesScreen.styles';

function formatClassLabel(name: string) {
  return name.replace(/^CLASS\s/i, 'Class ');
}

function sortClasses(items: FacultyClass[]) {
  return [...items].sort((a, b) => {
    if (a.attendanceStatus !== b.attendanceStatus) {
      return a.attendanceStatus === 'pending' ? -1 : 1;
    }
    return a.period.localeCompare(b.period);
  });
}

export function AttendanceClassesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const teacher = useAuthStore((s) => s.user);
  const [classes, setClasses] = useState<FacultyClass[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useFocusEffect(
    useCallback(() => {
      mockApi.faculty.getClasses().then(setClasses);
      mockApi.notifications.list().then((items) => {
        setUnreadNotifications(items.filter((n) => !n.read).length);
      });
    }, []),
  );

  const displayName = teacher?.name ?? 'Staff';
  const pendingClasses = classes.filter((c) => c.attendanceStatus === 'pending');
  const completedClasses = classes.filter((c) => c.attendanceStatus === 'completed');
  const sortedClasses = sortClasses(classes);

  return (
    <ScreenLayout
      scroll
      header={
        <DashboardTopBar
          title="Attendance"
          name={displayName}
          notificationCount={unreadNotifications}
          onNotificationPress={() => navigation.navigate('NotificationsAlerts')}
          showProfile={false}
        />
      }
      bottomNav={{ activeTab: 'attendance', onTabPress: (t) => handleBottomNavPress(navigation, t) }}
    >
      <View style={styles.summaryBand}>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryChip, pendingClasses.length > 0 && styles.summaryChipWarn]}>
            <AppIcon
              name="fact_check"
              size={16}
              color={pendingClasses.length > 0 ? '#d97706' : colors.secondary}
            />
            <Text style={[styles.summaryChipText, pendingClasses.length > 0 && styles.summaryChipTextWarn]}>
              {pendingClasses.length > 0
                ? `${pendingClasses.length} pending`
                : 'All marked today'}
            </Text>
          </View>
          <View style={styles.summaryChip}>
            <AppIcon name="check_circle" size={16} color={colors.primary} />
            <Text style={styles.summaryChipText}>{completedClasses.length} completed</Text>
          </View>
        </View>
        <Text style={styles.summaryMeta}>
          {pendingClasses.length > 0
            ? 'Tap a pending class to mark attendance'
            : 'View submitted records or attendance history below'}
        </Text>
      </View>

      <View style={styles.content}>
        <FacultyStatusBanner
          onViewQueue={() => navigation.navigate('SyncQueue')}
          pendingCount={3}
        />

        {pendingClasses.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pending</Text>
              <Text style={styles.sectionMeta}>{pendingClasses.length} class{pendingClasses.length === 1 ? '' : 'es'}</Text>
            </View>
            <View style={styles.cardStack}>
              {sortedClasses
                .filter((c) => c.attendanceStatus === 'pending')
                .map((c) => (
                  <DashboardCard
                    key={c.id}
                    icon="person_check"
                    iconColor="#d97706"
                    iconBgColor="#fef3c7"
                    accentColor="#d97706"
                    title={formatClassLabel(c.name)}
                    subtitle={`${c.subject} · ${c.period} · ${c.studentCount} students`}
                    badge="Mark now"
                    onPress={() => navigation.navigate('SwipeAttendance', { classId: c.id })}
                  />
                ))}
            </View>
          </>
        ) : null}

        {completedClasses.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Completed</Text>
              <Text style={styles.sectionMeta}>{completedClasses.length} class{completedClasses.length === 1 ? '' : 'es'}</Text>
            </View>
            <View style={styles.cardStack}>
              {sortedClasses
                .filter((c) => c.attendanceStatus === 'completed')
                .map((c) => (
                  <DashboardCard
                    key={c.id}
                    icon="check_circle"
                    iconColor={colors.primary}
                    iconBgColor={`${colors.primary}14`}
                    accentColor={colors.primary}
                    title={formatClassLabel(c.name)}
                    subtitle={`${c.subject} · ${c.period} · ${c.studentCount} students · ${c.avgAttendance ?? 90}% avg`}
                    badge="Submitted"
                    onPress={() => navigation.navigate('SubmittedAttendance', { classId: c.id })}
                  />
                ))}
            </View>
          </>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>More</Text>
        </View>
        <View style={styles.cardStack}>
          <DashboardCard
            icon="schedule"
            iconColor="#2563eb"
            iconBgColor="#dbeafe"
            accentColor="#2563eb"
            title="Attendance history"
            subtitle="Browse past records and sync status"
            onPress={() => navigation.navigate('AttendanceHistory')}
          />
        </View>
      </View>
    </ScreenLayout>
  );
}
