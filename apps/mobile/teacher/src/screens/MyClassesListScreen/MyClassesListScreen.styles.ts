import { StyleSheet } from 'react-native';
import { colors, spacing } from '@/theme';

export const styles = StyleSheet.create({
  summaryBand: {
    paddingHorizontal: spacing.md,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: colors.canvas,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.slate200,
  },
  summaryChipWarn: {
    backgroundColor: '#fef3c7',
    borderColor: '#fcd34d',
  },
  summaryChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  summaryChipTextWarn: {
    color: '#b45309',
  },
  summaryMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.slate500,
    paddingHorizontal: 2,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: spacing.sm,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 11,
    fontWeight: '800',
    color: colors.slate900,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionMeta: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.slate500,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  cardStack: {
    gap: 0,
  },
});
