import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AppIcon } from '../AppIcon';
import { colors, textStyle } from '@/theme';
import { styles } from './NotificationCard.styles';
import type { NotificationCardProps } from './NotificationCard.types';

const TYPE_ICON: Record<NotificationCardProps['type'], string> = {
  academic: 'school',
  urgent: 'warning',
  system: 'info',
};

const TYPE_ICON_COLOR: Record<NotificationCardProps['type'], string> = {
  academic: colors.primary,
  urgent: colors.error,
  system: '#d97706',
};

export function NotificationCard({
  title,
  body,
  type,
  timestamp,
  read,
  onPress,
  onMarkAsRead,
}: NotificationCardProps) {
  const iconStyle =
    type === 'urgent' ? styles.iconUrgent : type === 'system' ? styles.iconSystem : styles.iconAcademic;

  const content = (
    <View style={[styles.card, !read && styles.cardUnread]}>
      <View style={[styles.iconBox, iconStyle]}>
        <AppIcon name={TYPE_ICON[type]} color={TYPE_ICON_COLOR[type]} size={22} />
      </View>
      <View style={styles.info}>
        <Text style={[textStyle('cardTitle16'), styles.title]}>{title}</Text>
        <Text style={[textStyle('bodyMd'), styles.body]} numberOfLines={2}>
          {body}
        </Text>
        <View style={styles.footerRow}>
          <Text style={[textStyle('timestamp11'), styles.time]}>{timestamp}</Text>
          {!read && onMarkAsRead ? (
            <TouchableOpacity
              onPress={onMarkAsRead}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Text style={[textStyle('labelSm'), styles.markRead]}>Mark as read</Text>
            </TouchableOpacity>
          ) : read ? (
            <Text style={[textStyle('labelSm'), styles.readLabel]}>Read</Text>
          ) : null}
        </View>
      </View>
      {!read ? <View style={styles.dot} /> : null}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}
