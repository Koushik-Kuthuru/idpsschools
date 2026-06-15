import { StyleSheet } from 'react-native';
import { borderRadius, colors, spacing } from '@/theme';

export const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md },
  dayRow: { flexDirection: 'row', gap: spacing.sm },
  dayPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.slate100,
  },
  dayPillActive: { backgroundColor: colors.primaryContainer },
  dayText: { color: colors.onSurfaceVariant },
  dayTextActive: { color: colors.onPrimary },
  periodCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderLeftWidth: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  periodBreak: { opacity: 0.7 },
  periodSubject: { color: colors.onSurface },
  periodMeta: { color: colors.onSurfaceVariant, marginTop: spacing.xs },
  accentBar: { width: 4, height: '100%', position: 'absolute', left: 0, top: 0, bottom: 0, borderTopLeftRadius: borderRadius.xl, borderBottomLeftRadius: borderRadius.xl },
});
