import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useMarksOverview } from '@/hooks/useApi';
import { useAuthStore } from '@/store';
import { ProgressBar } from '@/components/charts/ProgressChart';
import { SubjectBarChart } from '@/components/charts/MarksCharts';
import { ErrorScreen } from '@/components/ui/ScreenHeader';
import { MarksSkeleton } from '@/components/ui/Skeleton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button } from '@/components/ui/Button';
import { cardShadow } from '@/constants/shadows';
import type { AcademicTerm, MarksExamBucket, SubjectMark } from '@/types';
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

const TERM_TABS: { key: AcademicTerm; label: string }[] = [
  { key: 'term1', label: 'Term 1' },
  { key: 'term2', label: 'Term 2' },
];

/** Mirror server exam → term mapping so older API payloads still group correctly. */
function examNameToTerm(examName: string): AcademicTerm {
  const compact = String(examName ?? '')
    .replace(/[\s_-]+/g, '')
    .toUpperCase();
  if (!compact) return 'term2';
  // School uses two terms only — fold Term 3 / annual-style codes into Term 2.
  if (/(FINAL|ANNUAL|YEAREND)/.test(compact)) return 'term2';
  if (/TERM?[34]|PT[34]|PPT[34]|NB[34]|MA[34]|SE[34]|PA[34]/.test(compact)) return 'term2';
  if (/TERM?2|PT2|PPT2|NB2|MA2|SE2|PA2/.test(compact)) return 'term2';
  if (/TERM?1|PT1|PPT1|NB1|MA1|SE1|PA1/.test(compact)) return 'term1';
  return 'term2';
}

function withTerm(exam: MarksExamBucket): MarksExamBucket {
  return { ...exam, term: examNameToTerm(exam.name) };
}

export function MarksOverviewView({ showHeader = true }: { showHeader?: boolean }) {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, error, refetch } = useMarksOverview();
  const [term, setTerm] = useState<AcademicTerm>('term1');
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const allExams = useMemo(() => {
    if (!data) return [] as MarksExamBucket[];
    const fromApi = (data.exams ?? []).filter((exam) => (exam.subjects?.length ?? 0) > 0).map(withTerm);
    if (fromApi.length > 0) return fromApi;
    return [];
  }, [data]);

  const availableTerms = useMemo(() => TERM_TABS, []);

  const termExams = useMemo(
    () => allExams.filter((exam) => examNameToTerm(exam.name) === term),
    [allExams, term],
  );

  useEffect(() => {
    if (termExams.length === 0) {
      setSelectedExamId(null);
      return;
    }
    if (!selectedExamId || !termExams.some((exam) => exam.id === selectedExamId)) {
      setSelectedExamId(termExams[0].id);
    }
  }, [termExams, selectedExamId]);

  if (isLoading) return <MarksSkeleton />;
  if (error || !data) return <ErrorScreen message="Failed to load marks" onRetry={() => refetch()} />;

  const selectedExam = termExams.find((exam) => exam.id === selectedExamId) ?? null;
  const termAggregate = data.terms[term];
  const activeSubjects: SubjectMark[] = selectedExam?.subjects?.length
    ? selectedExam.subjects
    : termAggregate?.subjects ?? [];

  const activeStats = selectedExam ?? {
    id: term,
    name: availableTerms.find((t) => t.key === term)?.label ?? 'Term',
    gpa: termAggregate?.gpa ?? 0,
    grade: termAggregate?.grade ?? '—',
    rank: termAggregate?.rank ?? '—',
    totalPercent: termAggregate?.totalPercent ?? 0,
    subjects: activeSubjects,
  };

  const subjectBarChart = {
    labels: activeSubjects.map((s) => (s.subject.length > 6 ? `${s.subject.slice(0, 5)}…` : s.subject)),
    values: activeSubjects.map((s) => (s.maxScore > 0 ? Math.round((s.score / s.maxScore) * 100) : 0)),
  };

  const handleExport = async (type: 'transcript' | 'report') => {
    setExporting(true);
    try {
      const studentName = user?.name ?? 'Student';
      const exportBucket: MarksExamBucket = {
        id: activeStats.id,
        name: selectedExam ? selectedExam.name : activeStats.name,
        gpa: activeStats.gpa,
        grade: activeStats.grade,
        rank: activeStats.rank,
        totalPercent: activeStats.totalPercent,
        subjects: activeSubjects,
      };
      const fileName = buildMarksPdfFileName(type, studentName, exportBucket.name, user?.className);
      const uri = await exportMarksPdf(data, exportBucket, studentName, type, {
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
            {user?.className ?? 'Class'}
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
            <Text style={styles.gpaLabel}>{selectedExam ? selectedExam.name.toUpperCase() : 'TERM GPA'}</Text>
            <Text style={styles.gpaValue}>
              {activeStats.gpa} <Text style={styles.gpaMax}>/ 4.0</Text>
            </Text>
          </View>
          <View style={styles.gpaStarWrap}>
            <Ionicons name="star" size={24} color="#a2c144" />
          </View>
        </View>
        <View style={styles.gpaFooter}>
          <View style={styles.gpaMeta}>
            <Text style={styles.gpaMetaLabel}>GRADE</Text>
            <Text style={styles.gpaMetaValue}>{activeStats.grade}</Text>
          </View>
          <View style={styles.gpaDivider} />
          <View style={styles.gpaMeta}>
            <Text style={styles.gpaMetaLabel}>RANK</Text>
            <Text style={styles.gpaMetaValue}>{activeStats.rank}</Text>
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
              {selectedExam ? selectedExam.name : availableTerms.find((t) => t.key === term)?.label} · {activeStats.totalPercent}%
            </Text>
          </View>
        </View>
        <View style={styles.exportRow}>
          <Button title="Transcript" variant="outline" onPress={() => handleExport('transcript')} loading={exporting} style={{ flex: 1 }} />
          <Button title="Report card" onPress={() => handleExport('report')} loading={exporting} style={{ flex: 1, marginLeft: 8 }} />
        </View>
      </View>

      <SectionHeader title="Terms" />
      <View style={styles.termTabs}>
        {availableTerms.map((tab) => {
          const active = term === tab.key;
              const count = allExams.filter((exam) => examNameToTerm(exam.name) === tab.key).length;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.termTab,
                cardShadow,
                {
                  backgroundColor: active ? theme.colors.primary : theme.colors.card,
                  borderColor: active ? theme.colors.primary : theme.colors.border,
                },
              ]}
              onPress={() => setTerm(tab.key)}
              activeOpacity={0.85}
            >
              <Text style={[styles.termTabLabel, { color: active ? '#fff' : theme.colors.text }]}>{tab.label}</Text>
              <Text style={[styles.termTabSub, { color: active ? 'rgba(255,255,255,0.75)' : theme.colors.textSecondary }]}>
                {count} exam{count === 1 ? '' : 's'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <SectionHeader title={`Examinations · ${availableTerms.find((t) => t.key === term)?.label}`} />
      {termExams.length === 0 ? (
        <View style={[styles.emptyCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Ionicons name="school-outline" size={28} color={theme.colors.textMuted} />
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No examinations in this term for the selected academic year
          </Text>
        </View>
      ) : (
        <View style={styles.examList}>
          {termExams.map((exam) => {
            const selected = selectedExamId === exam.id;
            return (
              <TouchableOpacity
                key={exam.id}
                style={[
                  styles.examCard,
                  cardShadow,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: selected ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                onPress={() => setSelectedExamId(exam.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.examIcon, { backgroundColor: selected ? theme.colors.primary : `${theme.colors.primary}14` }]}>
                  <Ionicons name="clipboard-outline" size={18} color={selected ? '#fff' : theme.colors.primary} />
                </View>
                <View style={styles.examCopy}>
                  <Text style={[styles.examName, { color: theme.colors.text }]}>{exam.name}</Text>
                  <Text style={[styles.examMeta, { color: theme.colors.textSecondary }]}>
                    {exam.subjects.length} subjects · {exam.totalPercent}% · Grade {exam.grade}
                  </Text>
                </View>
                <Ionicons
                  name={selected ? 'chevron-down' : 'chevron-forward'}
                  size={18}
                  color={selected ? theme.colors.primary : theme.colors.textMuted}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {selectedExam ? (
        <>
          <SectionHeader title={`Subject-wise · ${selectedExam.name}`} />
          <View style={[styles.chartBox, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            {activeSubjects.length === 0 ? (
              <Text style={{ color: theme.colors.textSecondary, textAlign: 'center', paddingVertical: 16 }}>
                No subject marks for this examination
              </Text>
            ) : (
              <SubjectBarChart labels={subjectBarChart.labels} values={subjectBarChart.values} />
            )}
          </View>

          {activeSubjects.map((sub) => (
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
          ))}
        </>
      ) : null}
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
  termTabs: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  termTab: { flex: 1, borderRadius: 14, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 10 },
  termTabLabel: { fontSize: 15, fontWeight: '800' },
  termTabSub: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  examList: { gap: 8, marginBottom: 8 },
  examCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  examIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  examCopy: { flex: 1 },
  examName: { fontSize: 15, fontWeight: '700' },
  examMeta: { fontSize: 12, marginTop: 2 },
  chartBox: { borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 8, overflow: 'hidden' },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    marginBottom: 8,
  },
  emptyText: { fontSize: 13, fontWeight: '500', textAlign: 'center', paddingHorizontal: 16 },
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
});
