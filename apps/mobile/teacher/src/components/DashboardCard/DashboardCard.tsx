import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AppIcon } from '../AppIcon';
import { colors, textStyle } from '@/theme';
import { cardShadow } from '@/utils/cardShadow';
import { styles } from './DashboardCard.styles';
import type { DashboardCardProps } from './DashboardCard.types';

export function DashboardCard({
  icon,
  iconColor,
  iconBgColor,
  accentColor = colors.primary,
  title,
  subtitle,
  subtitleHighlight,
  badge,
  onPress,
}: DashboardCardProps) {
  const content = (
    <View style={[styles.card, cardShadow]}>
      <View style={[styles.iconBox, { backgroundColor: iconBgColor }]}>
        <AppIcon name={icon} color={iconColor} filled />
      </View>
      <View style={styles.textBlock}>
        <View style={styles.titleRow}>
          <Text style={[textStyle('cardTitle16'), styles.title]}>{title}</Text>
          {badge ? (
            <View style={[styles.badge, { backgroundColor: `${accentColor}18` }]}>
              <Text style={[styles.badgeText, { color: accentColor }]}>{badge}</Text>
            </View>
          ) : null}
        </View>
        <Text style={[textStyle('bodyMd'), styles.subtitle]} numberOfLines={2}>
          {subtitleHighlight ? (
            <>
              {subtitle.split(subtitleHighlight)[0]}
              <Text style={styles.highlight}>{subtitleHighlight}</Text>
              {subtitle.split(subtitleHighlight)[1]}
            </>
          ) : (
            subtitle
          )}
        </Text>
      </View>
      {onPress ? <AppIcon name="chevron_right" color={colors.slate400} /> : null}
    </View>
  );

  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.75}>{content}</TouchableOpacity>;
  return content;
}
