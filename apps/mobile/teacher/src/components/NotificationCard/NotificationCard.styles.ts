import { StyleSheet } from 'react-native';
import { borderRadius, colors, shadows, spacing } from '@/theme';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.slate100,
    flexDirection: 'row',
    gap: spacing.md,
    ...shadows.sm,
  },
  cardUnread: {
    backgroundColor: colors.surfaceContainerLow,
    borderColor: colors.primaryContainer,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconAcademic: { backgroundColor: `${colors.primaryContainer}1A` },
  iconUrgent: { backgroundColor: colors.errorContainer },
  iconSystem: { backgroundColor: colors.surfaceContainerHigh },
  info: { flex: 1 },
  title: { color: colors.onSurface },
  body: { color: colors.onSurfaceVariant, marginTop: spacing.xs },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  time: { color: colors.outline, flex: 1 },
  markRead: { color: colors.primaryContainer, fontWeight: '700' },
  readLabel: { color: colors.outline },
  dot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryContainer,
    marginTop: spacing.xs,
  },
});
