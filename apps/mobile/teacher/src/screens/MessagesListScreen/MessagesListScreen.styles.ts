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
  list: { gap: spacing.sm },
});
