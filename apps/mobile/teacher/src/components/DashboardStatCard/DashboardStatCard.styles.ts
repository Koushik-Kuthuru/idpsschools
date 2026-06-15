import { StyleSheet } from 'react-native';
import { borderRadius, colors, shadows, spacing } from '@/theme';

export const STAT_CARD_HEIGHT = 120;

export const styles = StyleSheet.create({
  card: {
    height: STAT_CARD_HEIGHT,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    justifyContent: 'space-between',
    ...shadows.sm,
  },
  value: {
    color: colors.onSurface,
  },
  label: {
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.outlineVariant}4D`,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryContainer,
  },
  footerChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  footerText: {
    color: colors.onSurfaceVariant,
  },
  iconEnd: {
    alignSelf: 'flex-end',
    opacity: 0.4,
  },
});
