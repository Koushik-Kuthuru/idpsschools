import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AppIcon } from '../AppIcon';
import { colors, textStyle } from '@/theme';
import { styles } from './DashboardStatCard.styles';
import type { DashboardStatCardProps } from './DashboardStatCard.types';

export function DashboardStatCard({
  value,
  label,
  valueColor = colors.onSurface,
  progressPercent,
  footerText,
  footerTextColor,
  icon,
  iconColor = colors.error,
  onPress,
}: DashboardStatCardProps) {
  const content = (
    <View style={styles.card}>
      <View>
        <Text style={[textStyle('statNumber'), styles.value, { color: valueColor }]}>{value}</Text>
        <Text style={[textStyle('labelSm'), styles.label]}>{label}</Text>
      </View>
      {progressPercent !== undefined ? (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>
      ) : null}
      {footerText ? (
        <View style={styles.footerChip}>
          <Text style={[textStyle('chip10'), styles.footerText, footerTextColor && { color: footerTextColor }]}>
            {footerText}
          </Text>
        </View>
      ) : null}
      {icon ? (
        <View style={styles.iconEnd}>
          <AppIcon name={icon} size={28} color={iconColor} />
        </View>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}
