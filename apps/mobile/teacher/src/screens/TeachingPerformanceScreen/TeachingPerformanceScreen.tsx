import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { AppHeader, ScreenLayout } from '@/components';
import { mockApi } from '@/services/api';
import type { TeachingPerformance } from '@/types';
import { colors, textStyle } from '@/theme';
import { StyleSheet } from 'react-native';
import { borderRadius, spacing } from '@/theme';

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.xs,
  },
});

export function TeachingPerformanceScreen() {
  const [p, setP] = useState<TeachingPerformance | null>(null);
  useEffect(() => {
    mockApi.faculty.getPerformance().then(setP);
  }, []);

  if (!p) return null;

  return (
    <ScreenLayout scroll header={<AppHeader variant="back" title="PERFORMANCE" />}>
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={[textStyle('headlineSm')]}>This term</Text>
          <Text style={[textStyle('bodyMd')]}>Classes: {p.classesHandled} · Students: {p.totalStudents}</Text>
          <Text style={[textStyle('bodyMd')]}>Attendance mark rate: {p.attendanceMarkRate}%</Text>
          <Text style={[textStyle('bodyMd')]}>Exams evaluated: {p.examsEvaluated}</Text>
          <Text style={[textStyle('bodyMd')]}>Homework assigned: {p.homeworkAssigned}</Text>
          <Text style={[textStyle('bodyMd')]}>Submission rate: {p.submissionRate}%</Text>
          <Text style={[textStyle('bodyMd')]}>Rating: {p.feedbackRating}/5 ({p.feedbackCount} reviews)</Text>
          <Text style={[textStyle('bodyMd')]}>Class attendance: {p.classAttendanceRate}%</Text>
        </View>
      </View>
    </ScreenLayout>
  );
}
