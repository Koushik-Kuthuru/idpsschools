import { StyleSheet } from 'react-native';
import { borderRadius, colors, shadows, spacing } from '@/theme';
import { textStyle } from '@/theme/typography';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.slate100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.sm,
  },
  info: { flex: 1 },
  name: { color: colors.onSurface },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 },
  rollChip: {
    backgroundColor: `${colors.primaryContainer}1A`,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  rollText: { color: colors.primaryContainer },
  classText: { color: colors.slate500 },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.slate100,
    borderRadius: borderRadius.full,
    padding: 4,
    height: 36,
    alignItems: 'center',
  },
  segBtn: {
    width: 32,
    height: 28,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segBtnText: {
    ...textStyle('labelSm'),
    color: colors.outline,
  },
  segBtnTextActive: {
    color: colors.onPrimary,
  },
  segPresent: { backgroundColor: colors.primaryContainer },
  segAbsent: { backgroundColor: colors.absent },
  segLate: { backgroundColor: colors.late },
});
