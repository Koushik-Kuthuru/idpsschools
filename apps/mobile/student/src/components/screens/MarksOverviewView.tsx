import { useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useMarksOverview } from '@/hooks/useApi';
import { useAuthStore } from '@/store';
import { ProgressBar } from '@/components/charts/ProgressChart';
import { TermLineChart, SubjectBarChart } from '@/components/charts/MarksCharts';
import { ErrorScreen } from '@/components/ui/ScreenHeader';
import { MarksSkeleton } from '@/components/ui/Skeleton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button } from '@/components/ui/Button';
import { cardShadow } from '@/constants/shadows';
import type { MarksExamBucket } from '@/types';
import { buildMarksPdfFileName, exportMarksPdf, shareMarksPdf, saveMarksPdf } from '@/utils/marksExport';
import { TAB_SCREEN_SCROLL_PADDING } from '@/constants/layout';

const ICON_MAP: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  calculate: 'calculate',
  palette: 'palette',
  biotech: 'biotech',
  'menu-book': 'menu-book',
  'fitness-center': 'fitness-center',
  'history-edu': 'history-edu',
};

const OVERALL_EXAM_ID = '__overall__';

export function MarksOverviewView({ showHeader = true }: { showHeader?: boolean }) {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, error, refetch } = useMarksOverview();
  const [examId, setExamId] = useState<string | null>(null);
  const [examModal, setExamModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  const examOptions = useMemo(() => {
    if (!data) return [] as MarksExamBucket[];
    const fromApi = (data.exams ?? []).filter((exam) => (exam.subjects?.length ?? 0) > 0);
    if (fromApi.length > 0) return fromApi;
    // Legacy fallback when API only has term buckets.
    return (['term1', 'term2', 'term3', 'annual'] as const)
      .map((key) => {
        const bucket = data.terms[key];
        if (!bucket || (bucket.subjects?.length ?? 0) === 0) return null;
        return {
          id: key,
          name: key === 'term1' ? 'Term 1' : key === 'term2' ? 'Term 2' : key === 'term3' ? 'Term 3' : 'Annual',
          ...bucket,
        } satisfies MarksExamBucket;
      })
      .filter((row): row is MarksExamBucket => Boolean(row));
  }, [data]);

  if (isLoading) return <MarksSkeleton />;
  if (error || !data) return <ErrorScreen message="Failed to load marks" onRetry={() => refetch()} />;

  const overviewFallback: MarksExamBucket = {
    id: OVERALL_EXAM_ID,
    name: 'Overall',
    gpa: data.gpa,
    grade: data.grade,
    rank: data.rank,
    totalPercent: data.totalPercent,
    subjects: data.subjects ?? [],
  };

  const preferredExamId =
    (examId && examOptions.some((exam) => exam.id === examId) ? examId : null) ??
    examOptions[0]?.id ??
    OVERALL_EXAM_ID;

  const active =
    examOptions.find((exam) => exam.id === preferredExamId) ??
    (overviewFallback.subjects.length > 0 ? overviewFallback : examOptions[0] ?? overviewFallback);

  const examLineChart = {
    labels: examOptions.map((exam) =>
      exam.name.length > 8 ? `${exam.name.slice(0, 7)}…` : exam.name,
    ),
    values: examOptions.map((exam) => exam.totalPercent),
  };

  const subjectBarChart = {
    labels: active.subjects.map((s) => (s.subject.length > 6 ? `${s.subject.slice(0, 5)}…` : s.subject)),
    values: active.subjects.map((s) =>
      s.maxScore > 0 ? Math.round((s.score / s.maxScore) * 100) : 0,
    ),
  };

  const handleExport = async (type: 'transcript' | 'report') => {
    setExporting(true);
    try {
      const studentName = user?.name ?? 'Student';
      const fileName = buildMarksPdfFileName(type, studentName, active.name, user?.className);
      const uri = await exportMarksPdf(data, active, studentName, type, {
        className: user?.className,
        studentId: user?.studentId,
      });
      const path = await saveMarksPdf(uri, fileName);
      if (type === 'transcript') {
        await shareMarksPdf(path, 'Academic Transcript');
      } else {
        Alert.alert('Downloaded', `Report card saved as ${fileName}`);
      }
    } catch {
      Alert.alert('Error', 'Could not export PDF');
    } finally {
      setExporting(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      showsVerticalScrollIndicator={false}
    >
      {showHeader && (
        <View style={[styles.contextBadge, { backgroundColor: theme.colors.primaryLight }]}>
          <Text style={[styles.contextText, { color: theme.colors.primary }]}>
            {user?.className ?? 'Class'} · {active.name}
            {user?.academicYear ? ` · AY ${user.academicYear}` : ''}
          </Text>
          <Text style={[styles.updatedText, { color: theme.colors.textMuted }]}>
            Updated {data.lastUpdated || '—'}
          </Text>
        </View>
      )}

      <View style={[styles.gpaCard, cardShadow]}>
        <View style={styles.gpaTop}>
          <View>
            <Text style={styles.gpaLabel}>OVERALL GPA</Text>
            <Text style={styles.gpaValue}>
              {active.gpa} <Text style={styles.gpaMax}>/ 4.0</Text>
            </Text>
          </View>
          <View style={styles.gpaStarWrap}>
            <Ionicons name="star" size={24} color="#a2c144" />
          </View>
        </View>
        <View style={styles.gpaFooter}>
          <View style={styles.gpaMeta}>
            <Text style={styles.gpaMetaLabel}>GRADE</Text>
            <Text style={styles.gpaMetaValue}>{active.grade}</Text>
          </View>
          <View style={styles.gpaDivider} />
          <View style={styles.gpaMeta}>
            <Text style={styles.gpaMetaLabel}>RANK</Text>
            <Text style={styles.gpaMetaValue}>{active.rank}</Text>
          </View>
          <TouchableOpacity style={styles.insightsBtn} onPress={() => router.push('/marks/performance')} activeOpacity={0.85}>
            <Text style={styles.insightsText}>Insights</Text>
            <Ionicons name="chevron-forward" size={14} color="#144835" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.reportCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={styles.reportHeader}>
          <View style={[styles.reportIcon, { backgroundColor: theme.colors.primaryLight }]}>
            <Ionicons name="document-text-outline" size={18} color={theme.colors.primary} />
          </View>
          <View style={styles.reportCopy}>
            <Text style={[styles.reportTitle, { color: theme.colors.text }]}>Academic report</Text>
            <Text style={[styles.reportSub, { color: theme.colors.textSecondary }]}>
              {active.name} · {active.totalPercent}% · Subject-wise below
            </Text>
          </View>
        </View>
        <View style={styles.exportRow}>
          <Button title="Transcript" variant="outline" onPress={() => handleExport('transcript')} loading={exporting} style={{ flex: 1 }} />
          <Button title="Report card" onPress={() => handleExport('report')} loading={exporting} style={{ flex: 1, marginLeft: 8 }} />
        </View>
      </View>

      <SectionHeader title="Exam performance" />
      <View style={[styles.chartBox, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        {examOptions.length === 0 ? (
          <Text style={{ color: theme.colors.textSecondary, textAlign: 'center', paddingVertical: 16 }}>
            No examinations found for this year
          </Text>
        ) : (
          <TermLineChart labels={examLineChart.labels} values={examLineChart.values} />
        )}
      </View>

      <SectionHeader title="Subject percentages" />
      <View style={[styles.chartBox, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        {active.subjects.length === 0 ? (
          <Text style={{ color: theme.colors.textSecondary, textAlign: 'center', paddingVertical: 16 }}>
            No marks for this examination yet
          </Text>
        ) : (
          <SubjectBarChart labels={subjectBarChart.labels} values={subjectBarChart.values} />
        )}
      </View>

      <View style={styles.listHeader}>
        <Text style={[styles.listTitle, { color: theme.colors.text }]}>Subject-wise marks</Text>
        <TouchableOpacity
          style={[styles.termFilter, { backgroundColor: theme.colors.primaryLight }]}
          onPress={() => setExamModal(true)}
        >
          <Text style={[styles.termFilterText, { color: theme.colors.primary }]} numberOfLines={1}>
            {active.name}
          </Text>
          <Ionicons name="chevron-down" size={14} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {active.subjects.length === 0 ? (
        <View style={[styles.chartBox, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>
            No subject marks found. Try another academic year in Settings.
          </Text>
        </View>
      ) : (
        active.subjects.map((sub) => (
          <TouchableOpacity
            key={sub.id}
            activeOpacity={0.75}
            style={[styles.subjectCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={() => router.push(`/marks/subject/${sub.id}`)}
          >
            <View style={styles.subjectLeft}>
              <View style={[styles.subjectIcon, { backgroundColor: theme.colors.primaryLight }]}>
                <MaterialIcons name={ICON_MAP[sub.icon] ?? 'school'} size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.subjectCopy}>
                <Text style={[styles.subjectName, { color: theme.colors.text }]}>{sub.subject}</Text>
                <Text style={[styles.subjectMeta, { color: theme.colors.textSecondary }]}>
                  Grade {sub.grade || '—'} ·{' '}
                  {sub.maxScore > 0 ? Math.round((sub.score / sub.maxScore) * 100) : 0}%
                </Text>
              </View>
            </View>
            <View style={styles.subjectRight}>
              <Text style={[styles.subjectScore, { color: theme.colors.primary }]}>
                {sub.score}/{sub.maxScore}
              </Text>
              <ProgressBar percent={sub.maxScore > 0 ? (sub.score / sub.maxScore) * 100 : 0} height={5} />
            </View>
          </TouchableOpacity>
        ))
      )}

      <Modal visible={examModal} transparent animationType="fade" onRequestClose={() => setExamModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setExamModal(false)}>
          <View style={[styles.modalSheet, cardShadow, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Select examination</Text>
            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {(examOptions.length > 0 ? examOptions : [overviewFallback]).map((exam) => (
                <TouchableOpacity
                  key={exam.id}
                  style={[styles.termOption, preferredExamId === exam.id && { backgroundColor: theme.colors.primaryLight }]}
                  onPress={() => {
                    setExamId(exam.id);
                    setExamModal(false);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: preferredExamId === exam.id ? theme.colors.primary : theme.colors.text,
                        fontWeight: '600',
                      }}
                    >
                      {exam.name}
                    </Text>
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                      {exam.subjects.length} subjects · {exam.totalPercent}%
                    </Text>
                  </View>
                  {preferredExamId === exam.id ? <Ionicons name="checkmark" size={20} color={theme.colors.primary} /> : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: TAB_SCREEN_SCROLL_PADDING },
  contextBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
  },
  contextText: { fontSize: 12, fontWeight: '700', flex: 1 },
  updatedText: { fontSize: 11 },
  gpaCard: {
    backgroundColor: '#144835',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  gpaTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  gpaLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  gpaValue: { color: '#fff', fontSize: 36, fontWeight: '800', marginTop: 4 },
  gpaMax: { color: 'rgba(255,255,255,0.5)', fontSize: 16, fontWeight: '600' },
  gpaStarWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(162,193,68,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpaFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 12 },
  gpaMeta: { flex: 1 },
  gpaMetaLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700' },
  gpaMetaValue: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 2 },
  gpaDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.15)' },
  insightsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#a2c144',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 2,
  },
  insightsText: { color: '#144835', fontWeight: '700', fontSize: 13 },
  reportCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 8 },
  reportHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  reportIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  reportCopy: { flex: 1 },
  reportTitle: { fontSize: 16, fontWeight: '700' },
  reportSub: { fontSize: 12, marginTop: 2 },
  exportRow: { flexDirection: 'row' },
  chartBox: { borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 8, overflow: 'hidden' },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 12 },
  listTitle: { fontSize: 17, fontWeight: '700' },
  termFilter: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4, maxWidth: 180 },
  termFilterText: { fontSize: 12, fontWeight: '700', flexShrink: 1 },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  subjectLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  subjectIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  subjectCopy: { flex: 1 },
  subjectName: { fontSize: 15, fontWeight: '700' },
  subjectMeta: { fontSize: 12, marginTop: 2 },
  subjectRight: { width: 72, alignItems: 'flex-end', gap: 6 },
  subjectScore: { fontSize: 14, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40, maxHeight: '70%' },
  modalList: { maxHeight: 360 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  termOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 10, borderRadius: 10 },
});
