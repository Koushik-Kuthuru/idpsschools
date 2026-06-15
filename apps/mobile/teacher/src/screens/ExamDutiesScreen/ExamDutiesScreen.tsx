import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { AppHeader, ScreenLayout } from '@/components';
import { mockApi } from '@/services/api';
import type { ExamDuty } from '@/types';
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
    borderWidth: 1,
    borderColor: colors.slate100,
  },
  role: { color: colors.primaryContainer, fontWeight: '700' },
});

export function ExamDutiesScreen() {
  const [duties, setDuties] = useState<ExamDuty[]>([]);
  useEffect(() => {
    mockApi.faculty.getExamDuties().then(setDuties);
  }, []);

  return (
    <ScreenLayout scroll header={<AppHeader variant="back" title="EXAM DUTIES" />}>
      <View style={styles.content}>
        <Text style={[textStyle('bodyMd'), { color: colors.onSurfaceVariant }]}>Final exams: Jan 27 – Feb 28</Text>
        {duties.map((d) => (
          <View key={d.id} style={styles.card}>
            <Text style={[textStyle('labelSm'), { color: colors.outline }]}>{d.date}</Text>
            <Text style={[textStyle('labelLg'), styles.role]}>
              {d.role === 'invigilator' ? 'Invigilator' : 'Evaluator'}
            </Text>
            <Text style={[textStyle('headlineSm')]}>{d.subject}</Text>
            <Text style={[textStyle('bodyMd')]}>{d.time} · Room {d.room}</Text>
            <Text style={[textStyle('bodyMd')]}>Classes: {d.classes}</Text>
            <Text style={[textStyle('labelSm')]}>Status: {d.status}</Text>
          </View>
        ))}
      </View>
    </ScreenLayout>
  );
}
