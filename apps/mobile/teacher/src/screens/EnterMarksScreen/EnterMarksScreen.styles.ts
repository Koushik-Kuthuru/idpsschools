import { StyleSheet } from 'react-native';
import { borderRadius, colors, spacing } from '@/theme';

export const styles = StyleSheet.create({
  body: { flex: 1, padding: spacing.md, gap: spacing.md },
  selectors: { flexDirection: 'row', gap: spacing.sm },
  selector: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
  },
  selectorText: { color: colors.onSurface },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.slate100,
  },
  rowName: { color: colors.onSurface, flex: 1 },
  markInput: {
    width: 56,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    color: colors.onSurface,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.slate100,
    backgroundColor: colors.surfaceContainerLowest,
  },
});
