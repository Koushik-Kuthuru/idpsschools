import { StyleSheet } from 'react-native';
import { borderRadius, colors, spacing } from '@/theme';

export const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md },
  tabs: { flexDirection: 'row', gap: spacing.sm },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.slate100,
  },
  tabActive: { backgroundColor: colors.primaryContainer },
  tabText: { color: colors.onSurfaceVariant },
  tabTextActive: { color: colors.onPrimary },
  list: { gap: spacing.sm },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
