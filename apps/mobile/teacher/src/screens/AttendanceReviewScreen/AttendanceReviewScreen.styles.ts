import { StyleSheet } from 'react-native';
import { borderRadius, colors, shadows, spacing } from '@/theme';

export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.md, paddingBottom: 120 },
  banner: {
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
  },
  bannerText: { color: colors.onSurfaceVariant },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    ...shadows.sm,
  },
  summaryItem: { alignItems: 'center' },
  list: { gap: spacing.sm },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.md,
    backgroundColor: colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    gap: spacing.sm,
  },
  backBtn: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  backText: { color: colors.primaryContainer, fontWeight: '600' },
  confirmBtn: {
    backgroundColor: colors.primaryContainer,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    ...shadows.md,
  },
  confirmText: { color: colors.onPrimary, fontWeight: '700' },
});
