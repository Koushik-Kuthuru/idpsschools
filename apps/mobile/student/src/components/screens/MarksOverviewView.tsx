import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Modal, Alert, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useTheme } from '@/hooks/useTheme';
import { useMarksOverview } from '@/hooks/useApi';
import { useAuthStore } from '@/store';
import { ProgressBar } from '@/components/charts/ProgressChart';
import { LoadingScreen, ErrorScreen } from '@/components/ui/ScreenHeader';
import { Button } from '@/components/ui/Button';
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

  if (isLoading) return <LoadingScreen />;
  if (error || !data) return <ErrorScreen message="Failed to load marks" onRetry={() => refetch()} />;

  const active = data.terms[term];
  const chartWidth = Dimensions.get('window').width - 48;
  const chartConfig = {
    backgroundColor: theme.colors.card,
    backgroundGradientFrom: theme.colors.card,
    backgroundGradientTo: theme.colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(15, 189, 131, ${opacity})`,
    labelColor: () => theme.colors.textMuted,
    propsForBackgroundLines: { stroke: theme.colors.border },
  };
  const barData = {
    labels: active.subjects.map((s) => s.subject.slice(0, 4)),
    datasets: [{ data: active.subjects.map((s) => Math.round((s.score / s.maxScore) * 100)) }],
  };
  const lineData = {
    labels: TERM_OPTIONS.map((t) => t.label.replace(' ', '')),
    datasets: [{ data: TERM_OPTIONS.map((t) => data.terms[t.key].totalPercent) }],
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
    <ScrollView contentContainerStyle={styles.scroll} style={{ backgroundColor: theme.colors.background }}>
      {showHeader && (
        <View style={styles.contextRow}>
          <Text style={{ color: theme.colors.primary, fontSize: 14, fontWeight: '700' }}>
            CLASS 10-A | {TERM_OPTIONS.find((t) => t.key === term)?.label.toUpperCase()}
          </Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: 10 }}>Last Updated: {data.lastUpdated}</Text>
        </View>
      )}

      <View style={styles.gpaCardWrap}>
        <View style={[styles.gpaCard, { backgroundColor: theme.colors.primary }]}>
          <View style={styles.gpaTop}>
            <View>
              <Text style={styles.gpaLabel}>OVERALL GPA</Text>
              <Text style={styles.gpaValue}>
                {active.gpa} <Text style={styles.gpaMax}>/ 4.0</Text>
              </Text>
            </View>
            <MaterialIcons name="stars" size={32} color="rgba(255,255,255,0.9)" />
          </View>
          <View style={styles.gpaFooter}>
            <View>
              <Text style={styles.gpaMetaLabel}>GRADE</Text>
              <Text style={styles.gpaMetaValue}>{active.grade}</Text>
            </View>
            <View style={styles.gpaDivider} />
            <View>
              <Text style={styles.gpaMetaLabel}>RANK</Text>
              <Text style={styles.gpaMetaValue}>{active.rank}</Text>
            </View>
            <TouchableOpacity style={styles.insightsBtn} onPress={() => router.push('/marks/performance')}>
              <Text style={{ color: theme.colors.primary, fontWeight: '700', fontSize: 12 }}>Performance Insights</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={[styles.reportCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Text style={[styles.reportTitle, { color: theme.colors.text }]}>Academic Report</Text>
        <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>Overall: {active.totalPercent}% • Subject-wise analysis below</Text>
        <View style={styles.exportRow}>
          <Button title="Transcript" variant="outline" onPress={() => handleExport('transcript')} loading={exporting} style={{ flex: 1 }} />
          <Button title="Report Card" onPress={() => handleExport('report')} loading={exporting} style={{ flex: 1, marginLeft: 8 }} />
        </View>
      </View>

      <View style={[styles.chartBox, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Text style={[styles.chartTitle, { color: theme.colors.text }]}>Term Performance</Text>
        <LineChart data={lineData} width={chartWidth} height={160} chartConfig={chartConfig} bezier style={{ borderRadius: 8 }} />
      </View>

      <View style={[styles.chartBox, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Text style={[styles.chartTitle, { color: theme.colors.text }]}>Subject Percentages</Text>
        <BarChart data={barData} width={chartWidth} height={180} chartConfig={chartConfig} yAxisLabel="" yAxisSuffix="%" style={{ borderRadius: 8 }} />
      </View>

      <View style={styles.listHeader}>
        <Text style={[styles.listTitle, { color: theme.colors.text }]}>Subject-Wise Marks</Text>
        <TouchableOpacity onPress={() => setTermModal(true)}>
          <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: '600' }}>Filter by Term ▾</Text>
        </TouchableOpacity>
      </View>

      {active.subjects.map((sub) => (
        <TouchableOpacity
          key={sub.id}
          style={[styles.subjectCard, { backgroundColor: `${theme.colors.primary}08`, borderColor: `${theme.colors.primary}0d` }]}
          onPress={() => router.push(`/marks/subject/${sub.id}`)}
        >
          <View style={styles.subjectLeft}>
            <View style={[styles.subjectIcon, { backgroundColor: `${theme.colors.primary}1a` }]}>
              <MaterialIcons name={ICON_MAP[sub.icon] ?? 'school'} size={22} color={theme.colors.primary} />
            </View>
            <View>
              <Text style={[styles.subjectName, { color: theme.colors.text }]}>{sub.subject}</Text>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
                Grade: {sub.grade} • {Math.round((sub.score / sub.maxScore) * 100)}%
              </Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end', minWidth: 90 }}>
            <Text style={{ color: theme.colors.primary, fontSize: 18, fontWeight: '700' }}>
              {sub.score}/{sub.maxScore}
            </Text>
            <ProgressBar percent={(sub.score / sub.maxScore) * 100} height={4} />
          </View>
        </TouchableOpacity>
      ))}

      <Modal visible={termModal} transparent animationType="fade" onRequestClose={() => setTermModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setTermModal(false)}>
          <View style={[styles.modalSheet, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Filter by Term</Text>
            {TERM_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.termOption, term === opt.key && { backgroundColor: `${theme.colors.primary}15` }]}
                onPress={() => {
                  setTerm(opt.key);
                  setTermModal(false);
                }}
              >
                <Text style={{ color: term === opt.key ? theme.colors.primary : theme.colors.text, fontWeight: '600' }}>{opt.label}</Text>
                {term === opt.key && <MaterialIcons name="check" size={20} color={theme.colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: TAB_SCREEN_SCROLL_PADDING },
  contextRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  gpaCardWrap: { marginBottom: 16 },
  gpaCard: { borderRadius: 16, padding: 24 },
  gpaTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  gpaLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '600', letterSpacing: 2 },
  gpaValue: { color: '#fff', fontSize: 36, fontWeight: '800', marginTop: 4 },
  gpaMax: { fontSize: 18, fontWeight: '400', opacity: 0.7 },
  gpaFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  gpaMetaLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700' },
  gpaMetaValue: { color: '#fff', fontSize: 18, fontWeight: '700' },
  gpaDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 16 },
  insightsBtn: { marginLeft: 'auto', backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  reportCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  reportTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  exportRow: { flexDirection: 'row', marginTop: 12 },
  chartBox: { padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
  chartTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  listTitle: { fontSize: 18, fontWeight: '700' },
  subjectCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  subjectLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  subjectIcon: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  subjectName: { fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  termOption: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 8, borderRadius: 8 },
});
