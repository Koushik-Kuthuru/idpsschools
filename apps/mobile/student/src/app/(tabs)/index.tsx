import { useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useDashboard, useAssignments, useNotifications, useUnreadNotificationCount } from '@/hooks/useApi';
import { useAuthStore } from '@/store';
import { DashboardHeader, OverviewCard, AnnouncementCard } from '@/components/cards/DashboardCards';
import { ProgressBar } from '@/components/charts/ProgressChart';
import { LoadingScreen, ErrorScreen } from '@/components/ui/ScreenHeader';
import { MaterialIcons } from '@expo/vector-icons';
import { formatINR } from '@/utils/currency';
import { TAB_SCREEN_SCROLL_PADDING } from '@/constants/layout';
import { getWorkItemsOverviewSubtitle } from '@/utils/workItems';

export default function DashboardHome() {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, error, refetch, isRefetching } = useDashboard();
  const {
    data: assignments,
    isLoading: assignmentsLoading,
    refetch: refetchAssignments,
    isRefetching: assignmentsRefetching,
  } = useAssignments();
  const { refetch: refetchNotifications, isRefetching: notificationsRefetching } = useNotifications();
  const unreadNotificationCount = useUnreadNotificationCount();

  const handleRefresh = () => {
    refetch();
    refetchAssignments();
    refetchNotifications();
  };

  useFocusEffect(
    useCallback(() => {
      refetchNotifications();
    }, [refetchNotifications]),
  );

  if (isLoading || assignmentsLoading) return <LoadingScreen />;
  if (error || !data) return <ErrorScreen message="Failed to load dashboard" onRetry={() => refetch()} />;

  const workItems = assignments ?? [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <DashboardHeader
        studentName={data.studentName}
        avatar={user?.avatar}
        notificationCount={unreadNotificationCount}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching || assignmentsRefetching || notificationsRefetching}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Today's Overview</Text>
        <OverviewCard
          icon="school"
          iconColor={theme.colors.primary}
          iconBg={`${theme.colors.primary}1a`}
          title={`${data.classesToday} Classes Today`}
          subtitle={`Next: ${data.nextClass}`}
          onPress={() => router.push('/exams/timetable')}
        />
        <OverviewCard
          icon="calendar-today"
          iconColor={theme.colors.blue500}
          iconBg="rgba(59, 130, 246, 0.1)"
          title={`${data.attendancePercent}% Average Attendance`}
          subtitle={`Status: ${data.attendanceStatus}`}
          onPress={() => router.push('/attendance/overview')}
        />

        <OverviewCard
          icon="assignment"
          iconColor={theme.colors.primary}
          iconBg={`${theme.colors.primary}1a`}
          title="Homeworks / Assignments"
          subtitle={getWorkItemsOverviewSubtitle(workItems)}
          onPress={() => router.push('/assignments/overview')}
        />

        <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 8 }]}>Quick Stats</Text>
        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={() => router.push('/(tabs)/marks')}
          >
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>GPA</Text>
            <View style={styles.statValueRow}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{data.gpa}</Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: 14 }}>/ 4.0</Text>
            </View>
            <ProgressBar percent={(data.gpa / 4) * 100} height={6} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={() => router.push('/fees/payments-overview')}
          >
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Fees Due</Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{formatINR(data.feesDue)}</Text>
            <View style={styles.payRow}>
              <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: '700' }}>Pay Now</Text>
              <MaterialIcons name="arrow-forward" size={14} color={theme.colors.primary} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.announceHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Announcements</Text>
          <TouchableOpacity onPress={() => router.push('/announcements' as '/assignments')}>
            <Text style={{ color: theme.colors.primary, fontSize: 14, fontWeight: '600' }}>See all</Text>
          </TouchableOpacity>
        </View>
        {data.announcements.map((a) => (
          <AnnouncementCard key={a.id} item={a} />
        ))}

        <TouchableOpacity
          style={[styles.refinedLink, { borderColor: theme.colors.primary }]}
          onPress={() => router.push('/profile/refined-dashboard')}
        >
          <MaterialIcons name="dashboard" size={20} color={theme.colors.primary} />
          <Text style={{ color: theme.colors.primary, fontWeight: '600', marginLeft: 8 }}>View Refined Dashboard</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: TAB_SCREEN_SCROLL_PADDING },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1 },
  statLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  statValue: { fontSize: 24, fontWeight: '700' },
  statValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 8 },
  payRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  announceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  refinedLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginTop: 16 },
});
