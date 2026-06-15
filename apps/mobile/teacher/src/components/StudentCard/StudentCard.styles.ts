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
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: `${colors.primaryContainer}33`,
  },
  info: { flex: 1 },
  name: { color: colors.onSurface },
  meta: { color: colors.onSurfaceVariant, marginTop: 2 },
  percentWrap: { alignItems: 'flex-end' },
  percent: { color: colors.primaryContainer },
  percentLabel: { color: colors.outline, marginTop: 2 },
});
