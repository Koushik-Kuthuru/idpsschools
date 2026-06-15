import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { AppHeader, ScreenLayout } from '@/components';
import { mockApi } from '@/services/api';
import type { MarksHistoryRecord } from '@/types';
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
  date: { color: colors.outline },
  title: { color: colors.onSurface, fontWeight: '700', marginTop: spacing.xs },
  meta: { color: colors.onSurfaceVariant, marginTop: spacing.xs },
  synced: { color: colors.primaryContainer, marginTop: spacing.xs },
});

export function MarksHistoryScreen() {
  const [items, setItems] = useState<MarksHistoryRecord[]>([]);
  useEffect(() => {
    mockApi.faculty.getMarksHistory().then(setItems);
  }, []);

  return (
    <ScreenLayout scroll header={<AppHeader variant="back" title="MARKS HISTORY" />}>
      <View style={styles.content}>
        {items.map((h) => (
          <View key={h.id} style={styles.card}>
            <Text style={[textStyle('labelSm'), styles.date]}>{h.date}</Text>
            <Text style={[textStyle('headlineSm'), styles.title]}>{h.className} {h.examName}</Text>
            <Text style={[textStyle('bodyMd'), styles.meta]}>
              {h.entered}/{h.total} marks · Avg: {h.average}
            </Text>
            <Text style={[textStyle('labelSm'), styles.synced]}>{h.synced ? '✓ Synced' : 'Pending'}</Text>
          </View>
        ))}
      </View>
    </ScreenLayout>
  );
}
