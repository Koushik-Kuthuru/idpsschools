import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { AppHeader, NotificationCard, ScreenLayout } from '@/components';
import { mockApi } from '@/services/api';
import type { NotificationItem } from '@/types';
import { colors, textStyle } from '@/theme';
import { styles } from './NotificationsAlertsScreen.styles';
import type { NotificationsAlertsScreenProps } from './NotificationsAlertsScreen.types';

export function NotificationsAlertsScreen(_props: NotificationsAlertsScreenProps) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = useCallback(() => {
    mockApi.notifications.list().then(setItems);
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const unreadCount = items.filter((n) => !n.read).length;

  const handleMarkAsRead = async (id: string) => {
    await mockApi.notifications.markAsRead(id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
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
        <AppHeader
          variant="back"
          title="Notifications"
          rightAction={
            unreadCount > 0
              ? {
                  label: markingAll ? '…' : 'Mark all read',
                  onPress: handleMarkAllAsRead,
                }
              : undefined
          }
        />
      }
    >
      <View style={styles.content}>
        {unreadCount > 0 ? (
          <Text style={[textStyle('labelSm'), styles.unreadBanner]}>
            {unreadCount} unread notification{unreadCount === 1 ? '' : 's'}
          </Text>
        ) : (
          <Text style={[textStyle('labelSm'), styles.allReadBanner]}>All caught up</Text>
        )}
        <FlatList
          data={items}
          keyExtractor={(n) => n.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <NotificationCard
              title={item.title}
              body={item.body}
              type={item.type}
              timestamp={item.timestamp}
              read={item.read}
              onMarkAsRead={!item.read ? () => handleMarkAsRead(item.id) : undefined}
            />
          )}
        />
      </View>
    </ScreenLayout>
  );
}
