import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useHomeworkUnread } from '@/hooks/useHomeworkUnread';
import { tabBarShadow } from '@/constants/shadows';

type IoniconName = keyof typeof Ionicons.glyphMap;
type MaterialIconName = keyof typeof MaterialIcons.glyphMap;

export interface TabItem {
  name: string;
  title: string;
  icon: IoniconName;
  iconFocused: IoniconName;
  materialIcon?: MaterialIconName;
}

export const TAB_ITEMS: TabItem[] = [
  { name: 'index', title: 'Home', icon: 'home-outline', iconFocused: 'home' },
  { name: 'notice-board', title: 'Notice board', icon: 'clipboard-outline', iconFocused: 'clipboard', materialIcon: 'assignment' },
  { name: 'learning', title: 'Learning Management', icon: 'library-outline', iconFocused: 'library', materialIcon: 'menu-book' },
  { name: 'fees', title: 'Fees', icon: 'wallet-outline', iconFocused: 'wallet' },
  { name: 'profile', title: 'Profile', icon: 'person-outline', iconFocused: 'person' },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CustomTabBar({ state, navigation }: any) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { unreadCount } = useHomeworkUnread();

  return (
    <View
      style={[
        styles.tabBarOuter,
        {
          paddingBottom: Math.max(insets.bottom, 10),
          backgroundColor: theme.colors.tabBar,
          borderTopColor: theme.colors.border,
        },
        tabBarShadow,
      ]}
    >
      <View style={styles.tabBarInner}>
        {state.routes.map((route: { name: string; key: string }, index: number) => {
          const tab = TAB_ITEMS.find((t) => t.name === route.name);
          if (!tab) return null;
          const focused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.7}
              style={styles.tab}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={tab.title}
            >
              <View
                style={[
                  styles.iconPill,
                  focused && { backgroundColor: theme.colors.primaryLight },
                ]}
              >
                {tab.materialIcon ? (
                  <MaterialIcons
                    name={tab.materialIcon}
                    size={focused ? 24 : 22}
                    color={focused ? theme.colors.primary : theme.colors.textMuted}
                  />
                ) : (
                  <Ionicons
                    name={focused ? tab.iconFocused : tab.icon}
                    size={focused ? 24 : 22}
                    color={focused ? theme.colors.primary : theme.colors.textMuted}
                  />
                )}
                {tab.name === 'learning' && unreadCount > 0 ? (
                  <View style={[styles.navUnreadDot, { backgroundColor: theme.colors.red500, borderColor: theme.colors.tabBar }]} />
                ) : null}
              </View>
              {focused ? (
                <View style={[styles.activeIndicator, { backgroundColor: theme.colors.primary }]} />
              ) : (
                <View style={styles.activeIndicatorPlaceholder} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarOuter: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabBarInner: {
    flexDirection: 'row',
    paddingTop: 6,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 2,
  },
  iconPill: {
    width: 44,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  navUnreadDot: {
    position: 'absolute',
    top: 2,
    right: 4,
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1.5,
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 6,
  },
  activeIndicatorPlaceholder: {
    width: 4,
    height: 4,
    marginTop: 6,
  },
});
