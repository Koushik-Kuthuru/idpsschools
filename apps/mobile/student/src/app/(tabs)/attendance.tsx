import { ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAttendanceSummary, useAttendanceSubjects } from '@/hooks/useApi';
import { CircularProgress, ProgressBar } from '@/components/charts/ProgressChart';
import { LoadingScreen, ErrorScreen } from '@/components/ui/ScreenHeader';
import { TAB_SCREEN_SCROLL_PADDING } from '@/constants/layout';

export default function AttendanceTab() {
  const theme = useTheme();
  const router = useRouter();
  const { data: summary, isLoading, error, refetch, isRefetching } = useAttendanceSummary();
  const { data: subjects } = useAttendanceSubjects();

  if (isLoading) return <LoadingScreen />;
  if (error || !summary) return <ErrorScreen message="Failed to load attendance" onRetry={() => refetch()} />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Attendance Overview</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.primary} />}
      >
        <View style={[styles.classBadge, { backgroundColor: `${theme.colors.primary}1a` }]}>
          <MaterialIcons name="school" size={16} color={theme.colors.primary} />
          <Text style={{ color: theme.colors.primary, fontWeight: '600', fontSize: 14 }}>Class: {summary.className}</Text>
        </View>

        <View style={[styles.overallCard, { backgroundColor: theme.colors.card, borderColor: `${theme.colors.primary}0d` }]}>
          <Text style={[styles.overallLabel, { color: theme.colors.textSecondary }]}>Overall Attendance</Text>
          <CircularProgress percent={summary.overallPercent} />
          <View style={[styles.targetBadge, { backgroundColor: `${theme.colors.primary}0d` }]}>
            <MaterialIcons name="flag" size={16} color={theme.colors.primary} />
            <Text style={{ color: theme.colors.primary, fontWeight: '600', fontSize: 14 }}>Target: {summary.target}%</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{summary.month} Summary</Text>
        <View style={styles.summaryGrid}>
          {[
            { label: 'Present', value: summary.present, color: theme.colors.primary },
            { label: 'Absent', value: summary.absent, color: theme.colors.red500 },
            { label: 'Leave', value: summary.leave, color: theme.colors.amber500 },
          ].map((s) => (
            <View key={s.label} style={[styles.summaryItem, { backgroundColor: theme.colors.card, borderColor: `${theme.colors.primary}0d` }]}>
              <Text style={[styles.summaryValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Subject Wise</Text>
          <TouchableOpacity onPress={() => router.push('/attendance/by-subject')}>
            <Text style={{ color: theme.colors.primary, fontSize: 14, fontWeight: '600' }}>View All</Text>
          </TouchableOpacity>
        </View>
        {subjects?.slice(0, 3).map((sub) => (
          <View key={sub.id} style={[styles.subjectCard, { backgroundColor: theme.colors.card, borderColor: `${theme.colors.primary}0d` }]}>
            <View style={styles.subjectRow}>
              <Text style={{ color: theme.colors.text, fontWeight: '500', fontSize: 14 }}>{sub.subject}</Text>
              <Text style={{ color: theme.colors.primary, fontWeight: '700', fontSize: 14 }}>{sub.percent}%</Text>
            </View>
            <ProgressBar percent={sub.percent} />
          </View>
        ))}

        <TouchableOpacity
          style={[styles.detailBtn, { backgroundColor: theme.colors.primary }]}
          onPress={() => router.push('/attendance/detailed')}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Detailed Monthly View</Text>
          <MaterialIcons name="chevron-right" size={20} color="#fff" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  scroll: { padding: 16, paddingBottom: TAB_SCREEN_SCROLL_PADDING },
  classBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, marginBottom: 16 },
  overallCard: { padding: 24, borderRadius: 12, borderWidth: 1, alignItems: 'center', marginBottom: 24 },
  overallLabel: { fontSize: 14, fontWeight: '500', marginBottom: 16 },
  targetBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginTop: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  summaryGrid: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  summaryItem: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  summaryValue: { fontSize: 24, fontWeight: '700' },
  summaryLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
  subjectCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  subjectRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  detailBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 12, marginTop: 16 },
});
