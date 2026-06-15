import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useExams } from '@/hooks/useApi';
import { ScreenHeader, LoadingScreen, ErrorScreen } from '@/components/ui/ScreenHeader';

export default function ExamScheduleScreen() {
  const theme = useTheme();
  const { data, isLoading, error, refetch } = useExams();

  if (isLoading) return <LoadingScreen />;
  if (error || !data) return <ErrorScreen message="Failed to load exam schedule" onRetry={() => refetch()} />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScreenHeader title="Exam Schedule" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {data.map((exam) => (
          <View key={exam.id} style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={[styles.subjectBadge, { backgroundColor: `${theme.colors.primary}1a` }]}>
              <MaterialIcons name="menu-book" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.subject, { color: theme.colors.text }]}>{exam.subject}</Text>
              <View style={styles.row}>
                <MaterialIcons name="calendar-today" size={14} color={theme.colors.textMuted} />
                <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>{exam.date}</Text>
              </View>
              <View style={styles.row}>
                <MaterialIcons name="schedule" size={14} color={theme.colors.textMuted} />
                <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>{exam.time}</Text>
              </View>
              <View style={styles.row}>
                <MaterialIcons name="meeting-room" size={14} color={theme.colors.textMuted} />
                <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>Hall: {exam.hallNumber}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16 },
  card: { flexDirection: 'row', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12, gap: 16 },
  subjectBadge: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardContent: { flex: 1 },
  subject: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
});
