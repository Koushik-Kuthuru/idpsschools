import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { AppHeader, ScreenLayout } from '@/components';
import { mockApi } from '@/services/api';
import type { LeaveBalanceItem } from '@/types';
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
  bar: {
    height: 8,
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.primaryContainer },
});

export function LeaveBalanceScreen() {
  const [items, setItems] = useState<LeaveBalanceItem[]>([]);
  useEffect(() => {
    mockApi.faculty.getLeaveBalance().then(setItems);
  }, []);

  return (
    <ScreenLayout scroll header={<AppHeader variant="back" title="LEAVE BALANCE" />}>
      <View style={styles.content}>
        <Text style={[textStyle('bodyMd'), { color: colors.onSurfaceVariant }]}>Academic Year 2025-2026</Text>
        {items.map((b) => (
          <View key={b.type} style={styles.card}>
            <Text style={[textStyle('headlineSm')]}>{b.label}</Text>
            <Text style={[textStyle('bodyMd')]}>Total: {b.total} · Used: {b.used} · Remaining: {b.remaining}</Text>
            <View style={styles.bar}>
              <View style={[styles.fill, { width: `${(b.remaining / b.total) * 100}%` }]} />
            </View>
          </View>
        ))}
      </View>
    </ScreenLayout>
  );
}
