import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { subtleShadow } from '@/constants/shadows';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
}

export function Card({ children, style, padding = 16 }: CardProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        subtleShadow,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.mode === 'dark' ? theme.colors.border : theme.colors.slate100,
          padding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  style?: ViewStyle;
}

export function StatCard({ label, value, subtitle, style }: StatCardProps) {
  const theme = useTheme();
  return (
    <Card style={style}>
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.value, { color: theme.colors.text }]}>{value}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>{subtitle}</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 4,
  },
});
