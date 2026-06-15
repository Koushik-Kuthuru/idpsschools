import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AcademicHeader } from '../components/AcademicHeader';
import { ScreenShell } from '../components/ScreenShell';
import { getAcademicUnreadCount, useAcademicNotificationsStore } from '../store/notificationsStore';
import type { AcademicColorScheme } from '../theme/colors';
import { spacing, textStyle, useAcademicTheme, useThemedStyles } from '@/designations/academic-director/theme';

type FilterKey = 'all' | 'unread' | 'results' | 'teacher' | 'curriculum' | 'exam' | 'approvals';

export function NotificationsScreen() {
  const navigation = useNavigation();
  const { colors } = useAcademicTheme();
  const styles = useThemedStyles(createStyles);
  const items = useAcademicNotificationsStore((s) => s.items);
  const markAllRead = useAcademicNotificationsStore((s) => s.markAllRead);
  const markRead = useAcademicNotificationsStore((s) => s.markRead);
  const dismiss = useAcademicNotificationsStore((s) => s.dismiss);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = getAcademicUnreadCount(items);

  const filters: { key: FilterKey; label: string }[] = useMemo(
    () => [
      { key: 'all', label: `All (${items.length})` },
      { key: 'unread', label: `Unread (${unreadCount})` },
      { key: 'results', label: 'Results' },
      { key: 'teacher', label: 'Teacher' },
      { key: 'curriculum', label: 'Curriculum' },
      { key: 'exam', label: 'Exam' },
      { key: 'approvals', label: 'Approvals' },
    ],
    [items.length, unreadCount],
  );

  const visibleItems = useMemo(() => {
    if (filter === 'unread') return items.filter((item) => !item.read);
    if (filter === 'all') return items;
    return items.filter((item) => item.category === filter);
  }, [filter, items]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof visibleItems>();
    visibleItems.forEach((item) => {
      const list = map.get(item.groupLabel) ?? [];
      list.push(item);
      map.set(item.groupLabel, list);
    });
    return Array.from(map.entries());
  }, [visibleItems]);

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    setMarkingAll(true);
    markAllRead();
    setMarkingAll(false);
  };

  return (
    <ScreenShell
      header={
        <AcademicHeader
          title="Notifications"
          onBack={() => navigation.goBack()}
          right={
            unreadCount > 0 ? (
              <TouchableOpacity onPress={handleMarkAllRead} disabled={markingAll} activeOpacity={0.7}>
                <Text style={styles.markRead}>{markingAll ? '…' : 'Mark All Read'}</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.allCaughtUp}>All caught up</Text>
            )
          }
        />
      }
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {unreadCount > 0 ? (
        <Text style={styles.unreadBanner}>{unreadCount} unread notification{unreadCount === 1 ? '' : 's'}</Text>
      ) : null}

      <View style={styles.list}>
        {grouped.length === 0 ? (
          <Text style={styles.empty}>No notifications in this filter.</Text>
        ) : (
          grouped.map(([label, groupItems]) => (
            <View key={label}>
              <Text style={styles.groupLabel}>{label}</Text>
              {groupItems.map((item) => {
                const isUrgent = item.type === 'urgent';
                const isReminder = item.type === 'reminder';
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.85}
                    onPress={() => !item.read && markRead(item.id)}
                    style={[
                      styles.notifCard,
                      isUrgent && styles.notifUrgent,
                      !isUrgent && !isReminder && styles.notifPlain,
                      item.read && styles.notifRead,
                    ]}
                  >
                    <View style={styles.notifRow}>
                      <View
                        style={[
                          styles.iconCircle,
                          item.type === 'urgent' && styles.iconUrgent,
                          item.type === 'reminder' && styles.iconReminder,
                          item.type === 'info' && styles.iconInfo,
                        ]}
                      >
                        <MaterialIcons
                          name={item.type === 'urgent' ? 'report' : item.type === 'reminder' ? 'notification-important' : 'info'}
                          size={22}
                          color={item.type === 'urgent' ? colors.error : item.type === 'reminder' ? '#ffb000' : colors.blue600}
                        />
                      </View>
                      <View style={styles.notifBody}>
                        <View style={styles.notifHead}>
                          <Text style={[styles.notifTitle, item.read && styles.notifTitleRead]}>{item.title}</Text>
                          <Text style={styles.notifTime}>{item.time}</Text>
                        </View>
                        <Text style={[styles.notifDesc, item.read && styles.notifDescRead]}>{item.body}</Text>
                        {item.actions ? (
                          <View style={styles.actionRow}>
                            <TouchableOpacity
                              style={styles.primaryAction}
                              onPress={() => markRead(item.id)}
                            >
                              <Text style={styles.primaryActionText}>{item.actions[0]}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.secondaryAction}
                              onPress={() => dismiss(item.id)}
                            >
                              <Text style={styles.secondaryActionText}>{item.actions[1]}</Text>
                            </TouchableOpacity>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))
        )}
      </View>
    </ScreenShell>
  );
}

function createStyles(colors: AcademicColorScheme) {
  return StyleSheet.create({
  markRead: { ...textStyle('labelMd'), color: colors.primaryContainer, fontWeight: '600' },
  allCaughtUp: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  filters: { paddingHorizontal: spacing.gutter, gap: 8, paddingVertical: 12 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.slate100,
  },
  filterActive: { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer },
  filterText: { ...textStyle('labelMd'), color: colors.slate400 },
  filterTextActive: { color: colors.onPrimary },
  unreadBanner: {
    ...textStyle('labelMd'),
    color: colors.onSurfaceVariant,
    paddingHorizontal: spacing.gutter,
    marginBottom: 4,
  },
  list: { padding: spacing.gutter, gap: 8 },
  empty: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant, textAlign: 'center', paddingVertical: 24 },
  groupLabel: { ...textStyle('chip10'), color: colors.slate400, letterSpacing: 2, marginBottom: 8, marginTop: 8 },
  notifCard: { borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.slate100 },
  notifUrgent: { backgroundColor: `${colors.primaryContainer}0d`, borderLeftWidth: 4, borderLeftColor: colors.primaryContainer },
  notifPlain: { backgroundColor: colors.surfaceContainerLowest },
  notifRead: { opacity: 0.72 },
  notifRow: { flexDirection: 'row', gap: 16 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  iconUrgent: { backgroundColor: `${colors.error}1a` },
  iconReminder: { backgroundColor: '#ffb0001a' },
  iconInfo: { backgroundColor: colors.blue50 },
  notifBody: { flex: 1 },
  notifHead: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  notifTitle: { ...textStyle('bodyLg'), fontWeight: '600', flex: 1 },
  notifTitleRead: { fontWeight: '500' },
  notifTime: { ...textStyle('chip10'), color: colors.slate400 },
  notifDesc: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant, marginTop: 4 },
  notifDescRead: { color: colors.outline },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  primaryAction: { backgroundColor: colors.primaryContainer, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  primaryActionText: { ...textStyle('labelMd'), color: colors.onPrimary },
  secondaryAction: { borderWidth: 1, borderColor: colors.outlineVariant, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  secondaryActionText: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  });
}
