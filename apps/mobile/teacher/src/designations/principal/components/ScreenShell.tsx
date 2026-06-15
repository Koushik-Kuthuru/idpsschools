import React, { type ReactNode } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing, usePrincipalTheme, useThemedStyles } from '@/designations/principal/theme';
import { PrincipalBottomNav } from './PrincipalBottomNav';
import type { PrincipalTab } from '../navigation/types';

interface ScreenShellProps {
  children: ReactNode;
  scroll?: boolean;
  header?: ReactNode;
  activeTab?: PrincipalTab;
  onTabPress?: (tab: PrincipalTab) => void;
  paddingBottom?: number;
}

export function ScreenShell({
  children,
  scroll = true,
  header,
  activeTab,
  onTabPress,
  paddingBottom,
}: ScreenShellProps) {
  const { colors } = usePrincipalTheme();
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
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surface }]} edges={['top']}>
      {header}
      <View style={styles.body}>{body}</View>
      {activeTab && onTabPress ? <PrincipalBottomNav activeTab={activeTab} onTabPress={onTabPress} /> : null}
    </SafeAreaView>
  );
}

function createStyles(colors: ReturnType<typeof usePrincipalTheme>['colors']) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surface, maxWidth: spacing.maxWidth, width: '100%', alignSelf: 'center' },
    body: { flex: 1 },
    bodyFill: { flex: 1 },
  });
}
