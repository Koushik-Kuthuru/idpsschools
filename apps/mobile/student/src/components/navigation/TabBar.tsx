import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

export interface TabItem {
  name: string;
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  iconFocused: keyof typeof MaterialIcons.glyphMap;
}

export const TAB_ITEMS: TabItem[] = [
  { name: 'index', title: 'Home', icon: 'home', iconFocused: 'home' },
  { name: 'marks', title: 'Marks', icon: 'grade', iconFocused: 'grade' },
  { name: 'attendance', title: 'Attendance', icon: 'how-to-reg', iconFocused: 'how-to-reg' },
  { name: 'fees', title: 'Fees', icon: 'payments', iconFocused: 'payments' },
  { name: 'profile', title: 'Profile', icon: 'person', iconFocused: 'person' },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CustomTabBar({ state, navigation }: any) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: theme.colors.tabBar,
          borderTopColor: theme.colors.border,
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}
    >
      {state.routes.map((route: { name: string; key: string }, index: number) => {
        const tab = TAB_ITEMS.find((t) => t.name === route.name);
        if (!tab) return null;
        const focused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <TouchableOpacity key={route.key} onPress={onPress} style={styles.tab}>
            <MaterialIcons
              name={focused ? tab.iconFocused : tab.icon}
              size={24}
              color={focused ? theme.colors.primary : theme.colors.textMuted}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color: focused ? theme.colors.primary : theme.colors.textMuted,
                  fontWeight: focused ? '700' : '500',
                },
              ]}
            >
              {tab.title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  tabLabel: { fontSize: 10 },
});
