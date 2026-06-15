import React, { type ReactNode } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing, useThemedStyles, useVicePrincipalTheme } from '../theme';
import { VicePrincipalBottomNav } from './VicePrincipalBottomNav';
import type { VicePrincipalTab } from '../navigation/types';

interface ScreenShellProps {
  children: ReactNode;
  scroll?: boolean;
  header?: ReactNode;
  activeTab?: VicePrincipalTab;
  onTabPress?: (tab: VicePrincipalTab) => void;
  paddingBottom?: number;
  fab?: ReactNode;
}

export function ScreenShell({
  children,
  scroll = true,
  header,
  activeTab,
  onTabPress,
  paddingBottom,
  fab,
}: ScreenShellProps) {
  const { colors } = useVicePrincipalTheme();
  const styles = useThemedStyles(createStyles);
  const bottomPad = paddingBottom ?? spacing.gutter;

  const body = scroll ? (
    <ScrollView contentContainerStyle={{ paddingBottom: bottomPad }} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={styles.bodyFill}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {header}
      <View style={styles.body}>{body}</View>
      {fab}
      {activeTab && onTabPress ? <VicePrincipalBottomNav activeTab={activeTab} onTabPress={onTabPress} /> : null}
    </SafeAreaView>
  );
}

function createStyles(colors: ReturnType<typeof useVicePrincipalTheme>['colors']) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background, maxWidth: spacing.maxWidth, width: '100%', alignSelf: 'center' },
    body: { flex: 1 },
    bodyFill: { flex: 1 },
  });
}
