import { StyleSheet } from 'react-native';
import { borderRadius, colors, spacing } from '@/theme';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.canvas,
  },
  containerIdentity: {
    minHeight: spacing.headerHeightLarge,
    height: undefined,
    paddingVertical: spacing.sm,
    alignItems: 'flex-start',
  },
  containerCompact: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.slate200,
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
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.slate100,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    color: colors.onSurface,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    color: colors.slate500,
    marginTop: 2,
  },
  greetingLabel: {
    color: colors.slate500,
  },
  chip: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
  },
  chipText: {
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 10,
    fontWeight: '700',
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
  notifyBtn: {
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    flexShrink: 0,
    marginTop: spacing.xs,
    backgroundColor: colors.slate100,
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
    color: colors.primary,
    fontWeight: '700',
  },
  identityCol: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
});
