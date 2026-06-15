import { ScrollView, View, Text, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { useTheme } from '@/hooks/useTheme';
import { usePerformanceAnalysis } from '@/hooks/useApi';
import { ScreenHeader, LoadingScreen, ErrorScreen } from '@/components/ui/ScreenHeader';

const screenWidth = Dimensions.get('window').width - 32;

export default function PerformanceAnalysisScreen() {
  const theme = useTheme();
  const { data, isLoading, error, refetch } = usePerformanceAnalysis();

  if (isLoading) return <LoadingScreen />;
  if (error || !data) return <ErrorScreen message="Failed to load performance" onRetry={() => refetch()} />;

  const chartConfig = {
    backgroundColor: theme.colors.card,
    backgroundGradientFrom: theme.colors.card,
    backgroundGradientTo: theme.colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(15, 189, 131, ${opacity})`,
    labelColor: () => theme.colors.textSecondary,
    style: { borderRadius: 12 },
    propsForBackgroundLines: { stroke: theme.colors.border },
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScreenHeader title="Performance Analysis" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Subject Performance (Bar)</Text>
        <BarChart
          data={{ labels: data.labels, datasets: [{ data: data.barData }] }}
          width={screenWidth}
          height={220}
          chartConfig={chartConfig}
          style={styles.chart}
          yAxisLabel=""
          yAxisSuffix="%"
          fromZero
        />

        <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 24 }]}>Trend Analysis (Line)</Text>
        <LineChart
          data={{ labels: data.labels, datasets: [{ data: data.lineData, strokeWidth: 2 }] }}
          width={screenWidth}
          height={220}
          chartConfig={chartConfig}
          style={styles.chart}
          bezier
        />

        <View style={[styles.insightCard, { backgroundColor: `${theme.colors.primary}0d`, borderColor: `${theme.colors.primary}1a` }]}>
          <Text style={[styles.insightTitle, { color: theme.colors.text }]}>Trend Analysis</Text>
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
  chart: { borderRadius: 12, marginBottom: 8 },
  insightCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginTop: 16 },
  insightTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
});
