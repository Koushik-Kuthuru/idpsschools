import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme';
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
      <View style={layoutStyles.scrollContent}>{children}</View>
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
    width: '100%',
    backgroundColor: colors.canvas,
  },
  body: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    width: '100%',
  },
});
