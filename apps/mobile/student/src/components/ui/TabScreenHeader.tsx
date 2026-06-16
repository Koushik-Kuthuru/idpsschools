import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';

interface TabScreenHeaderProps {
  title: string;
  subtitle?: string;
}

/** Simple flat title bar for tab screens — gradient hero is reserved for Home. */
export function TabScreenHeader({ title, subtitle }: TabScreenHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top + 12,
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  subtitle: { fontSize: 13, fontWeight: '500', marginTop: 2 },
});
