import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { PrincipalHeader } from '../components/PrincipalHeader';
import { ScreenShell } from '../components/ScreenShell';
import type { PrincipalNotificationType } from '../data/mockData';
import {
  filterPrincipalNotifications,
  getPrincipalUnreadCount,
  usePrincipalNotificationsStore,
  type PrincipalNotificationFilter,
} from '../store/principalNotificationsStore';
import { spacing, textStyle, usePrincipalTheme, useThemedStyles } from '@/designations/principal/theme';
import type { PrincipalColorScheme } from '@/designations/principal/theme/colors';

const FILTERS: { key: PrincipalNotificationFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'urgent', label: 'Urgent' },
  { key: 'approval', label: 'Approvals' },
  { key: 'academic', label: 'Academic' },
  { key: 'staff', label: 'Staff' },
  { key: 'system', label: 'System' },
];

function iconForType(type: PrincipalNotificationType) {
  if (type === 'urgent') return 'report' as const;
  if (type === 'approval') return 'approval' as const;
  if (type === 'system') return 'sync' as const;
  return 'info' as const;
}

export function NotificationsScreen() {
  const { colors } = usePrincipalTheme();
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation();
  const items = usePrincipalNotificationsStore((s) => s.items);
  const markAllRead = usePrincipalNotificationsStore((s) => s.markAllRead);
  const markRead = usePrincipalNotificationsStore((s) => s.markRead);
  const dismiss = usePrincipalNotificationsStore((s) => s.dismiss);
  const [filter, setFilter] = useState<PrincipalNotificationFilter>('all');

  const unreadCount = getPrincipalUnreadCount(items);

  const filters = useMemo(
    () =>
      FILTERS.map((f) => {
        const count = filterPrincipalNotifications(items, f.key).length;
        return { ...f, label: count > 0 ? `${f.label} (${count})` : f.label };
      }),
    [items],
  );

  const visibleItems = useMemo(() => filterPrincipalNotifications(items, filter), [filter, items]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof visibleItems>();
    visibleItems.forEach((item) => {
      const list = map.get(item.groupLabel) ?? [];
      list.push(item);
      map.set(item.groupLabel, list);
    });
    return Array.from(map.entries());
  }, [visibleItems]);

  return (
    <ScreenShell
      header={
        <PrincipalHeader
          title="Notifications"
          onBack={() => navigation.goBack()}
          right={
            unreadCount > 0 ? (
              <TouchableOpacity onPress={markAllRead} activeOpacity={0.7} style={styles.markReadBtn}>
                <Text style={styles.markRead} numberOfLines={1}>
                  Mark All Read
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.allCaughtUp} numberOfLines={1}>
                All caught up
              </Text>
            )
          }
        />
      }
    >
      <View style={styles.page}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.chip, filter === f.key && styles.chipActive]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {unreadCount > 0 ? (
          <Text style={styles.unread}>
            {unreadCount} unread notification{unreadCount === 1 ? '' : 's'}
          </Text>
        ) : null}

        <View style={styles.list}>
          {grouped.length === 0 ? (
            <Text style={styles.empty}>No notifications in this filter.</Text>
          ) : (
            grouped.map(([label, groupItems]) => (
              <View key={label}>
                <Text style={styles.groupLabel}>{label}</Text>
                {groupItems.map((n) => {
                  const isUrgent = n.type === 'urgent';
                  return (
                    <TouchableOpacity
                      key={n.id}
                      activeOpacity={0.85}
                      onPress={() => !n.read && markRead(n.id)}
                      style={[styles.card, isUrgent && styles.cardUrgent, n.read && styles.cardRead]}
                    >
                      <View
                        style={[
                          styles.iconCircle,
                          isUrgent && styles.iconUrgent,
                          n.type === 'approval' && styles.iconApproval,
                          n.type === 'academic' && styles.iconAcademic,
                          n.type === 'staff' && styles.iconStaff,
                          n.type === 'system' && styles.iconSystem,
                        ]}
                      >
                        <MaterialIcons
                          name={iconForType(n.type)}
                          size={22}
                          color={isUrgent ? colors.error : n.type === 'approval' ? colors.primary : colors.blue500}
                        />
                      </View>
                      <View style={styles.body}>
                        <View style={styles.head}>
                          <Text style={[styles.title, n.read && styles.titleRead]} numberOfLines={2}>
                            {n.title}
                          </Text>
                          <Text style={styles.time}>{n.time}</Text>
                        </View>
                        <Text style={[styles.desc, n.read && styles.descRead]}>{n.body}</Text>
                        {n.actions ? (
                          <View style={styles.actionRow}>
                            <TouchableOpacity style={styles.cta} onPress={() => markRead(n.id)} activeOpacity={0.7}>
                              <Text style={styles.ctaText}>{n.actions[0]}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.secondaryCta} onPress={() => dismiss(n.id)} activeOpacity={0.7}>
                              <Text style={styles.secondaryCtaText}>{n.actions[1]}</Text>
                            </TouchableOpacity>
                          </View>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))
          )}
        </View>
      </View>
    </ScreenShell>
  );
}

function createStyles(colors: PrincipalColorScheme) {
  return StyleSheet.create({
  page: { gap: spacing.sm },
  markReadBtn: { paddingVertical: 6, paddingHorizontal: 4 },
  markRead: { ...textStyle('labelMd'), color: colors.primaryContainer, fontWeight: '600', fontSize: 11, textAlign: 'right' },
  allCaughtUp: { ...textStyle('labelMd'), color: colors.onSurfaceVariant, fontSize: 11, textAlign: 'right', paddingVertical: 6 },
  filters: { paddingHorizontal: spacing.gutter, gap: 8, paddingTop: spacing.md, paddingBottom: spacing.sm },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  chipActive: { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer },
  chipText: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  chipTextActive: { color: colors.onPrimary },
  unread: {
    ...textStyle('labelMd'),
    color: colors.onSurfaceVariant,
    paddingHorizontal: spacing.gutter,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  list: { paddingHorizontal: spacing.gutter, paddingBottom: spacing.gutter, gap: spacing.sm },
  empty: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant, textAlign: 'center', paddingVertical: 24 },
  groupLabel: { ...textStyle('chip10'), color: colors.slate400, letterSpacing: 2, marginBottom: 8, marginTop: 8 },
  card: {
    flexDirection: 'row',
    gap: 14,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
    marginBottom: 12,
  },
  cardUrgent: { borderLeftWidth: 4, borderLeftColor: colors.error, backgroundColor: `${colors.errorContainer}33` },
  cardRead: { opacity: 0.72 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  iconUrgent: { backgroundColor: `${colors.error}1a` },
  iconApproval: { backgroundColor: `${colors.primaryContainer}1a` },
  iconAcademic: { backgroundColor: colors.green50 },
  iconStaff: { backgroundColor: colors.green50 },
  iconSystem: { backgroundColor: colors.surfaceContainerHigh },
  body: { flex: 1, gap: 4, minWidth: 0 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  title: { ...textStyle('bodyMd'), fontWeight: '600', flex: 1, flexShrink: 1 },
  titleRead: { fontWeight: '500' },
  time: { ...textStyle('chip10'), color: colors.onSurfaceVariant, flexShrink: 0, marginTop: 2 },
  desc: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant },
  descRead: { color: colors.outline },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  cta: { backgroundColor: colors.primaryContainer, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  ctaText: { ...textStyle('chip10'), color: colors.onPrimary },
  secondaryCta: { borderWidth: 1, borderColor: colors.outlineVariant, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  secondaryCtaText: { ...textStyle('chip10'), color: colors.onSurfaceVariant },
});
}
