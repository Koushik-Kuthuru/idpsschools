import { StyleSheet } from 'react-native';
import { borderRadius, colors, shadows, spacing } from '@/theme';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    height: spacing.headerHeightLarge,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  containerIdentity: {
    minHeight: spacing.headerHeightLarge,
    height: undefined,
    paddingVertical: spacing.sm,
    alignItems: 'flex-start',
  },
  containerCompact: {
    height: spacing.headerHeight,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: spacing.sm,
    marginRight: spacing.xs,
  },
  backBtn: {
    padding: spacing.xs,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    color: colors.onSurface,
  },
  subtitle: {
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  greetingLabel: {
    color: colors.onSurfaceVariant,
  },
  chip: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.primaryContainer}1A`,
  },
  chipText: {
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.primaryContainer,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: borderRadius.full,
    backgroundColor: colors.green500,
    borderWidth: 2,
    borderColor: colors.surfaceContainerLowest,
  },
  notifyBtn: {
    padding: spacing.sm,
    borderRadius: borderRadius.full,
    flexShrink: 0,
    marginTop: spacing.xs,
  },
  notifyDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.error,
  },
  rightAction: {
    color: colors.primaryContainer,
    fontWeight: '700',
  },
  identityCol: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
});

export const notifyShadow = shadows.sm;
