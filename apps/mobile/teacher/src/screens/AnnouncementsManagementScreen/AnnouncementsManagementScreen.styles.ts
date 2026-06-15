import { StyleSheet } from 'react-native';
import { borderRadius, colors, spacing } from '@/theme';

export const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md },
  composer: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.slate100,
    gap: spacing.sm,
  },
  composerInput: {
    minHeight: 80,
    color: colors.onSurface,
    textAlignVertical: 'top',
  },
  historyTitle: { color: colors.onSurface },
  item: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primaryContainer,
  },
  itemUrgent: { borderLeftColor: colors.error },
  itemTitle: { color: colors.onSurface },
  itemTime: { color: colors.outline, marginTop: spacing.xs },
  empty: { color: colors.onSurfaceVariant },
});
