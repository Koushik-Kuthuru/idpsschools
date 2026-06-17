import { useCallback, useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useDashboard, useAssignments, useNotifications, useUnreadNotificationCount } from '@/hooks/useApi';
import { useAuthStore } from '@/store';
import { DashboardHeader, OverviewCard, StatCard } from '@/components/cards/DashboardCards';
import { cardShadow } from '@/constants/shadows';
import { ProgressBar } from '@/components/charts/ProgressChart';
import { LoadingScreen, ErrorScreen } from '@/components/ui/ScreenHeader';
import { formatINR } from '@/utils/currency';
import { TAB_SCREEN_SCROLL_PADDING } from '@/constants/layout';
import { filterHomeworkOverviewItems, getWorkItemsOverviewSubtitle } from '@/utils/workItems';
import { appNavigate } from '@/utils/navigation';

function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  const theme = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity onPress={onAction} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={[styles.sectionAction, { color: theme.colors.primary }]}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default function DashboardHome() {
  const theme = useTheme();
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

  const workItems = assignments ?? [];
  const overviewWorkItems = useMemo(() => filterHomeworkOverviewItems(workItems), [workItems]);
  const hasPendingWork = overviewWorkItems.some((item) => item.status === 'pending' || item.status === 'overdue');

  if (isLoading || assignmentsLoading) return <LoadingScreen />;
  if (error || !data) return <ErrorScreen message="Failed to load dashboard" onRetry={() => refetch()} />;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching || assignmentsRefetching || notificationsRefetching}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        <DashboardHeader
          studentName={user?.name ?? data.studentName}
          className={user?.className}
          admissionNumber={user?.studentId}
          avatar={user?.avatar}
          notificationCount={unreadNotificationCount}
          onProfilePress={() => appNavigate('/(tabs)/profile')}
          onIdCardPress={() => appNavigate('/profile/id-card')}
          onHomeworksPress={() => appNavigate('/assignments')}
        />

        <View style={styles.content}>
        <SectionHeader title="Today's overview" />
        <OverviewCard
          icon="schedule"
          iconColor={theme.colors.primary}
          iconBg={`${theme.colors.primary}14`}
          accentColor={theme.colors.primary}
          title={`${data.classesToday} classes today`}
          subtitle={`Next up · ${data.nextClass}`}
          badge="Active"
          onPress={() => appNavigate('/timetable')}
        />
        <OverviewCard
          icon="fact-check"
          iconColor="#2563eb"
          iconBg="rgba(37, 99, 235, 0.1)"
          accentColor="#2563eb"
          title={`${data.attendancePercent}% attendance`}
          subtitle={`Today · ${data.attendanceStatus}`}
          onPress={() => appNavigate('/(tabs)/attendance')}
        />
        <OverviewCard
          icon="assignment"
          iconColor="#d97706"
          iconBg="rgba(217, 119, 6, 0.1)"
          accentColor="#d97706"
          title="Homework & projects"
          subtitle={getWorkItemsOverviewSubtitle(overviewWorkItems)}
          badge={hasPendingWork ? 'Pending' : undefined}
          onPress={() => appNavigate({ pathname: '/(tabs)/learning', params: { tab: 'homework' } })}
        />

        <SectionHeader title="Quick stats" />
        <View style={styles.statsGrid}>
          <StatCard
            label="Attendance"
            value={`${data.attendancePercent}%`}
            subValue={data.attendanceStatus}
            icon="event-available"
            accent="#2563eb"
            onPress={() => appNavigate('/(tabs)/attendance')}
          >
            <View style={styles.progressWrap}>
              <ProgressBar percent={data.attendancePercent} height={5} color="#2563eb" />
            </View>
          </StatCard>
          <StatCard
            label="Fees due"
            value={formatINR(data.feesDue)}
            icon="payments"
            accent={theme.colors.accent}
            onPress={() => appNavigate('/fees/payments-overview')}
          />
        </View>

        <SectionHeader title="Tools" />
        <View style={styles.toolsGrid}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => appNavigate('/calendar')}
            style={[styles.toolCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          >
            <View style={[styles.toolIcon, { backgroundColor: `${theme.colors.primary}14` }]}>
              <MaterialIcons name="event" size={22} color={theme.colors.primary} />
            </View>
            <Text style={[styles.toolLabel, { color: theme.colors.text }]}>Academic calendar</Text>
            <Text style={[styles.toolSub, { color: theme.colors.textSecondary }]}>Holidays, exams & events</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => appNavigate('/timetable')}
            style={[styles.toolCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          >
            <View style={[styles.toolIcon, { backgroundColor: 'rgba(37, 99, 235, 0.1)' }]}>
              <MaterialIcons name="schedule" size={22} color="#2563eb" />
            </View>
            <Text style={[styles.toolLabel, { color: theme.colors.text }]}>Class timetable</Text>
            <Text style={[styles.toolSub, { color: theme.colors.textSecondary }]}>Daily class timings</Text>
          </TouchableOpacity>
        </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: TAB_SCREEN_SCROLL_PADDING },
  content: { paddingHorizontal: 16, paddingTop: 8 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  sectionAction: { fontSize: 13, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  progressWrap: { marginTop: 10 },
  toolsGrid: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  toolCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 120,
  },
  toolIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  toolLabel: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  toolSub: { fontSize: 12, marginTop: 4, textAlign: 'center' },
});
