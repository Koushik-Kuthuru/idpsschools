import { StyleSheet } from 'react-native';
import { colors, shadows, spacing } from '@/theme';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: spacing.bottomNavHeight,
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
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
  labelActive: {
    color: colors.primaryContainer,
    fontWeight: '700',
  },
  labelInactive: {
    color: colors.onSurfaceVariant,
    fontWeight: '500',
  },
});
