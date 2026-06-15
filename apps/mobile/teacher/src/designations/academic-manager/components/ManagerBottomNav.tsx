import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/AppIcon';
import { colors, spacing } from '@/designations/academic-manager/theme';
import { shadows } from '@/theme';
import type { ManagerTab } from '../navigation/types';

const TABS: { key: ManagerTab; label: string; icon: string }[] = [
  { key: 'home', label: 'Home', icon: 'dashboard' },
  { key: 'timetable', label: 'Timetable', icon: 'schedule' },
  { key: 'calendar', label: 'Calendar', icon: 'calendar_month' },
  { key: 'tasks', label: 'Tasks', icon: 'assignment' },
  { key: 'profile', label: 'Profile', icon: 'person' },
];

interface Props {
  activeTab: ManagerTab;
  onTabPress: (tab: ManagerTab) => void;
}

export function ManagerBottomNav({ activeTab, onTabPress }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 8),
          backgroundColor: colors.surfaceContainerLowest,
          borderTopColor: colors.outlineVariant,
        },
      ]}
    >
      {TABS.map((tab) => {
        const active = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onTabPress(tab.key)}
            activeOpacity={0.7}
          >
            <AppIcon
              name={tab.icon}
              size={22}
              color={active ? colors.primaryContainer : colors.onSurfaceVariant}
              filled={active}
            />
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
              style={[
                styles.label,
                active ? { color: colors.primaryContainer, fontWeight: '700' } : { color: colors.onSurfaceVariant, fontWeight: '500' },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: spacing.bottomNavHeight,
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.xs,
    borderTopWidth: 1,
    maxWidth: spacing.maxWidth,
    width: '100%',
    alignSelf: 'center',
    ...shadows.tabBar,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: 2,
    gap: 2,
  },
  label: {
    fontSize: 9,
    lineHeight: 11,
    textAlign: 'center',
    width: '100%',
  },
});
