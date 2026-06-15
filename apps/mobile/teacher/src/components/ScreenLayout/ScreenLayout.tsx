import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '@/theme';
import { AppBottomNav } from '../AppBottomNav/AppBottomNav';
import type { AppBottomNavProps } from '../AppBottomNav/AppBottomNav.types';

interface ScreenLayoutProps {
  children: React.ReactNode;
  scroll?: boolean;
  bottomNav?: AppBottomNavProps;
  paddingBottom?: number;
  header?: React.ReactNode;
}

export function ScreenLayout({ children, scroll, bottomNav, paddingBottom = 96, header }: ScreenLayoutProps) {
  const content = scroll ? (
    <ScrollView contentContainerStyle={{ paddingBottom }} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={{ flex: 1, paddingBottom }}>{children}</View>
  );

  return (
    <SafeAreaView style={layoutStyles.safe} edges={['top']}>
      {header}
      <View style={layoutStyles.body}>{content}</View>
      {bottomNav ? <AppBottomNav {...bottomNav} /> : null}
    </SafeAreaView>
  );
}

const layoutStyles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
    maxWidth: spacing.maxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  body: {
    flex: 1,
  },
});
