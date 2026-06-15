import { StyleSheet } from 'react-native';
import { borderRadius, colors, spacing } from '@/theme';

export const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md, flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainerLow,
  },
  chipActive: { backgroundColor: colors.primaryContainer },
  chipText: { color: colors.onSurfaceVariant },
  chipTextActive: { color: colors.onPrimary },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.slate100,
  },
  summaryItem: { alignItems: 'center' },
  summaryValue: { color: colors.onSurface },
  summaryPresent: { color: colors.primaryContainer },
  summaryAbsent: { color: colors.absent },
  summaryLate: { color: colors.late },
  actions: { flexDirection: 'row', gap: spacing.sm },
  list: { gap: spacing.sm, flex: 1 },
  submitBar: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.slate100,
    backgroundColor: colors.surfaceContainerLowest,
  },
});
