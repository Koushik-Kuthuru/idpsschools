import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { AppHeader, ScreenLayout } from '@/components';
import { mockApi } from '@/services/api';
import type { AttendanceHistoryRecord } from '@/types';
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
  date: { color: colors.outline, marginBottom: spacing.xs },
  row: { color: colors.onSurface, fontWeight: '600' },
  synced: { color: colors.primaryContainer, marginTop: spacing.xs },
});

export function AttendanceHistoryScreen() {
  const [items, setItems] = useState<AttendanceHistoryRecord[]>([]);
  useEffect(() => {
    mockApi.faculty.getAttendanceHistory().then(setItems);
  }, []);

  return (
    <ScreenLayout scroll header={<AppHeader variant="back" title="ATTENDANCE HISTORY" />}>
      <View style={styles.content}>
        {items.map((h) => (
          <View key={h.id} style={styles.card}>
            <Text style={[textStyle('labelSm'), styles.date]}>{h.date}</Text>
            <Text style={[textStyle('headlineSm'), styles.row]}>
              {h.className}: {h.present}/{h.total} ({Math.round((h.present / h.total) * 100)}%)
            </Text>
            <Text style={[textStyle('labelSm'), styles.synced]}>{h.synced ? '✓ Synced' : 'Pending sync'}</Text>
          </View>
        ))}
      </View>
    </ScreenLayout>
  );
}
