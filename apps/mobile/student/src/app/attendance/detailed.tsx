import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useAttendanceSummary, useAttendanceRecords } from '@/hooks/useApi';
import { ScreenHeader, LoadingScreen, ErrorScreen } from '@/components/ui/ScreenHeader';
import { AttendanceMonthlyLog } from '@/components/screens/AttendanceMonthlyLog';
import { filterOverallRecords } from '@/utils/attendanceUi';

export default function AttendanceDetailedScreen() {
  const theme = useTheme();
  const { data: summary, isLoading: summaryLoading } = useAttendanceSummary();
  const { data, isLoading, error, refetch, isRefetching } = useAttendanceRecords();

  const overallRecords = useMemo(() => (data ? filterOverallRecords(data) : []), [data]);

  if (isLoading || summaryLoading) return <LoadingScreen />;
  if (error || !data) return <ErrorScreen message="Failed to load records" onRetry={() => refetch()} />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <ScreenHeader title="Monthly view" fallbackRoute="/(tabs)/attendance" />
      <AttendanceMonthlyLog
        records={overallRecords}
        eyebrow="DAY-BY-DAY LOG"
        preferredMonth={summary?.month}
        refreshing={isRefetching}
        onRefresh={refetch}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
