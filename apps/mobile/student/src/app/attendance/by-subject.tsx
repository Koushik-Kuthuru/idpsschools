import { ScrollView, View, Text, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAttendanceSummary, useAttendanceSubjects } from '@/hooks/useApi';
import { ProgressBar } from '@/components/charts/ProgressChart';
import { ScreenHeader, LoadingScreen, ErrorScreen } from '@/components/ui/ScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { cardShadow } from '@/constants/shadows';
import { averageSubjectPercent, subjectBarColor } from '@/utils/attendanceUi';

export default function AttendanceBySubjectScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data: summary, isLoading: summaryLoading } = useAttendanceSummary();
  const { data, isLoading, error, refetch, isRefetching } = useAttendanceSubjects();

  if (isLoading || summaryLoading) return <LoadingScreen />;
  if (error || !data || !summary) return <ErrorScreen message="Failed to load subjects" onRetry={() => refetch()} />;

  const target = summary.target;
  const avgPercent = averageSubjectPercent(data);
  const onTargetCount = data.filter((s) => s.percent >= target).length;
  const sorted = [...data].sort((a, b) => b.percent - a.percent);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <ScreenHeader title="By subject" fallbackRoute="/(tabs)/attendance" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.primary} />}
      >
        <View style={[styles.heroCard, cardShadow]}>
          <View style={styles.heroTop}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>PER CLASS STATS</Text>
              <Text style={styles.heroTitle}>{summary.className}</Text>
              <Text style={styles.heroSub}>{data.length} subjects · Target {target}%</Text>
            </View>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeValue}>{avgPercent}%</Text>
              <Text style={styles.heroBadgeLabel}>avg</Text>
            </View>
          </View>
          <View style={styles.heroFooter}>
            <View style={styles.heroMeta}>
              <Text style={styles.heroMetaLabel}>ON TRACK</Text>
              <Text style={styles.heroMetaValue}>{onTargetCount}</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroMeta}>
              <Text style={styles.heroMetaLabel}>BELOW</Text>
              <Text style={styles.heroMetaValue}>{data.length - onTargetCount}</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroMeta}>
              <Text style={styles.heroMetaLabel}>BEST</Text>
              <Text style={styles.heroMetaValue}>{sorted[0]?.percent ?? 0}%</Text>
            </View>
          </View>
        </View>

        <SectionHeader title="All subjects" />
        {sorted.map((sub, index) => {
          const barColor = subjectBarColor(sub.percent, target, theme);
          const onTarget = sub.percent >= target;
          return (
            <TouchableOpacity
              key={sub.id}
              activeOpacity={0.75}
              style={[styles.subjectCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
              onPress={() => router.push(`/attendance/subject/${sub.id}`)}
            >
              <View style={styles.subjectTop}>
                <View style={styles.subjectLeft}>
                  <View style={[styles.rankBadge, { backgroundColor: index < 3 ? theme.colors.primaryLight : theme.colors.slate100 }]}>
                    <Text style={[styles.rankText, { color: index < 3 ? theme.colors.primary : theme.colors.textMuted }]}>
                      {index + 1}
                    </Text>
                  </View>
                  <View style={[styles.subjectIcon, { backgroundColor: `${barColor}14` }]}>
                    <Ionicons name="book-outline" size={18} color={barColor} />
                  </View>
                  <View>
                    <Text style={[styles.subjectName, { color: theme.colors.text }]}>{sub.subject}</Text>
                    <Text style={[styles.subjectMeta, { color: theme.colors.textSecondary }]}>Target {target}%</Text>
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
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  heroCard: {
    backgroundColor: '#144835',
    borderRadius: 16,
    padding: 20,
    marginBottom: 8,
    marginTop: 4,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroCopy: { flex: 1, marginRight: 12 },
  heroEyebrow: { color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 6 },
  heroSub: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '500', marginTop: 4 },
  heroBadge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadgeValue: { color: '#a2c144', fontSize: 22, fontWeight: '800' },
  heroBadgeLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },
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
  heroMetaValue: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 4 },
  heroDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.15)' },
  subjectCard: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  subjectTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  subjectLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  rankBadge: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 11, fontWeight: '800' },
  subjectIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  subjectName: { fontWeight: '700', fontSize: 15 },
  subjectMeta: { fontSize: 11, marginTop: 2 },
  subjectRight: { alignItems: 'flex-end' },
  subjectPercent: { fontWeight: '800', fontSize: 18 },
  statusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, marginTop: 4 },
  statusChipText: { fontSize: 10, fontWeight: '700' },
});
