import { StyleSheet } from 'react-native';
import { borderRadius, colors, spacing } from '@/theme';

export const styles = StyleSheet.create({
  banner: { padding: spacing.lg },
  bannerTitle: { color: colors.onPrimary },
  bannerSub: { color: colors.onPrimary, opacity: 0.9, marginTop: spacing.xs },
  content: { padding: spacing.md, gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.slate100,
  },
  rowName: { color: colors.onSurface, flex: 1 },
  rowMarks: { color: colors.primaryContainer },
  rowPending: { color: colors.outline },
  avatar: { width: 40, height: 40, borderRadius: borderRadius.full },
});
