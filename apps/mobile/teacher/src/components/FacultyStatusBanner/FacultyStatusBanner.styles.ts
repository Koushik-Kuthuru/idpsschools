import { StyleSheet } from 'react-native';
import { borderRadius, colors, spacing } from '@/theme';

export const styles = StyleSheet.create({
  online: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    backgroundColor: `${colors.primaryContainer}14`,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: `${colors.primaryContainer}33`,
  },
  onlineText: { color: colors.primaryContainer, fontWeight: '700' },
  offline: {
    padding: spacing.md,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    gap: spacing.sm,
  },
  offlineRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  offlineTextCol: { flex: 1 },
  offlineTitle: { color: colors.error, fontWeight: '700' },
  offlineSub: { color: colors.onSurfaceVariant, marginTop: 2 },
  retryBtn: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.primaryContainer,
    borderRadius: borderRadius.lg,
  },
  retryText: { color: colors.onPrimary, fontWeight: '600' },
  queueLink: { marginTop: spacing.xs },
  queueText: { color: colors.primaryContainer, fontWeight: '600' },
});
