import { StyleSheet } from 'react-native';
import { colors, spacing } from '@/theme';

export const styles = StyleSheet.create({
  summaryBand: {
    paddingHorizontal: spacing.md,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: colors.canvas,
  },
  summaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  summaryChipUnread: {
    backgroundColor: `${colors.primary}10`,
    borderColor: `${colors.primary}33`,
  },
  summaryChipClear: {
    backgroundColor: `${colors.secondary}14`,
    borderColor: `${colors.secondary}44`,
  },
  summaryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  summaryTextUnread: {
    color: colors.primary,
  },
  summaryTextClear: {
    color: colors.secondary,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
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
  list: {
    gap: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: spacing.lg,
    gap: 10,
  },
  emptyIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.slate100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.slate900,
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.slate500,
    textAlign: 'center',
    lineHeight: 20,
  },
});
