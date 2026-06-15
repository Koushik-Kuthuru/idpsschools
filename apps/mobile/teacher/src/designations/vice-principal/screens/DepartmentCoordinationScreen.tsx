import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { VicePrincipalHeader } from '../components/VicePrincipalHeader';
import { ScreenShell } from '../components/ScreenShell';
import { Card } from '../components/ui';
import { ProgressBar } from '../components/ui';
import { spacing, textStyle, useThemedStyles } from '../theme';
import type { VicePrincipalColorScheme } from '../theme/colors';

const departments = [
  { name: 'Science', hod: 'Dr. Meera Iyer', progress: 88, pending: 2 },
  { name: 'Mathematics', hod: 'Mr. Arjun Nair', progress: 92, pending: 0 },
  { name: 'Languages', hod: 'Ms. Preethi Suresh', progress: 76, pending: 4 },
  { name: 'Humanities', hod: 'Mr. Ravi Kumar', progress: 81, pending: 1 },
];

export function DepartmentCoordinationScreen() {
  const navigation = useNavigation();
  const styles = useThemedStyles(createStyles);

  return (
    <ScreenShell header={<VicePrincipalHeader variant="back" title="Department Coordination" onBack={() => navigation.goBack()} />}>
      <ScrollView contentContainerStyle={styles.content}>
        {departments.map((d) => (
          <Card key={d.name} style={styles.card}>
            <Text style={styles.title}>{d.name}</Text>
            <Text style={styles.hod}>HOD: {d.hod}</Text>
            <ProgressBar percent={d.progress} />
            <Text style={styles.meta}>Coordination {d.progress}% · {d.pending} pending items</Text>
          </Card>
        ))}
      </ScrollView>
    </ScreenShell>
  );
}

function createStyles(colors: VicePrincipalColorScheme) {
  return StyleSheet.create({
    content: { padding: spacing.gutter, gap: spacing.md, paddingBottom: 32 },
    card: { gap: 8 },
    title: { ...textStyle('titleLg'), color: colors.onSurface },
    hod: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant },
    meta: { ...textStyle('labelMd'), color: colors.primary, fontWeight: '600' },
  });
}
