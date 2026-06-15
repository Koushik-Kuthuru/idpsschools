import { StyleSheet } from 'react-native';
import { borderRadius, colors, spacing } from '@/theme';

export const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md },
  section: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.slate100,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { color: colors.onSurface },
  linkText: { color: colors.primaryContainer },
  dangerText: { color: colors.error },
});
