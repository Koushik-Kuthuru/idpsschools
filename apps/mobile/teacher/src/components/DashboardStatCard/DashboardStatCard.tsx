import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AppIcon } from '../AppIcon';
import { colors, textStyle } from '@/theme';
import { cardShadow } from '@/utils/cardShadow';
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
  iconColor = colors.primary,
  accentColor,
  onPress,
}: DashboardStatCardProps) {
  const accent = accentColor ?? iconColor;
  const content = (
    <View style={[styles.card, cardShadow]}>
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: `${accent}14` }]}>
          <AppIcon name={icon} size={18} color={accent} />
        </View>
      ) : null}
      <Text style={[styles.label, textStyle('labelSm')]}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={[textStyle('statNumber'), styles.value, { color: valueColor }]}>{value}</Text>
        {footerText ? (
          <Text style={[styles.footerInline, footerTextColor ? { color: footerTextColor } : null]}>{footerText}</Text>
        ) : null}
      </View>
      {progressPercent !== undefined ? (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>
      ) : null}
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
