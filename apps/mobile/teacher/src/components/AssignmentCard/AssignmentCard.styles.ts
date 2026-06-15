import { StyleSheet } from 'react-native';
import { borderRadius, colors, shadows, spacing } from '@/theme';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.slate100,
    ...shadows.sm,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { color: colors.onSurface, flex: 1 },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainerLow,
  },
  badgeDraft: { backgroundColor: colors.slate100 },
  badgeText: { color: colors.primaryContainer },
  badgeTextDraft: { color: colors.slate500 },
  meta: { color: colors.onSurfaceVariant, marginTop: spacing.xs },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: spacing.sm },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.slate100,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primaryContainer,
    borderRadius: borderRadius.full,
  },
  progressText: { color: colors.outline },
});
