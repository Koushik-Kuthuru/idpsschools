import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { VicePrincipalHeader } from '../components/VicePrincipalHeader';
import { ScreenShell } from '../components/ScreenShell';
import type { VpNotificationType } from '../data/mockData';
import { getVpUnreadCount, useVpNotificationsStore } from '../store/vpNotificationsStore';
import { spacing, textStyle, useThemedStyles, useVicePrincipalTheme } from '../theme';
import type { VicePrincipalColorScheme } from '../theme/colors';

function iconForType(type: VpNotificationType) {
  if (type === 'urgent') return 'report' as const;
  if (type === 'approval') return 'assignment-ind' as const;
  if (type === 'academic') return 'school' as const;
  return 'info' as const;
}

export function NotificationsScreen() {
  const navigation = useNavigation();
  const { colors } = useVicePrincipalTheme();
  const styles = useThemedStyles(createStyles);
  const items = useVpNotificationsStore((s) => s.items);
  const markRead = useVpNotificationsStore((s) => s.markRead);
  const markAllRead = useVpNotificationsStore((s) => s.markAllRead);
  const dismiss = useVpNotificationsStore((s) => s.dismiss);

  const unreadCount = getVpUnreadCount(items);

  const grouped = useMemo(() => {
    const unread = items.filter((i) => !i.read);
    const read = items.filter((i) => i.read);
    const sections: { title: string; data: typeof items }[] = [];
    if (unread.length > 0) sections.push({ title: 'Unread', data: unread });
    if (read.length > 0) sections.push({ title: 'Earlier', data: read });
    return sections;
  }, [items]);

  return (
    <ScreenShell
      header={
        <VicePrincipalHeader
          variant="back"
          title="Notifications"
          onBack={() => navigation.goBack()}
          right={
            unreadCount > 0 ? (
              <TouchableOpacity onPress={markAllRead} activeOpacity={0.7} style={styles.markReadBtn}>
                <Text style={styles.markAll}>Mark All Read</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.allCaughtUp}>All caught up</Text>
            )
          }
        />
      }
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <MaterialIcons name="notifications-none" size={48} color={colors.outline} />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptySub}>You're all caught up.</Text>
          </View>
        ) : (
          grouped.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.data.map((n) => (
                <TouchableOpacity
                  key={n.id}
                  style={[styles.row, !n.read && styles.unread]}
                  onPress={() => markRead(n.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconWrap, !n.read && styles.iconWrapUnread]}>
                    <MaterialIcons name={iconForType(n.type)} size={22} color={colors.primary} />
                  </View>
                  <View style={styles.rowBody}>
                    <Text style={styles.title}>{n.title}</Text>
                    <Text style={styles.body}>{n.body}</Text>
                    <Text style={styles.time}>{n.time}</Text>
                  </View>
                  <TouchableOpacity onPress={() => dismiss(n.id)} hitSlop={8} style={styles.dismissBtn}>
                    <MaterialIcons name="close" size={18} color={colors.onSurfaceVariant} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </ScreenShell>
  );
}

function createStyles(colors: VicePrincipalColorScheme) {
  return StyleSheet.create({
    content: { padding: spacing.gutter, paddingBottom: 32 },
    markReadBtn: { paddingHorizontal: 4 },
    markAll: { ...textStyle('labelMd'), color: colors.primaryContainer, fontWeight: '600' },
    allCaughtUp: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
    section: { marginBottom: spacing.lg },
    sectionTitle: { ...textStyle('labelMd'), color: colors.onSurfaceVariant, fontWeight: '700', letterSpacing: 1, marginBottom: spacing.sm },
    row: {
      flexDirection: 'row',
      gap: 12,
      padding: spacing.md,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      backgroundColor: colors.surfaceContainerLowest,
      marginBottom: spacing.sm,
      alignItems: 'flex-start',
    },
    unread: { borderColor: colors.primaryContainer, backgroundColor: `${colors.primaryContainer}0d` },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surfaceContainerLow,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrapUnread: { backgroundColor: `${colors.primaryContainer}22` },
    rowBody: { flex: 1 },
    title: { ...textStyle('bodyMd'), fontWeight: '700', color: colors.onSurface },
    body: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant, marginTop: 2 },
    time: { ...textStyle('labelMd'), color: colors.onSurfaceVariant, marginTop: 4 },
    dismissBtn: { padding: 4 },
    empty: { alignItems: 'center', paddingTop: 48, gap: 8 },
    emptyTitle: { ...textStyle('headlineMd'), color: colors.onSurface },
    emptySub: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant },
  });
}
