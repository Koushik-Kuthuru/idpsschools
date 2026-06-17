import { StyleSheet } from 'react-native';
import { colors, shadows } from '@/theme';

export const activePillBg = colors.primaryLight;
export const activeColor = colors.primary;
export const inactiveColor = colors.slate500;
export const activeIndicatorColor = colors.primary;

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingTop: 6,
    paddingHorizontal: 4,
    backgroundColor: colors.surfaceContainerLowest,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.slate100,
    ...shadows.tabBar,
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
