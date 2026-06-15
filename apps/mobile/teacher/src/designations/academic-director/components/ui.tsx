import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, type ViewStyle } from 'react-native';
import { borderRadius, textStyle, useAcademicTheme } from '@/designations/academic-director/theme';

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { colors } = useAcademicTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surfaceContainerLowest,
          borderRadius: borderRadius.lg,
          borderWidth: 1,
          borderColor: colors.outlineVariant,
          padding: 16,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function ProgressBar({
  percent,
  color,
  height = 8,
}: {
  percent: number;
  color?: string;
  height?: number;
}) {
  const { colors } = useAcademicTheme();
  const fillColor = color ?? colors.primaryContainer;
  return (
    <View style={[styles.track, { height, backgroundColor: colors.surfaceContainerHigh }]}>
      <View style={[styles.fill, { width: `${percent}%`, backgroundColor: fillColor, height }]} />
    </View>
  );
}

export function StatusChip({ label, tone = 'primary' }: { label: string; tone?: 'primary' | 'error' | 'tertiary' | 'neutral' }) {
  const { colors } = useAcademicTheme();
  const toneStyle =
    tone === 'error'
      ? { bg: `${colors.error}1a`, text: colors.error }
      : tone === 'tertiary'
        ? { bg: `${colors.tertiaryContainer}33`, text: colors.onTertiaryContainer }
        : tone === 'neutral'
          ? { bg: `${colors.outlineVariant}4d`, text: colors.onSurfaceVariant }
          : { bg: `${colors.primary}1a`, text: colors.primary };
  return (
    <View style={[styles.chip, { backgroundColor: toneStyle.bg }]}>
      <Text style={[styles.chipText, { color: toneStyle.text }]}>{label}</Text>
    </View>
  );
}

export function PillButton({
  label,
  variant = 'filled',
  onPress,
}: {
  label: string;
  variant?: 'filled' | 'outline';
  onPress?: () => void;
}) {
  const { colors } = useAcademicTheme();
  return (
    <TouchableOpacity
      style={[
        styles.pill,
        variant === 'filled'
          ? { backgroundColor: colors.primary }
          : { borderWidth: 1, borderColor: colors.primary },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.pillText,
          { color: variant === 'filled' ? colors.onPrimary : colors.primary },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  fill: { borderRadius: borderRadius.full },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  chipText: { ...textStyle('chip10'), textTransform: 'uppercase', letterSpacing: 1 },
  pill: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: borderRadius.full },
  pillText: { ...textStyle('chip10'), fontWeight: '700' },
});
