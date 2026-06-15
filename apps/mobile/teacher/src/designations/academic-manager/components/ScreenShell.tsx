import React, { type ReactNode } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '@/designations/academic-manager/theme';
import { ManagerBottomNav } from './ManagerBottomNav';
import type { ManagerTab } from '../navigation/types';

interface ScreenShellProps {
  children: ReactNode;
  scroll?: boolean;
  header?: ReactNode;
  activeTab?: ManagerTab;
  onTabPress?: (tab: ManagerTab) => void;
  /** Extra space below scroll content. Defaults to a small gutter — bottom nav is laid out separately. */
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
  const bottomPad = paddingBottom ?? spacing.gutter;

  const body = scroll ? (
    <ScrollView contentContainerStyle={{ paddingBottom: bottomPad }} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={styles.bodyFill}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {header}
      <View style={styles.body}>{body}</View>
      {activeTab && onTabPress ? <ManagerBottomNav activeTab={activeTab} onTabPress={onTabPress} /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface, maxWidth: spacing.maxWidth, width: '100%', alignSelf: 'center' },
  body: { flex: 1 },
  bodyFill: { flex: 1 },
});
