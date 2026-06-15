import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAttendanceSummary, useAttendanceSubjects } from '@/hooks/useApi';
import { CircularProgress, ProgressBar } from '@/components/charts/ProgressChart';
import { ScreenHeader, LoadingScreen, ErrorScreen } from '@/components/ui/ScreenHeader';

/** Stitch: attendance_overview (stack, no tab bar) */
export default function AttendanceOverviewScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data: summary, isLoading, error, refetch } = useAttendanceSummary();
  const { data: subjects } = useAttendanceSubjects();

  if (isLoading) return <LoadingScreen />;
  if (error || !summary) return <ErrorScreen message="Failed to load attendance" onRetry={() => refetch()} />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScreenHeader title="Attendance Overview" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.classBadge, { backgroundColor: `${theme.colors.primary}1a` }]}>
          <MaterialIcons name="school" size={16} color={theme.colors.primary} />
          <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>Class: {summary.className}</Text>
        </View>
        <View style={[styles.overallCard, { backgroundColor: theme.colors.card }]}>
          <Text style={{ color: theme.colors.textSecondary, marginBottom: 16 }}>Overall Attendance</Text>
          <CircularProgress percent={summary.overallPercent} />
          <View style={[styles.targetBadge, { backgroundColor: `${theme.colors.primary}0d` }]}>
            <MaterialIcons name="flag" size={16} color={theme.colors.primary} />
            <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>Target: {summary.target}%</Text>
          </View>
        </View>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{summary.month} Summary</Text>
        <View style={styles.summaryGrid}>
          {[
            { label: 'Present', value: summary.present, color: theme.colors.primary },
            { label: 'Absent', value: summary.absent, color: theme.colors.red500 },
            { label: 'Late', value: summary.late, color: theme.colors.amber500 },
          ].map((s) => (
            <View key={s.label} style={[styles.summaryItem, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.summaryValue, { color: s.color }]}>{s.value}</Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontWeight: '700' }}>{s.label.toUpperCase()}</Text>
            </View>
          ))}
        </View>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Subject Wise</Text>
        {subjects?.map((sub) => (
          <View key={sub.id} style={[styles.subjectCard, { backgroundColor: theme.colors.card }]}>
            <View style={styles.subjectRow}>
              <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{sub.subject}</Text>
              <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>{sub.percent}%</Text>
            </View>
            <ProgressBar percent={sub.percent} />
          </View>
        ))}
        <TouchableOpacity style={[styles.linkBtn, { backgroundColor: theme.colors.primary }]} onPress={() => router.push('/attendance/detailed')}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Detailed View</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.linkBtnOutline, { borderColor: theme.colors.primary }]} onPress={() => router.push('/attendance/by-subject')}>
          <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>By Subject</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 32 },
  classBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, marginBottom: 16 },
  overallCard: { padding: 24, borderRadius: 12, alignItems: 'center', marginBottom: 24 },
  targetBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginTop: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  summaryGrid: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  summaryItem: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  summaryValue: { fontSize: 24, fontWeight: '700' },
  subjectCard: { padding: 16, borderRadius: 12, marginBottom: 8 },
  subjectRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  linkBtn: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  linkBtnOutline: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8, borderWidth: 1.5 },
});
