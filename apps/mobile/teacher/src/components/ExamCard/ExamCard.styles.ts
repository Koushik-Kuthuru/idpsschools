import { StyleSheet } from 'react-native';
import { borderRadius, colors, shadows, spacing } from '@/theme';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.slate100,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondaryContainer,
    ...shadows.sm,
  },
  subject: { color: colors.onSurface },
  meta: { color: colors.onSurfaceVariant, marginTop: spacing.xs },
  syllabusRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: spacing.sm },
  syllabusBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.slate100,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  syllabusFill: {
    height: '100%',
    backgroundColor: colors.secondaryContainer,
    borderRadius: borderRadius.full,
  },
  syllabusText: { color: colors.outline },
  statusChip: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainerLow,
  },
  statusText: { color: colors.secondaryContainer },
});
