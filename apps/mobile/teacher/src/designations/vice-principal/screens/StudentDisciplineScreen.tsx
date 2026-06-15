import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { VicePrincipalHeader } from '../components/VicePrincipalHeader';
import { ScreenShell } from '../components/ScreenShell';
import { Card } from '../components/ui';
import { disciplineCases } from '../data/mockData';
import { spacing, textStyle, useThemedStyles } from '../theme';
import type { VicePrincipalColorScheme } from '../theme/colors';

export function StudentDisciplineScreen() {
  const navigation = useNavigation();
  const styles = useThemedStyles(createStyles);

  return (
    <ScreenShell header={<VicePrincipalHeader variant="back" title="Discipline Tracker" onBack={() => navigation.goBack()} onFilter={() => {}} />}>
      <ScrollView contentContainerStyle={styles.content}>
        {disciplineCases.map((d) => (
          <Card key={d.id} style={styles.card}>
            <Text style={styles.name}>{d.name} ({d.class})</Text>
            <Text style={styles.issue}>{d.issue}</Text>
            <View style={styles.row}>
              <Text style={[styles.sev, d.severity === 'High' ? styles.high : d.severity === 'Medium' ? styles.med : styles.low]}>{d.severity}</Text>
              <Text style={styles.date}>{d.date}</Text>
            </View>
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
    name: { ...textStyle('titleLg'), color: colors.onSurface },
    issue: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
    sev: { ...textStyle('labelMd'), fontWeight: '700' },
    high: { color: colors.error },
    med: { color: colors.amber500 },
    low: { color: colors.primary },
    date: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  });
}
