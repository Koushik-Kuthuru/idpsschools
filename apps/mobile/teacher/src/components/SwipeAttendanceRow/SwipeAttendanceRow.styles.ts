import { StyleSheet } from 'react-native';
import { borderRadius, colors, shadows, spacing } from '@/theme';

export const SWIPE_THRESHOLD = 80;
export const MAX_SWIPE_DRAG = 120;

export const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  actionLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
    backgroundColor: colors.absent,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    gap: spacing.sm,
  },
  actionRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 20,
    gap: spacing.sm,
  },
  actionLabel: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.slate100,
    ...shadows.sm,
  },
  cardPresent: {
    borderColor: colors.primaryContainer,
    backgroundColor: colors.presentBg,
  },
  cardAbsent: {
    borderColor: colors.absent,
    backgroundColor: colors.absentBg,
  },
  cardLate: {
    borderColor: colors.late,
    backgroundColor: colors.lateBg,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainer,
  },
  name: {
    color: colors.onSurface,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  rollChip: {
    backgroundColor: `${colors.primaryContainer}1A`,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  rollText: {
    color: colors.primaryContainer,
  },
  classText: {
    color: colors.slate500,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  lateBtn: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lateBtnActive: {
    backgroundColor: colors.lateBg,
  },
});
