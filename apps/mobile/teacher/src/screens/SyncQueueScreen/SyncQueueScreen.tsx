import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { AppButton, AppHeader, ScreenLayout } from '@/components';
import { mockApi } from '@/services/api';
import type { SyncHistoryItem, SyncQueueItem } from '@/types';
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
  row: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  link: { color: colors.error, fontWeight: '600' },
  ok: { color: colors.primaryContainer },
  fail: { color: colors.error },
});

export function SyncQueueScreen() {
  const [queue, setQueue] = useState<SyncQueueItem[]>([]);
  const [history, setHistory] = useState<SyncHistoryItem[]>([]);

  const load = () => mockApi.faculty.getSyncQueue().then((d) => {
    setQueue(d.queue);
    setHistory(d.history);
  });

  useEffect(() => {
    load();
  }, []);

  return (
    <ScreenLayout scroll header={<AppHeader variant="back" title="SYNC QUEUE" />}>
      <View style={styles.content}>
        <Text style={[textStyle('labelLg')]}>Pending sync ({queue.length})</Text>
        {queue.map((q) => (
          <View key={q.id} style={styles.card}>
            <Text style={[textStyle('headlineSm')]}>{q.title}</Text>
            <Text style={[textStyle('bodyMd')]}>{q.subtitle}</Text>
            <Text style={[textStyle('labelSm'), { color: colors.outline }]}>{q.timestamp}</Text>
            <View style={styles.row}>
              <TouchableOpacity onPress={() => Alert.alert('Deleted', 'Item removed from queue.')}>
                <Text style={[textStyle('labelSm'), styles.link]}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Alert.alert('Syncing', 'Retry started.')}>
                <Text style={[textStyle('labelSm'), { color: colors.primaryContainer }]}>Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        <AppButton label="Sync All" onPress={() => Alert.alert('Sync', 'All items synced.')} />
        <Text style={[textStyle('labelLg')]}>Sync history</Text>
        {history.map((h) => (
          <View key={h.id} style={styles.card}>
            <Text style={[textStyle('labelSm'), { color: colors.outline }]}>{h.timestamp}</Text>
            <Text style={[textStyle('bodyMd'), h.success ? styles.ok : styles.fail]}>{h.message}</Text>
          </View>
        ))}
      </View>
    </ScreenLayout>
  );
}
