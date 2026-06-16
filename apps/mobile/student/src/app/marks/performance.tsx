import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { usePerformanceAnalysis } from '@/hooks/useApi';
import { ScreenHeader, LoadingScreen, ErrorScreen } from '@/components/ui/ScreenHeader';
import { TermLineChart, SubjectBarChart } from '@/components/charts/MarksCharts';
import { cardShadow } from '@/constants/shadows';

export default function PerformanceAnalysisScreen() {
  const theme = useTheme();
  const { data, isLoading, error, refetch } = usePerformanceAnalysis();

  if (isLoading) return <LoadingScreen />;
  if (error || !data) return <ErrorScreen message="Failed to load performance" onRetry={() => refetch()} />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScreenHeader title="Performance Analysis" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Subject performance</Text>
        <View style={[styles.chartBox, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <SubjectBarChart labels={data.labels} values={data.barData} />
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 16 }]}>Trend analysis</Text>
        <View style={[styles.chartBox, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <TermLineChart labels={data.labels} values={data.lineData} />
        </View>

        <View style={[styles.insightCard, { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primaryBorder }]}>
          <Text style={[styles.insightTitle, { color: theme.colors.text }]}>Trend analysis</Text>
          <Text style={{ color: theme.colors.textSecondary, lineHeight: 22 }}>
            Your performance has improved by 16% over the last 5 months. Keep up the excellent work!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  chartBox: { padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 8, overflow: 'hidden' },
  insightCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginTop: 8 },
  insightTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
});
