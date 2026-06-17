import { StyleSheet } from 'react-native';
import { borderRadius, colors, spacing } from '@/theme';
import { cardShadow } from '@/utils/cardShadow';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    flexDirection: 'row',
    gap: spacing.md,
    ...cardShadow,
  },
  cardUnread: {
    borderColor: `${colors.primary}33`,
    backgroundColor: `${colors.primary}08`,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconAcademic: { backgroundColor: `${colors.primary}14` },
  iconUrgent: { backgroundColor: '#fef2f2' },
  iconSystem: { backgroundColor: '#fef3c7' },
  info: { flex: 1, minWidth: 0 },
  title: {
    color: colors.slate900,
    fontWeight: '700',
  },
  body: {
    color: colors.slate500,
    marginTop: 4,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: spacing.sm,
  },
  time: {
    color: colors.slate400,
    flex: 1,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  markRead: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  readLabel: {
    color: colors.slate400,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
});
