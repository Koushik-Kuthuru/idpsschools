import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AppIcon } from '../AppIcon';
import { colors, textStyle } from '@/theme';
import { styles } from './DashboardCard.styles';
import type { DashboardCardProps } from './DashboardCard.types';

export function DashboardCard({
  icon,
  iconColor,
  iconBgColor,
  title,
  subtitle,
  subtitleHighlight,
  onPress,
}: DashboardCardProps) {
  const content = (
    <View style={styles.card}>
      <View style={styles.left}>
        <View style={[styles.iconBox, { backgroundColor: iconBgColor }]}>
          <AppIcon name={icon} color={iconColor} filled />
        </View>
        <View style={styles.textBlock}>
          <Text style={[textStyle('cardTitle16'), styles.title]}>{title}</Text>
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
      </View>
      <AppIcon name="chevron_right" color={colors.outline} />
    </View>
  );

  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.8}>{content}</TouchableOpacity>;
  return content;
}
