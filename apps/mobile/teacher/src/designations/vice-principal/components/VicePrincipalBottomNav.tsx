import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/AppIcon';
import { spacing, useThemedStyles, useVicePrincipalTheme } from '../theme';
import { shadows } from '@/theme';
import type { VicePrincipalTab } from '../navigation/types';

const TABS: { key: VicePrincipalTab; label: string; icon: string }[] = [
  { key: 'home', label: 'Home', icon: 'dashboard' },
  { key: 'schedule', label: 'Schedule', icon: 'schedule' },
  { key: 'events', label: 'Events', icon: 'event_note' },
  { key: 'data', label: 'Data', icon: 'description' },
  { key: 'profile', label: 'Profile', icon: 'person' },
];

interface Props {
  activeTab: VicePrincipalTab;
  onTabPress: (tab: VicePrincipalTab) => void;
}

export function VicePrincipalBottomNav({ activeTab, onTabPress }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useVicePrincipalTheme();
  const styles = useThemedStyles(createStyles);

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
          <TouchableOpacity key={tab.key} style={styles.tab} onPress={() => onTabPress(tab.key)} activeOpacity={0.7}>
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

function createStyles(colors: ReturnType<typeof useVicePrincipalTheme>['colors']) {
  return StyleSheet.create({
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
}
