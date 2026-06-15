import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { VicePrincipalHeader } from '../components/VicePrincipalHeader';
import { ScreenShell } from '../components/ScreenShell';
import { Card } from '../components/ui';
import { spacing, textStyle, useThemedStyles } from '../theme';
import type { VicePrincipalColorScheme } from '../theme/colors';

const exams = [
  { title: 'Term 2 Mid-Term', grades: '8–10', date: '18–22 Jun 2025', status: 'Scheduled' },
  { title: 'Pre-Board Mock', grades: '10–12', date: '01–05 Jul 2025', status: 'Planning' },
  { title: 'Practical Assessments', grades: '9–11', date: '10–14 Jun 2025', status: 'In Progress' },
];

export function ExaminationOversightScreen() {
  const navigation = useNavigation();
  const styles = useThemedStyles(createStyles);

  return (
    <ScreenShell header={<VicePrincipalHeader variant="back" title="Examination Oversight" onBack={() => navigation.goBack()} onFilter={() => {}} />}>
      <ScrollView contentContainerStyle={styles.content}>
        {exams.map((e) => (
          <Card key={e.title} style={styles.card}>
            <Text style={styles.title}>{e.title}</Text>
            <Text style={styles.meta}>Grades {e.grades} · {e.date}</Text>
            <Text style={styles.status}>{e.status}</Text>
          </Card>
        ))}
      </ScrollView>
    </ScreenShell>
  );
}

function createStyles(colors: VicePrincipalColorScheme) {
  return StyleSheet.create({
    content: { padding: spacing.gutter, gap: spacing.md, paddingBottom: 32 },
    card: { gap: 6 },
    title: { ...textStyle('titleLg'), color: colors.onSurface },
    meta: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant },
    status: { ...textStyle('labelMd'), color: colors.primary, fontWeight: '700' },
  });
}
