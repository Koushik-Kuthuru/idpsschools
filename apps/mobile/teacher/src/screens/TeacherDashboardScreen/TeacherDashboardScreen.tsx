import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppHeader, AppIcon, DashboardCard, DashboardStatCard, FacultyStatusBanner, ScreenLayout } from '@/components';
import { mockApi } from '@/services/api';
import { useAuthStore } from '@/store';
import type { Announcement, RootStackParamList } from '@/types';
import { colors, textStyle } from '@/theme';
import { getRoleConfig } from '@/config/roleConfig';
import { getGreeting } from '@/utils/greeting';
import { handleBottomNavPress } from '@/utils/navigationHelpers';
import { styles } from './TeacherDashboardScreen.styles';

export function TeacherDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const teacher = useAuthStore((s) => s.user);
  const [overview, setOverview] = useState<Awaited<ReturnType<typeof mockApi.dashboard.getOverview>> | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [tasks, setTasks] = useState<Awaited<ReturnType<typeof mockApi.faculty.getPendingTasks>>>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const refreshDashboard = useCallback(() => {
    mockApi.dashboard.getOverview().then(setOverview);
    mockApi.notifications.list().then((items) => {
      setUnreadNotifications(items.filter((n) => !n.read).length);
    });
    mockApi.faculty.getPendingTasks().then(setTasks);
  }, []);

  useEffect(() => {
    refreshDashboard();
    mockApi.announcements.list().then(setAnnouncements);
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

  return (
    <ScreenLayout
      scroll
      header={
        <AppHeader
          variant="identity"
          greeting={getGreeting()}
          name={`${teacher?.name ?? 'Staff'}! 👋`}
          subtitle={subtitle}
          avatarUrl={teacher?.avatarUrl}
          showNotification
          notificationCount={unreadNotifications}
          onNotificationPress={() => navigation.navigate('NotificationsAlerts')}
          rightAction={{ label: 'Menu', onPress: () => navigation.navigate('FacultyMenu') }}
        />
      }
      bottomNav={{
        activeTab: 'home',
        onTabPress: (tab) => handleBottomNavPress(navigation, tab),
      }}
    >
      <View style={styles.content}>
        <FacultyStatusBanner
          onViewQueue={() => navigation.navigate('SyncQueue')}
          pendingCount={3}
        />
        <View style={styles.sectionHeader}>
          <AppIcon name="calendar_today" size={20} color={colors.primaryContainer} />
          <Text style={[textStyle('labelLg'), styles.sectionLabel]}>Today&apos;s Overview</Text>
        </View>
        <View style={styles.overviewStack}>
          <DashboardCard
            icon="menu_book"
            iconColor={colors.primaryContainer}
            iconBgColor={`${colors.primaryContainer}1A`}
            title={`${overview?.classesToday ?? 6} Classes Today`}
            subtitle={`Next: ${nextClass}`}
            subtitleHighlight={nextClass.split(' — ')[0]}
            onPress={() => navigation.navigate('ClassTimetable')}
          />
          <DashboardCard
            icon="person_check"
            iconColor={colors.secondary}
            iconBgColor={`${colors.secondary}1A`}
            title={`Class ${teacher?.className ?? '10-A'} Attendance`}
            subtitle={`${overview?.absentToday ?? 3} students absent today`}
            onPress={() => navigation.navigate('AttendanceClasses')}
          />
        </View>

        <Text style={[textStyle('labelLg'), styles.sectionLabel]}>Pending Tasks</Text>
        {tasks.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={styles.announcement}
            onPress={() => openTask(t.action)}
          >
            <Text style={[textStyle('labelLg'), styles.announcementTitle]}>{t.title}</Text>
            <Text style={[textStyle('bodyMd'), { color: colors.onSurfaceVariant }]}>{t.subtitle}</Text>
            <Text style={[textStyle('labelSm'), styles.seeAll]}>Mark Now →</Text>
          </TouchableOpacity>
        ))}

        <Text style={[textStyle('labelLg'), styles.sectionLabel]}>Quick Stats</Text>
        <View style={styles.bentoGrid}>
          <View style={styles.bentoCell}>
            <DashboardStatCard
              value={String(overview?.assignmentsToReview ?? 12)}
              label="to review"
              progressPercent={65}
              onPress={() => navigation.navigate('AssignmentsList')}
            />
          </View>
          <View style={styles.bentoCell}>
            <DashboardStatCard
              value={`${overview?.avgClassScore ?? 74}%`}
              label="Avg Class Score"
              valueColor={colors.primaryContainer}
              footerText="This term"
              onPress={() => navigation.navigate('MarksClasses')}
            />
          </View>
          <View style={styles.bentoCell}>
            <DashboardStatCard
              value={String(unreadNotifications)}
              label="Unread Alerts"
              valueColor={unreadNotifications > 0 ? colors.error : colors.onSurfaceVariant}
              icon="campaign"
              iconColor={unreadNotifications > 0 ? colors.error : colors.onSurfaceVariant}
              onPress={() => navigation.navigate('NotificationsAlerts')}
            />
          </View>
          <View style={styles.bentoCell}>
            <DashboardStatCard
              value={String(overview?.upcomingExams ?? 2)}
              label="Upcoming Exams"
              footerText="This week"
              footerTextColor={colors.secondary}
              onPress={() => navigation.navigate('ExamDuties')}
            />
          </View>
        </View>

        <View style={styles.announcementsHeader}>
          <View style={styles.sectionHeader}>
            <AppIcon name="campaign" size={20} color={colors.primaryContainer} />
            <Text style={[textStyle('labelLg'), styles.sectionLabel]}>Announcements</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('AnnouncementsManagement')}>
            <Text style={[textStyle('labelSm'), styles.seeAll]}>See All</Text>
          </TouchableOpacity>
        </View>
        {(announcements.length ? announcements : overview?.announcements ?? []).map((a) => (
          <TouchableOpacity
            key={a.id}
            style={[styles.announcement, a.borderColor === 'error' && styles.announcementUrgent]}
            onPress={() => navigation.navigate('AnnouncementsManagement')}
          >
            <View style={styles.announcementMeta}>
              <View
                style={[
                  styles.categoryChip,
                  a.category === 'urgent' && styles.categoryChipUrgent,
                ]}
              >
                <Text
                  style={[
                    textStyle('chip10'),
                    styles.categoryText,
                    a.category === 'urgent' && styles.categoryTextUrgent,
                  ]}
                >
                  {a.category === 'urgent' ? 'Urgent' : 'Academic'}
                </Text>
              </View>
              <Text style={[textStyle('timestamp11'), styles.announcementTime]}>{a.timestamp}</Text>
            </View>
            <Text style={[textStyle('labelLg'), styles.announcementTitle]}>{a.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScreenLayout>
  );
}
