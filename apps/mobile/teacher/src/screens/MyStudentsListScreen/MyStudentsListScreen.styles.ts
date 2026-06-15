import { StyleSheet } from 'react-native';
import { borderRadius, colors, spacing } from '@/theme';

export const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md },
  search: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.slate100,
    color: colors.onSurface,
  },
  chips: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.slate100,
  },
  chipActive: { backgroundColor: colors.primaryContainer },
  chipText: { color: colors.onSurfaceVariant },
  chipTextActive: { color: colors.onPrimary },
  list: { gap: spacing.sm },
});
