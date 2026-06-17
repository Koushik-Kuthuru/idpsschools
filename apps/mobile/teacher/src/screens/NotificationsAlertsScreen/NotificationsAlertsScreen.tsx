import React, { useCallback, useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { AppIcon, DashboardTopBar, NotificationCard, ScreenLayout } from '@/components';
import { mockApi } from '@/services/api';
import { useAuthStore } from '@/store';
import type { NotificationItem } from '@/types';
import { colors } from '@/theme';
import { styles } from './NotificationsAlertsScreen.styles';
import type { NotificationsAlertsScreenProps } from './NotificationsAlertsScreen.types';

export function NotificationsAlertsScreen(_props: NotificationsAlertsScreenProps) {
  const teacher = useAuthStore((s) => s.user);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = useCallback(() => {
    mockApi.notifications.list().then(setItems);
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const unreadCount = items.filter((n) => !n.read).length;
  const displayName = teacher?.name ?? 'Staff';

  const handleMarkAsRead = async (id: string) => {
    await mockApi.notifications.markAsRead(id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || markingAll) return;
    setMarkingAll(true);
    try {
      await mockApi.notifications.markAllAsRead();
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <ScreenLayout
      scroll
      header={
        <DashboardTopBar
          title="Notifications"
          name={displayName}
          showBack
          showNotifications={false}
          showProfile={false}
          headerAction={
            unreadCount > 0
              ? {
                  label: markingAll ? 'Updating…' : 'Mark all read',
                  onPress: handleMarkAllAsRead,
                  disabled: markingAll,
                }
              : undefined
          }
        />
      }
    >
      <View style={styles.summaryBand}>
        <View style={[styles.summaryChip, unreadCount > 0 ? styles.summaryChipUnread : styles.summaryChipClear]}>
          <AppIcon
            name={unreadCount > 0 ? 'notifications_active' : 'check_circle'}
            size={16}
            color={unreadCount > 0 ? colors.primary : colors.secondary}
          />
          <Text style={[styles.summaryText, unreadCount > 0 ? styles.summaryTextUnread : styles.summaryTextClear]}>
            {unreadCount > 0
              ? `${unreadCount} unread alert${unreadCount === 1 ? '' : 's'}`
              : 'All caught up'}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent</Text>
          <Text style={styles.sectionMeta}>{items.length} total</Text>
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <AppIcon name="notifications_off" size={28} color={colors.slate400} />
            </View>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySubtitle}>Alerts about classes, attendance, and school updates will appear here.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {items.map((item) => (
              <NotificationCard
                key={item.id}
                title={item.title}
                body={item.body}
                type={item.type}
                timestamp={item.timestamp}
                read={item.read}
                onMarkAsRead={!item.read ? () => handleMarkAsRead(item.id) : undefined}
              />
            ))}
          </View>
        )}
      </View>
    </ScreenLayout>
  );
}
