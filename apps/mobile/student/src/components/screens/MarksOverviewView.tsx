import { useState } from 'react';
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
import type { AcademicTerm } from '@/types';
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

const TERM_OPTIONS: { key: AcademicTerm; label: string }[] = [
  { key: 'term1', label: 'Term 1' },
  { key: 'term2', label: 'Term 2' },
  { key: 'term3', label: 'Term 3' },
  { key: 'annual', label: 'Annual' },
];

export function MarksOverviewView({ showHeader = true }: { showHeader?: boolean }) {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, error, refetch } = useMarksOverview();
  const [term, setTerm] = useState<AcademicTerm>('term1');
  const [termModal, setTermModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  if (isLoading) return <MarksSkeleton />;
  if (error || !data) return <ErrorScreen message="Failed to load marks" onRetry={() => refetch()} />;

  const active = data.terms[term];
  if (!active) return <ErrorScreen message="Failed to load marks" onRetry={() => refetch()} />;

  const termLineChart = {
    labels: TERM_OPTIONS.map((t) => t.label),
    values: TERM_OPTIONS.map((t) => data.terms[t.key].totalPercent),
  };

  const subjectBarChart = {
    labels: active.subjects.map((s) => (s.subject.length > 6 ? `${s.subject.slice(0, 5)}…` : s.subject)),
    values: active.subjects.map((s) => Math.round((s.score / s.maxScore) * 100)),
  };

  const handleExport = async (type: 'transcript' | 'report') => {
    setExporting(true);
    try {
      const studentName = user?.name ?? 'Student';
      const fileName = buildMarksPdfFileName(type, studentName, term, user?.className);
      const uri = await exportMarksPdf(data, term, studentName, type, {
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
            {user?.className ?? 'Class'} · {TERM_OPTIONS.find((t) => t.key === term)?.label}
          </Text>
          <Text style={[styles.updatedText, { color: theme.colors.textMuted }]}>Updated {data.lastUpdated}</Text>
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
              Overall {active.totalPercent}% · Subject-wise below
            </Text>
          </View>
        </View>
        <View style={styles.exportRow}>
          <Button title="Transcript" variant="outline" onPress={() => handleExport('transcript')} loading={exporting} style={{ flex: 1 }} />
          <Button title="Report card" onPress={() => handleExport('report')} loading={exporting} style={{ flex: 1, marginLeft: 8 }} />
        </View>
      </View>

      <SectionHeader title="Term performance" />
      <View style={[styles.chartBox, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <TermLineChart labels={termLineChart.labels} values={termLineChart.values} />
      </View>

      <SectionHeader title="Subject percentages" />
      <View style={[styles.chartBox, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <SubjectBarChart labels={subjectBarChart.labels} values={subjectBarChart.values} />
      </View>

      <View style={styles.listHeader}>
        <Text style={[styles.listTitle, { color: theme.colors.text }]}>Subject-wise marks</Text>
        <TouchableOpacity style={[styles.termFilter, { backgroundColor: theme.colors.primaryLight }]} onPress={() => setTermModal(true)}>
          <Text style={[styles.termFilterText, { color: theme.colors.primary }]}>
            {TERM_OPTIONS.find((t) => t.key === term)?.label}
          </Text>
          <Ionicons name="chevron-down" size={14} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {active.subjects.map((sub) => (
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
                Grade {sub.grade} · {Math.round((sub.score / sub.maxScore) * 100)}%
              </Text>
            </View>
          </View>
          <View style={styles.subjectRight}>
            <Text style={[styles.subjectScore, { color: theme.colors.primary }]}>
              {sub.score}/{sub.maxScore}
            </Text>
            <ProgressBar percent={(sub.score / sub.maxScore) * 100} height={5} />
          </View>
        </TouchableOpacity>
      ))}

      <Modal visible={termModal} transparent animationType="fade" onRequestClose={() => setTermModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setTermModal(false)}>
          <View style={[styles.modalSheet, cardShadow, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Select term</Text>
            {TERM_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.termOption, term === opt.key && { backgroundColor: theme.colors.primaryLight }]}
                onPress={() => {
                  setTerm(opt.key);
                  setTermModal(false);
                }}
              >
                <Text style={{ color: term === opt.key ? theme.colors.primary : theme.colors.text, fontWeight: '600' }}>
                  {opt.label}
                </Text>
                {term === opt.key ? <Ionicons name="checkmark" size={20} color={theme.colors.primary} /> : null}
              </TouchableOpacity>
            ))}
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
  },
  contextText: { fontSize: 13, fontWeight: '700' },
  updatedText: { fontSize: 10, fontWeight: '500' },
  gpaCard: {
    backgroundColor: '#144835',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  gpaTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  gpaLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  gpaValue: { color: '#fff', fontSize: 34, fontWeight: '800', marginTop: 4 },
  gpaMax: { fontSize: 16, fontWeight: '500', opacity: 0.7 },
  gpaStarWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpaFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  gpaMeta: { minWidth: 56 },
  gpaMetaLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700', letterSpacing: 0.6 },
  gpaMetaValue: { color: '#fff', fontSize: 17, fontWeight: '700', marginTop: 2 },
  gpaDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 14 },
  insightsBtn: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  insightsText: { color: '#144835', fontWeight: '700', fontSize: 12 },
  reportCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  reportHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  reportIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  reportCopy: { flex: 1 },
  reportTitle: { fontSize: 15, fontWeight: '700' },
  reportSub: { fontSize: 12, marginTop: 2 },
  exportRow: { flexDirection: 'row' },
  chartBox: { padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 8, overflow: 'hidden' },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 12 },
  listTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  termFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  termFilterText: { fontSize: 12, fontWeight: '700' },
  subjectCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  subjectLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  subjectIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  subjectCopy: { flex: 1 },
  subjectName: { fontSize: 15, fontWeight: '700' },
  subjectMeta: { fontSize: 12, marginTop: 2 },
  subjectRight: { alignItems: 'flex-end', minWidth: 88 },
  subjectScore: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  termOption: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 10, borderRadius: 10 },
});
