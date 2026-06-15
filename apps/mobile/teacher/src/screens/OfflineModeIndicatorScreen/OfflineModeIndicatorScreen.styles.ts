import { StyleSheet } from 'react-native';
import { borderRadius, colors, spacing } from '@/theme';

export const styles = StyleSheet.create({
  content: { flex: 1, padding: spacing.md, justifyContent: 'center', gap: spacing.lg },
  banner: {
    backgroundColor: colors.amber500,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  bannerTitle: { color: colors.onPrimary },
  bannerBody: { color: colors.onPrimary, textAlign: 'center' },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.slate100,
  },
  cardText: { color: colors.onSurfaceVariant },
});
