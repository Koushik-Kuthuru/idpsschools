import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { VicePrincipalHeader } from '../components/VicePrincipalHeader';
import { ScreenShell } from '../components/ScreenShell';
import { Card } from '../components/ui';
import { ProgressBar } from '../components/ui';
import { spacing, textStyle, useThemedStyles } from '../theme';
import type { VicePrincipalColorScheme } from '../theme/colors';

const classes = [
  { grade: 'Grade 8', avg: 78, pass: 91 },
  { grade: 'Grade 9', avg: 82, pass: 94 },
  { grade: 'Grade 10', avg: 85, pass: 96 },
  { grade: 'Grade 11', avg: 80, pass: 92 },
];

const subjects = [
  { name: 'Mathematics', avg: 84 },
  { name: 'Science', avg: 81 },
  { name: 'English', avg: 79 },
  { name: 'Social Studies', avg: 77 },
];

export function AcademicPerformanceScreen() {
  const navigation = useNavigation();
  const styles = useThemedStyles(createStyles);
  const [term] = useState('Term 2');

  return (
    <ScreenShell header={<VicePrincipalHeader variant="back" title="Academic Performance" onBack={() => navigation.goBack()} onFilter={() => {}} />}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.term}>{term} · 2025–26</Text>
        <Text style={styles.section}>Class-wise Performance</Text>
        {classes.map((c) => (
          <Card key={c.grade} style={styles.card}>
            <View style={styles.row}><Text style={styles.title}>{c.grade}</Text><Text style={styles.val}>{c.avg}% avg</Text></View>
            <ProgressBar percent={c.pass} />
            <Text style={styles.meta}>Pass rate {c.pass}%</Text>
          </Card>
        ))}
        <Text style={styles.section}>Subject Averages</Text>
        {subjects.map((s) => (
          <Card key={s.name} style={styles.card}>
            <View style={styles.row}><Text style={styles.title}>{s.name}</Text><Text style={styles.val}>{s.avg}%</Text></View>
            <ProgressBar percent={s.avg} />
          </Card>
        ))}
      </ScrollView>
    </ScreenShell>
  );
}

function createStyles(colors: VicePrincipalColorScheme) {
  return StyleSheet.create({
    content: { padding: spacing.gutter, gap: spacing.md, paddingBottom: 32 },
    term: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
    section: { ...textStyle('headlineMd'), color: colors.onSurface },
    card: { gap: 8 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    title: { ...textStyle('bodyMd'), fontWeight: '700', color: colors.onSurface },
    val: { ...textStyle('bodyMd'), fontWeight: '700', color: colors.primary },
    meta: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  });
}
