import { StyleSheet } from 'react-native';
import { borderRadius, colors, spacing } from '@/theme';

export const styles = StyleSheet.create({
  hero: { padding: spacing.xl, paddingTop: spacing.lg },
  heroName: { color: colors.onPrimary },
  heroMeta: { color: colors.onPrimary, opacity: 0.9, marginTop: spacing.xs },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    borderWidth: 3,
    borderColor: colors.onPrimary,
    marginBottom: spacing.md,
  },
  content: { padding: spacing.md, gap: spacing.md, marginTop: -spacing.lg },
  statsRow: { flexDirection: 'row', gap: spacing.cardGap },
  statCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: { color: colors.primaryContainer },
  statLabel: { color: colors.onSurfaceVariant, marginTop: spacing.xs },
  tabs: { flexDirection: 'row', gap: spacing.sm },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.slate100,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: colors.primaryContainer },
  tabText: { color: colors.onSurfaceVariant },
  tabTextActive: { color: colors.onPrimary },
  panel: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.slate100,
  },
  panelText: { color: colors.onSurfaceVariant },
});
