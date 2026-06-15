import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { AppHeader, ScreenLayout } from '@/components';
import { mockApi } from '@/services/api';
import type { SalarySummary } from '@/types';
import { colors, textStyle } from '@/theme';
import { StyleSheet } from 'react-native';
import { borderRadius, spacing } from '@/theme';

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.slate100,
  },
});

export function SalaryHistoryScreen() {
  const [items, setItems] = useState<SalarySummary[]>([]);
  useEffect(() => {
    mockApi.faculty.getSalaryHistory().then(setItems);
  }, []);

  return (
    <ScreenLayout scroll header={<AppHeader variant="back" title="SALARY HISTORY" />}>
      <View style={styles.content}>
        {items.map((s) => (
          <View key={s.month} style={styles.card}>
            <Text style={[textStyle('headlineSm')]}>{s.month}</Text>
            <Text style={[textStyle('bodyMd')]}>Net: ${s.netSalary}</Text>
            <Text style={[textStyle('labelSm'), { color: colors.outline }]}>
              {s.status === 'credited' ? `✓ Credited ${s.creditedDate}` : `Processing · ${s.expectedDate}`}
            </Text>
          </View>
        ))}
      </View>
    </ScreenLayout>
  );
}
