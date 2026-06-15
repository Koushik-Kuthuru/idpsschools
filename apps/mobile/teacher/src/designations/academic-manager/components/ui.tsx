import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, type ViewStyle } from 'react-native';
import { colors, borderRadius, textStyle } from '@/designations/academic-manager/theme';

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function ProgressBar({ percent, color = colors.primary, height = 8 }: { percent: number; color?: string; height?: number }) {
  return (
    <View style={[styles.track, { height }]}>
      <View style={[styles.fill, { width: `${percent}%`, backgroundColor: color, height }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: 16,
  },
  track: {
    width: '100%',
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  fill: { borderRadius: borderRadius.full },
});
