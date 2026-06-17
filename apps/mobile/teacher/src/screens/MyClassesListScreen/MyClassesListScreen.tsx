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
import { styles } from './MyClassesListScreen.styles';

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

export function MyClassesListScreen() {
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
  const pendingCount = classes.filter((c) => c.attendanceStatus === 'pending').length;
  const totalStudents = classes.reduce((sum, c) => sum + c.studentCount, 0);
  const sortedClasses = sortClasses(classes);

  return (
    <ScreenLayout
      scroll
      header={
        <DashboardTopBar
          title="My Classes"
          name={displayName}
          notificationCount={unreadNotifications}
          onNotificationPress={() => navigation.navigate('NotificationsAlerts')}
          showProfile={false}
        />
      }
      bottomNav={{ activeTab: 'classes', onTabPress: (t) => handleBottomNavPress(navigation, t) }}
    >
      <View style={styles.summaryBand}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryChip}>
            <AppIcon name="groups" size={16} color={colors.primary} />
            <Text style={styles.summaryChipText}>{classes.length} classes</Text>
          </View>
          <View style={[styles.summaryChip, pendingCount > 0 && styles.summaryChipWarn]}>
            <AppIcon name="fact_check" size={16} color={pendingCount > 0 ? '#d97706' : colors.secondary} />
            <Text style={[styles.summaryChipText, pendingCount > 0 && styles.summaryChipTextWarn]}>
              {pendingCount > 0 ? `${pendingCount} attendance pending` : 'Attendance up to date'}
            </Text>
          </View>
        </View>
        <Text style={styles.summaryMeta}>{totalStudents} students across all classes</Text>
      </View>

      <View style={styles.content}>
        <FacultyStatusBanner onViewQueue={() => navigation.navigate('SyncQueue')} pendingCount={3} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your classes</Text>
          <Text style={styles.sectionMeta}>{classes.length} total</Text>
        </View>

        <View style={styles.cardStack}>
          {sortedClasses.map((c) => {
            const isPending = c.attendanceStatus === 'pending';
            return (
              <DashboardCard
                key={c.id}
                icon="menu_book"
                iconColor={isPending ? '#d97706' : colors.primary}
                iconBgColor={isPending ? '#fef3c7' : `${colors.primary}14`}
                accentColor={isPending ? '#d97706' : colors.primary}
                title={formatClassLabel(c.name)}
                subtitle={`${c.subject} · ${c.period} · ${c.studentCount} students · ${c.avgAttendance ?? 90}% avg attendance`}
                badge={isPending ? 'Pending' : 'Active'}
                onPress={() => navigation.navigate('MyStudentsList')}
              />
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Resources</Text>
        </View>

        <View style={styles.cardStack}>
          <DashboardCard
            icon="calendar_today"
            iconColor={colors.primary}
            iconBgColor={`${colors.primary}14`}
            accentColor={colors.primary}
            title="Class timetable"
            subtitle="View your weekly schedule and room assignments"
            onPress={() => navigation.navigate('ClassTimetable')}
          />
          <DashboardCard
            icon="event"
            iconColor="#2563eb"
            iconBgColor="#dbeafe"
            accentColor="#2563eb"
            title="Exam schedule"
            subtitle="Invigilation duties and upcoming exam dates"
            onPress={() => navigation.navigate('ExamDuties')}
          />
        </View>
      </View>
    </ScreenLayout>
  );
}
