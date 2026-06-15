import { StyleSheet } from 'react-native';
import { borderRadius, colors, spacing } from '@/theme';

export const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md },
  donutWrap: { alignItems: 'center', paddingVertical: spacing.lg },
  donutOuter: {
    width: 160,
    height: 160,
    borderRadius: borderRadius.full,
    borderWidth: 12,
    borderColor: colors.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutInner: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.primaryContainer}1A`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutPct: { color: colors.primaryContainer },
  donutLabel: { color: colors.onSurfaceVariant },
  monthlyScroll: { gap: spacing.cardGap, paddingVertical: spacing.sm },
  monthCard: {
    minWidth: 140,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.slate100,
  },
  monthTitle: { color: colors.onSurface },
  monthStat: { color: colors.onSurfaceVariant, marginTop: spacing.xs },
  listGap: { gap: spacing.sm },
  takeBtn: { marginTop: spacing.sm },
});
