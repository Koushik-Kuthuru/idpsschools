import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAttendanceRecords } from '@/hooks/useApi';
import { ScreenHeader, LoadingScreen, ErrorScreen } from '@/components/ui/ScreenHeader';

const STATUS_CONFIG = {
  present: { color: '#0fbd83', icon: 'check-circle' as const, label: 'Present' },
  absent: { color: '#ef4444', icon: 'cancel' as const, label: 'Absent' },
  late: { color: '#f59e0b', icon: 'schedule' as const, label: 'Late' },
  leave: { color: '#64748b', icon: 'event-busy' as const, label: 'Leave' },
};

export default function AttendanceDetailedScreen() {
  const theme = useTheme();
  const { data, isLoading, error, refetch } = useAttendanceRecords();

  if (isLoading) return <LoadingScreen />;
  if (error || !data) return <ErrorScreen message="Failed to load records" onRetry={() => refetch()} />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScreenHeader title="Detailed Attendance" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.monthTitle, { color: theme.colors.text }]}>January 2026</Text>
        {data.map((record) => {
          const config = STATUS_CONFIG[record.status];
          return (
            <View key={record.date} style={[styles.recordCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <View style={styles.dateCol}>
                <Text style={[styles.day, { color: theme.colors.text }]}>{record.date.split('-')[2]}</Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: 10 }}>JAN</Text>
              </View>
              <View style={styles.statusCol}>
                <MaterialIcons name={config.icon} size={20} color={config.color} />
                <Text style={{ color: config.color, fontWeight: '600', fontSize: 14 }}>{config.label}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16 },
  monthTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  recordCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  dateCol: { width: 48, alignItems: 'center' },
  day: { fontSize: 20, fontWeight: '700' },
  statusCol: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 16 },
});
