import { StyleSheet } from 'react-native';
import { borderRadius, colors, shadows, spacing } from '@/theme';

export const styles = StyleSheet.create({
  card: {
    width: '100%',
    minHeight: 320,
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderColor: colors.slate100,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  cardPresent: {
    borderColor: colors.primaryContainer,
  },
  cardAbsent: {
    borderColor: colors.absent,
  },
  cardLate: {
    borderColor: colors.late,
  },
  avatar: {
    width: 160,
    height: 160,
    borderRadius: borderRadius.full,
    borderWidth: 4,
    borderColor: `${colors.primaryContainer}33`,
    marginBottom: spacing.lg,
    backgroundColor: colors.surfaceContainer,
  },
  name: {
    color: colors.onSurface,
    textAlign: 'center',
  },
  chips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  rollChip: {
    backgroundColor: `${colors.primaryContainer}1A`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  rollText: {
    color: colors.primaryContainer,
    fontWeight: '700',
  },
  classText: {
    color: colors.slate500,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    color: colors.primaryContainer,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.outline,
    marginTop: 2,
  },
  spacer: {
    flexGrow: 1,
    minHeight: spacing.sm,
  },
  note: {
    paddingTop: spacing.lg,
    color: colors.outline,
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.75,
    paddingHorizontal: spacing.sm,
  },
  indicator: {
    position: 'absolute',
    top: 24,
    borderWidth: 4,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    zIndex: 10,
  },
  indicatorPresent: {
    right: 20,
    borderColor: colors.primaryContainer,
    transform: [{ rotate: '10deg' }],
  },
  indicatorAbsent: {
    left: 20,
    borderColor: colors.absent,
    transform: [{ rotate: '-10deg' }],
  },
  indicatorTextPresent: {
    color: colors.primaryContainer,
    fontWeight: '800',
    letterSpacing: 1,
  },
  indicatorTextAbsent: {
    color: colors.absent,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
