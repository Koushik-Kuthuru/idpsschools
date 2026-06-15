import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useAttendanceSubjects } from '@/hooks/useApi';
import { ProgressBar } from '@/components/charts/ProgressChart';
import { ScreenHeader, LoadingScreen, ErrorScreen } from '@/components/ui/ScreenHeader';

export default function AttendanceBySubjectScreen() {
  const theme = useTheme();
  const { data, isLoading, error, refetch } = useAttendanceSubjects();

  if (isLoading) return <LoadingScreen />;
  if (error || !data) return <ErrorScreen message="Failed to load subjects" onRetry={() => refetch()} />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScreenHeader title="Attendance By Subject" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {data.map((sub) => (
          <View key={sub.id} style={[styles.card, { backgroundColor: theme.colors.card, borderColor: `${theme.colors.primary}0d` }]}>
            <View style={styles.row}>
              <Text style={[styles.subject, { color: theme.colors.text }]}>{sub.subject}</Text>
              <Text style={[styles.percent, { color: theme.colors.primary }]}>{sub.percent}%</Text>
            </View>
            <ProgressBar percent={sub.percent} height={8} />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16 },
  card: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  subject: { fontSize: 16, fontWeight: '600' },
  percent: { fontSize: 16, fontWeight: '700' },
});
