import { StyleSheet } from 'react-native';
import { borderRadius, colors, shadows, spacing } from '@/theme';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.slate100,
    gap: spacing.xs,
    ...shadows.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { color: colors.onSurface, fontWeight: '700' },
  line: { color: colors.onSurfaceVariant },
  status: { marginTop: spacing.xs, fontWeight: '600' },
  statusPending: { color: colors.late },
  statusDone: { color: colors.primaryContainer },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.slate100,
  },
  actionText: { color: colors.primaryContainer, fontWeight: '700' },
});
