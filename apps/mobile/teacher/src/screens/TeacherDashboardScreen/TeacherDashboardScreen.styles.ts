import { StyleSheet } from 'react-native';
import { borderRadius, colors, spacing } from '@/theme';
import { STAT_CARD_HEIGHT } from '@/components/DashboardStatCard/DashboardStatCard.styles';

export const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionLabel: {
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  overviewStack: {
    gap: spacing.sm,
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.cardGap / 2,
  },
  bentoCell: {
    width: '50%',
    paddingHorizontal: spacing.cardGap / 2,
    marginBottom: spacing.cardGap,
    minHeight: STAT_CARD_HEIGHT,
  },
  announcementsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seeAll: {
    color: colors.primaryContainer,
    fontWeight: '600',
  },
  announcement: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    gap: spacing.xs,
  },
  announcementUrgent: {
    borderLeftColor: colors.error,
  },
  announcementMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryChip: {
    backgroundColor: `${colors.primary}1A`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  categoryChipUrgent: {
    backgroundColor: `${colors.error}1A`,
  },
  categoryText: {
    color: colors.primary,
    textTransform: 'uppercase',
  },
  categoryTextUrgent: {
    color: colors.error,
  },
  announcementTitle: {
    color: colors.onSurface,
  },
  announcementTime: {
    color: colors.outline,
  },
});
