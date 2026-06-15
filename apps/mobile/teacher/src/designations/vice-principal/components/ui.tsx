import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { borderRadius, useThemedStyles, useVicePrincipalTheme } from '../theme';

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const styles = useThemedStyles(createStyles);
  return <View style={[styles.card, style]}>{children}</View>;
}

export function ProgressBar({ percent, color, height = 8 }: { percent: number; color?: string; height?: number }) {
  const { colors } = useVicePrincipalTheme();
  const styles = useThemedStyles(createStyles);
  const fillColor = color ?? colors.primaryContainer;
  return (
    <View style={[styles.track, { height }]}>
      <View style={[styles.fill, { width: `${Math.min(100, percent)}%`, backgroundColor: fillColor, height }]} />
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useVicePrincipalTheme>['colors']) {
  return StyleSheet.create({
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
}
