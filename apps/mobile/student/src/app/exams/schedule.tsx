import { ScrollView, View, Text, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useExams } from '@/hooks/useApi';
import { ScreenHeader, ErrorScreen } from '@/components/ui/ScreenHeader';
import { ExamScheduleSkeleton } from '@/components/ui/Skeleton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { cardShadow } from '@/constants/shadows';
import type { Exam } from '@/types';

const SUBJECT_COLORS = ['#144835', '#0f766e', '#1d4ed8', '#7c3aed', '#b45309'];

export default function ExamScheduleScreen() {
  const theme = useTheme();
  const { data, isLoading, error, refetch, isRefetching } = useExams();

  if (isLoading) return <ExamScheduleSkeleton />;
  if (error && !data) return <ErrorScreen message="Failed to load exam schedule" onRetry={() => refetch()} />;

  const exams = data ?? [];
  const nextExam = exams[0];

  const stats = [
    { label: 'Exams', value: String(exams.length), color: theme.colors.primary, icon: 'calendar-outline' as const },
    { label: 'Next', value: nextExam?.date.split(',')[0] ?? '—', color: theme.colors.accent, icon: 'time-outline' as const },
    { label: 'Halls', value: String(new Set(exams.map((e) => e.hallNumber)).size), color: theme.colors.text, icon: 'business-outline' as const },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <ScreenHeader title="Exam schedule" fallbackRoute="/(tabs)/profile" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.primary} />}
      >
        <View style={[styles.heroCard, cardShadow]}>
          <Text style={styles.heroEyebrow}>TERM EXAMINATIONS</Text>
          <Text style={styles.heroTitle}>{exams.length} exams scheduled</Text>
          {nextExam ? (
            <Text style={styles.heroSub}>Next: {nextExam.subject} on {nextExam.date}</Text>
          ) : (
            <Text style={styles.heroSub}>No upcoming exams</Text>
          )}
        </View>

        <View style={styles.statsRow}>
          {stats.map((s) => (
            <View
              key={s.label}
              style={[styles.statCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            >
              <View style={[styles.statIcon, { backgroundColor: `${s.color}14` }]}>
                <Ionicons name={s.icon} size={14} color={s.color} />
              </View>
              <Text style={[styles.statValue, { color: s.color }]} numberOfLines={1}>
                {s.value}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        <SectionHeader title="Upcoming exams" />
        {exams.map((exam, index) => (
          <ExamCard key={exam.id} exam={exam} theme={theme} accent={SUBJECT_COLORS[index % SUBJECT_COLORS.length]} isFirst={index === 0} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function ExamCard({ exam, theme, accent, isFirst }: { exam: Exam; theme: ReturnType<typeof useTheme>; accent: string; isFirst: boolean }) {
  const dateParts = exam.date.replace(',', '').split(' ');

  return (
    <View style={[styles.examCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }, isFirst && { borderLeftWidth: 4, borderLeftColor: accent }]}>
      <View style={[styles.dateBadge, { backgroundColor: `${accent}14` }]}>
        <Text style={[styles.dateMonth, { color: accent }]}>{dateParts[0]?.slice(0, 3).toUpperCase()}</Text>
        <Text style={[styles.dateDay, { color: accent }]}>{dateParts[1]}</Text>
      </View>
      <View style={styles.examCopy}>
        <Text style={[styles.examSubject, { color: theme.colors.text }]}>{exam.subject}</Text>
        <View style={styles.examRow}>
          <Ionicons name="time-outline" size={14} color={theme.colors.textMuted} />
          <Text style={[styles.examMeta, { color: theme.colors.textSecondary }]}>{exam.time}</Text>
        </View>
        <View style={styles.examRow}>
          <Ionicons name="business-outline" size={14} color={theme.colors.textMuted} />
          <Text style={[styles.examMeta, { color: theme.colors.textSecondary }]}>Hall {exam.hallNumber}</Text>
        </View>
        <View style={styles.examRow}>
          <Ionicons name="calendar-outline" size={14} color={theme.colors.textMuted} />
          <Text style={[styles.examMeta, { color: theme.colors.textSecondary }]}>{exam.date}</Text>
        </View>
      </View>
      {isFirst ? (
        <View style={[styles.nextPill, { backgroundColor: `${accent}18` }]}>
          <Text style={[styles.nextPillText, { color: accent }]}>NEXT</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  heroCard: { backgroundColor: '#144835', borderRadius: 16, padding: 20, marginTop: 4, marginBottom: 12 },
  heroEyebrow: { color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 6 },
  heroSub: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  statCard: { flex: 1, paddingVertical: 12, paddingHorizontal: 6, borderRadius: 14, borderWidth: 1, alignItems: 'center', minWidth: 0 },
  statIcon: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statValue: { fontSize: 14, fontWeight: '800' },
  statLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 4 },
  examCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 10, position: 'relative' },
  dateBadge: { width: 52, height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dateMonth: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  dateDay: { fontSize: 20, fontWeight: '800', marginTop: 2 },
  examCopy: { flex: 1 },
  examSubject: { fontSize: 17, fontWeight: '800', marginBottom: 8 },
  examRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  examMeta: { fontSize: 13, fontWeight: '500' },
  nextPill: { position: 'absolute', top: 12, right: 12, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  nextPillText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
});
