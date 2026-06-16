import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useCourseDetail } from '@/hooks/useApi';
import { ErrorScreen } from '@/components/ui/ScreenHeader';
import { CourseDetailSkeleton } from '@/components/ui/Skeleton';
import { cardShadow } from '@/constants/shadows';
import { appNavigate } from '@/utils/navigation';
import type { CourseTimelineEntry } from '@/types';

const STATUS_COLORS: Record<CourseTimelineEntry['status'], string> = {
  present: '#16a34a',
  absent: '#ef4444',
  late: '#f59e0b',
  leave: '#64748b',
};

export default function CourseDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { courseId, subject } = useLocalSearchParams<{ courseId: string; subject?: string }>();
  const id = courseId ?? '';
  const { data, isLoading, error, refetch, isRefetching } = useCourseDetail(id, subject);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else appNavigate('/timetable');
  };

  if (isLoading) return <CourseDetailSkeleton />;
  if (error || !data) return <ErrorScreen message="Failed to load course" onRetry={() => refetch()} />;

  const resourceCount = data.resources.length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={handleBack} style={styles.headerBtn} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]} numberOfLines={2}>
            {data.subject}
          </Text>
          <Text style={[styles.headerCode, { color: theme.colors.textSecondary }]}>{data.code}</Text>
        </View>
        <View style={styles.headerBtn}>
          <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.textMuted} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.primary} />}
      >
        <View style={styles.linkRow}>
          <LinkCard
            icon="book-outline"
            iconColor="#7c3aed"
            iconBg="rgba(124, 58, 237, 0.12)"
            title="Syllabus"
            subtitle="Chapters and topics"
            onPress={() =>
              appNavigate({
                pathname: '/timetable/[courseId]/syllabus',
                params: { courseId: id, subject: data.subject },
              })
            }
          />
          <LinkCard
            icon="folder-open-outline"
            iconColor="#0d9488"
            iconBg="rgba(13, 148, 136, 0.12)"
            title="Resource"
            subtitle={`${resourceCount} Item${resourceCount === 1 ? '' : 's'}`}
            onPress={() =>
              appNavigate({
                pathname: '/timetable/[courseId]/resources',
                params: { courseId: id, subject: data.subject },
              })
            }
          />
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Your Attendance</Text>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>{data.yourAttendancePercent.toFixed(2)} %</Text>
          </View>
          <View style={[styles.statCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Class average</Text>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>{data.classAveragePercent.toFixed(2)} %</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Course Timeline</Text>
        <View style={styles.timeline}>
          {data.timeline.map((entry, index) => (
            <TimelineItem key={entry.id} entry={entry} isLast={index === data.timeline.length - 1} theme={theme} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function LinkCard({
  icon,
  iconColor,
  iconBg,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.linkCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
    >
      <View style={[styles.linkIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <View style={styles.linkCopy}>
        <Text style={[styles.linkTitle, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[styles.linkSub, { color: theme.colors.textSecondary }]}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
    </TouchableOpacity>
  );
}

function TimelineItem({
  entry,
  isLast,
  theme,
}: {
  entry: CourseTimelineEntry;
  isLast: boolean;
  theme: ReturnType<typeof useTheme>;
}) {
  const statusColor = STATUS_COLORS[entry.status];
  const statusLabel = entry.status.charAt(0).toUpperCase() + entry.status.slice(1);

  return (
    <View style={styles.timelineItem}>
      <View style={styles.timelineRail}>
        <View style={[styles.timelineDot, { borderColor: statusColor }]} />
        {!isLast ? <View style={[styles.timelineLine, { backgroundColor: theme.colors.border }]} /> : null}
      </View>
      <View style={[styles.timelineBody, isLast && styles.timelineBodyLast]}>
        <View style={styles.timelineTop}>
          <Text style={[styles.timelineDate, { color: theme.colors.text }]}>
            {entry.date} - {entry.timeRange}
          </Text>
          <Text style={[styles.timelineStatus, { color: statusColor }]}>{statusLabel}</Text>
        </View>
        {entry.topic ? (
          <View style={[styles.topicPill, { backgroundColor: theme.colors.slate100, borderColor: theme.colors.border }]}>
            <Text style={[styles.topicText, { color: theme.colors.textSecondary }]}>{entry.topic}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, paddingHorizontal: 4 },
  headerTitle: { fontSize: 16, fontWeight: '800', lineHeight: 22 },
  headerCode: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  scroll: { padding: 16, paddingBottom: 32 },
  linkRow: { gap: 10, marginBottom: 14 },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  linkIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  linkCopy: { flex: 1 },
  linkTitle: { fontSize: 16, fontWeight: '700' },
  linkSub: { fontSize: 12, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  statCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 16, alignItems: 'center' },
  statLabel: { fontSize: 13, fontWeight: '600' },
  statValue: { fontSize: 28, fontWeight: '800', marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 14 },
  timeline: { gap: 0 },
  timelineItem: { flexDirection: 'row', gap: 12 },
  timelineRail: { width: 18, alignItems: 'center' },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    backgroundColor: '#fff',
    marginTop: 4,
  },
  timelineLine: { width: 2, flex: 1, marginTop: 4, minHeight: 24 },
  timelineBody: { flex: 1, paddingBottom: 18 },
  timelineBodyLast: { paddingBottom: 4 },
  timelineTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' },
  timelineDate: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  timelineStatus: { fontSize: 13, fontWeight: '700' },
  topicPill: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  topicText: { fontSize: 13, lineHeight: 18 },
});
