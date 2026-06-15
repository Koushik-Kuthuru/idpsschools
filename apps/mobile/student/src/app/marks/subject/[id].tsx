import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useSubjectMarks } from '@/hooks/useApi';
import { ScreenHeader, LoadingScreen, ErrorScreen } from '@/components/ui/ScreenHeader';

export default function SubjectMarksScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { data, isLoading, error, refetch } = useSubjectMarks(id ?? '');

  if (isLoading) return <LoadingScreen />;
  if (error || !data) return <ErrorScreen message="Subject not found" onRetry={() => refetch()} />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScreenHeader title={data.subject} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.scoreCard, { backgroundColor: theme.colors.card, borderColor: `${theme.colors.primary}1a` }]}>
          <Text style={[styles.totalScore, { color: theme.colors.primary }]}>{data.score}/{data.maxScore}</Text>
          <View style={[styles.gradeBadge, { backgroundColor: `${theme.colors.primary}1a` }]}>
            <Text style={{ color: theme.colors.primary, fontWeight: '700', fontSize: 18 }}>Grade: {data.grade}</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Mark Breakdown</Text>
        {[
          { label: 'Internal Marks', value: data.internalMarks, icon: 'assignment' as const },
          { label: 'External Marks', value: data.externalMarks, icon: 'quiz' as const },
          { label: 'Total Marks', value: data.score, icon: 'grade' as const },
        ].map((item) => (
          <View key={item.label} style={[styles.breakdownCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={[styles.iconBox, { backgroundColor: `${theme.colors.primary}1a` }]}>
              <MaterialIcons name={item.icon} size={22} color={theme.colors.primary} />
            </View>
            <Text style={[styles.breakdownLabel, { color: theme.colors.textSecondary }]}>{item.label}</Text>
            <Text style={[styles.breakdownValue, { color: theme.colors.text }]}>{item.value}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16 },
  scoreCard: { padding: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', marginBottom: 24 },
  totalScore: { fontSize: 48, fontWeight: '800' },
  gradeBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginTop: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  breakdownCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 8, gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  breakdownLabel: { flex: 1, fontSize: 14 },
  breakdownValue: { fontSize: 18, fontWeight: '700' },
});
