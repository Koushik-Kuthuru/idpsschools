import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '../AppIcon';
import { getBottomTabsForRole } from '@/config/roleConfig';
import { useAuthStore } from '@/store';
import { colors } from '@/theme';
import { styles } from './AppBottomNav.styles';
import type { AppBottomNavProps, BottomNavTab } from './AppBottomNav.types';

export const FACULTY_BOTTOM_TABS: { key: BottomNavTab; label: string; icon: string }[] = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'classes', label: 'Classes', icon: 'menu_book' },
  { key: 'attendance', label: 'Attendance', icon: 'fact_check' },
  { key: 'marks', label: 'Marks', icon: 'grade' },
  { key: 'profile', label: 'Profile', icon: 'person' },
];

/** @deprecated use FACULTY_BOTTOM_TABS */
export const DASHBOARD_BOTTOM_TABS = FACULTY_BOTTOM_TABS;

export function AppBottomNav({ activeTab, onTabPress }: AppBottomNavProps) {
  const insets = useSafeAreaInsets();
  const designation = useAuthStore((s) => s.user?.designation ?? 'teacher');
  const allowedTabs = getBottomTabsForRole(designation);
  const visibleTabs = FACULTY_BOTTOM_TABS.filter((tab) => allowedTabs.includes(tab.key));

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {visibleTabs.map((tab) => {
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
              style={[styles.label, active ? styles.labelActive : styles.labelInactive]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
