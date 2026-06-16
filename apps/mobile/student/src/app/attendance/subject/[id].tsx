import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useAttendanceSummary, useAttendanceRecords, useAttendanceSubjects } from '@/hooks/useApi';
import { ScreenHeader, LoadingScreen, ErrorScreen } from '@/components/ui/ScreenHeader';
import { AttendanceMonthlyLog } from '@/components/screens/AttendanceMonthlyLog';
import { filterSubjectRecords } from '@/utils/attendanceUi';

export default function AttendanceSubjectScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: summary, isLoading: summaryLoading } = useAttendanceSummary();
  const { data: subjects, isLoading: subjectsLoading } = useAttendanceSubjects();
  const { data, isLoading, error, refetch, isRefetching } = useAttendanceRecords();

  const subject = subjects?.find((s) => s.id === id);
  const subjectRecords = useMemo(
    () => (data && subject ? filterSubjectRecords(data, subject.subject) : []),
    [data, subject],
  );

  if (isLoading || summaryLoading || subjectsLoading) return <LoadingScreen />;
  if (error || !data) return <ErrorScreen message="Failed to load records" onRetry={() => refetch()} />;
  if (!subject) return <ErrorScreen message="Subject not found" onRetry={() => refetch()} />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <ScreenHeader title={subject.subject} fallbackRoute="/attendance/by-subject" />
      <AttendanceMonthlyLog
        records={subjectRecords}
        eyebrow="SUBJECT ATTENDANCE"
        heroExtra={`${subject.percent}% overall`}
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
