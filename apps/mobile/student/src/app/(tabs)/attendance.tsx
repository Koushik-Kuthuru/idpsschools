import { ScrollView, View, Text, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAttendanceSummary, useAttendanceSubjects } from '@/hooks/useApi';
import { ProgressBar } from '@/components/charts/ProgressChart';
import { AttendanceRing, AttendanceRatioBar } from '@/components/charts/AttendanceCharts';
import { LoadingScreen, ErrorScreen } from '@/components/ui/ScreenHeader';
import { TabScreenHeader } from '@/components/ui/TabScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { NavLink } from '@/components/navigation/NavLink';
import { cardShadow } from '@/constants/shadows';
import { TAB_SCREEN_SCROLL_PADDING } from '@/constants/layout';
import { appNavigate } from '@/utils/navigation';
import type { AttendanceSummary } from '@/types';
import { subjectBarColor } from '@/utils/attendanceUi';

export default function AttendanceTab() {
  const theme = useTheme();
  const { data: summary, isLoading, error, refetch, isRefetching } = useAttendanceSummary();
  const { data: subjects } = useAttendanceSubjects();

  if (isLoading) return <LoadingScreen />;
  if (error || !summary) return <ErrorScreen message="Failed to load attendance" onRetry={() => refetch()} />;

  const totalDays = summary.present + summary.absent + summary.late + summary.leave;
  const aboveTarget = summary.overallPercent >= summary.target;
  const targetDelta = Math.abs(summary.overallPercent - summary.target).toFixed(1);

  const stats = [
    { label: 'Present', value: summary.present, color: theme.colors.primary, icon: 'checkmark-circle' as const },
    { label: 'Absent', value: summary.absent, color: theme.colors.red500, icon: 'close-circle' as const },
    { label: 'Late', value: summary.late, color: theme.colors.amber500, icon: 'alarm-outline' as const },
    { label: 'Leave', value: summary.leave, color: theme.colors.slate500, icon: 'calendar-outline' as const },
  ];

  const quickActions = [
    { icon: 'calendar-outline' as const, label: 'Monthly view', sub: 'Day-by-day log', route: '/attendance/detailed' as const },
    { icon: 'book-outline' as const, label: 'By subject', sub: 'Per class stats', route: '/attendance/by-subject' as const },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TabScreenHeader title="Attendance" subtitle={`${summary.className} · ${summary.month}`} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.primary} />}
      >
        <AttendanceHeroCard summary={summary} aboveTarget={aboveTarget} targetDelta={targetDelta} totalDays={totalDays} />

        <SectionHeader title={`${summary.month} breakdown`} />
        <View style={[styles.breakdownCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <AttendanceRatioBar
            present={summary.present}
            absent={summary.absent}
            late={summary.late}
            leave={summary.leave}
          />
          <Text style={[styles.daysNote, { color: theme.colors.textSecondary }]}>
            {summary.present} present out of {totalDays} school days this month
          </Text>
        </View>

        <View style={styles.statsGrid}>
          {stats.map((s) => (
            <View
              key={s.label}
              style={[styles.statCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            >
              <View style={[styles.statIcon, { backgroundColor: `${s.color}14` }]}>
                <Ionicons name={s.icon} size={14} color={s.color} />
              </View>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textMuted }]} numberOfLines={1}>
                {s.label}
              </Text>
            </View>
          ))}
        </View>

        <SectionHeader title="Subject wise" actionLabel="View all" onAction={() => appNavigate('/attendance/by-subject')} />
        {subjects?.slice(0, 4).map((sub) => {
          const barColor = subjectBarColor(sub.percent, summary.target, theme);
          const onTarget = sub.percent >= summary.target;
          return (
            <NavLink
              key={sub.id}
              href={`/attendance/subject/${sub.id}`}
              style={[styles.subjectCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            >
              <View style={styles.subjectTop}>
                <View style={styles.subjectLeft}>
                  <View style={[styles.subjectIcon, { backgroundColor: `${barColor}14` }]}>
                    <Ionicons name="book-outline" size={16} color={barColor} />
                  </View>
                  <View>
                    <Text style={[styles.subjectName, { color: theme.colors.text }]}>{sub.subject}</Text>
                    <Text style={[styles.subjectMeta, { color: theme.colors.textSecondary }]}>
                      Target {summary.target}%
                    </Text>
                  </View>
                </View>
                <View style={styles.subjectRight}>
                  <Text style={[styles.subjectPercent, { color: barColor }]}>{sub.percent}%</Text>
                  <View style={[styles.statusChip, { backgroundColor: onTarget ? theme.colors.primaryLight : `${theme.colors.amber500}18` }]}>
                    <Text style={[styles.statusChipText, { color: onTarget ? theme.colors.primary : theme.colors.amber500 }]}>
                      {onTarget ? 'On track' : 'Below'}
                    </Text>
                  </View>
                </View>
              </View>
              <ProgressBar percent={sub.percent} height={6} color={barColor} />
            </NavLink>
          );
        })}

        <SectionHeader title="Quick actions" />
        <View style={styles.actionsRow}>
          {quickActions.map((action) => (
            <NavLink
              key={action.label}
              href={action.route}
              style={[styles.actionCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            >
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.primaryLight }]}>
                <Ionicons name={action.icon} size={20} color={theme.colors.primary} />
              </View>
              <Text style={[styles.actionLabel, { color: theme.colors.text }]}>{action.label}</Text>
              <Text style={[styles.actionSub, { color: theme.colors.textSecondary }]}>{action.sub}</Text>
            </NavLink>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function AttendanceHeroCard({
  summary,
  aboveTarget,
  targetDelta,
  totalDays,
}: {
  summary: AttendanceSummary;
  aboveTarget: boolean;
  targetDelta: string;
  totalDays: number;
}) {
  return (
    <View style={[styles.heroCard, cardShadow]}>
      <View style={styles.heroTop}>
        <View style={styles.heroCopy}>
          <Text style={styles.heroEyebrow}>OVERALL ATTENDANCE</Text>
          <Text style={styles.heroClass}>{summary.className}</Text>
          <Text style={styles.heroMonth}>{summary.month} · {totalDays} school days</Text>
          <View style={[styles.targetBadge, { backgroundColor: aboveTarget ? 'rgba(162,193,68,0.2)' : 'rgba(245,158,11,0.2)' }]}>
            <Ionicons name={aboveTarget ? 'trending-up' : 'alert-circle-outline'} size={14} color={aboveTarget ? '#a2c144' : '#f59e0b'} />
            <Text style={[styles.targetBadgeText, { color: aboveTarget ? '#a2c144' : '#f59e0b' }]}>
              {aboveTarget ? `${targetDelta}% above target` : `${targetDelta}% below target`}
            </Text>
          </View>
        </View>
        <AttendanceRing percent={summary.overallPercent} target={summary.target} />
      </View>
      <View style={styles.heroFooter}>
        <View style={styles.heroMeta}>
          <Text style={styles.heroMetaLabel}>TARGET</Text>
          <Text style={styles.heroMetaValue}>{summary.target}%</Text>
        </View>
        <View style={styles.heroDivider} />
        <View style={styles.heroMeta}>
          <Text style={styles.heroMetaLabel}>PRESENT</Text>
          <Text style={styles.heroMetaValue}>{summary.present} days</Text>
        </View>
        <View style={styles.heroDivider} />
        <View style={styles.heroMeta}>
          <Text style={styles.heroMetaLabel}>ABSENT</Text>
          <Text style={styles.heroMetaValue}>{summary.absent} days</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: TAB_SCREEN_SCROLL_PADDING },
  heroCard: {
    backgroundColor: '#144835',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroCopy: { flex: 1, marginRight: 12 },
  heroEyebrow: { color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  heroClass: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 4 },
  heroMonth: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '500', marginTop: 4 },
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  targetBadgeText: { fontSize: 12, fontWeight: '700' },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  heroMeta: { flex: 1, alignItems: 'center' },
  heroMetaLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  heroMetaValue: { color: '#fff', fontSize: 14, fontWeight: '700', marginTop: 4 },
  heroDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.15)' },
  breakdownCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  daysNote: { fontSize: 12, fontWeight: '500', marginTop: 12 },
  statsGrid: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  statCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 0,
  },
  statIcon: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 2, textAlign: 'center' },
  subjectCard: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  subjectTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  subjectLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  subjectIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  subjectName: { fontWeight: '700', fontSize: 15 },
  subjectMeta: { fontSize: 11, marginTop: 2 },
  subjectRight: { alignItems: 'flex-end' },
  subjectPercent: { fontWeight: '800', fontSize: 18 },
  statusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, marginTop: 4 },
  statusChipText: { fontSize: 10, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  actionCard: { flex: 1, padding: 14, borderRadius: 14, borderWidth: 1 },
  actionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  actionLabel: { fontSize: 14, fontWeight: '700' },
  actionSub: { fontSize: 11, marginTop: 2 },
});
