import { StyleSheet } from 'react-native';
import { borderRadius, colors } from '@/theme';

export const STAT_CARD_HEIGHT = 118;

export const styles = StyleSheet.create({
  card: {
    minHeight: STAT_CARD_HEIGHT,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    justifyContent: 'flex-start',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  label: {
    color: colors.slate400,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 10,
    fontWeight: '800',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 4,
  },
  value: {
    color: colors.onSurface,
  },
  footerInline: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.slate400,
  },
  progressTrack: {
    width: '100%',
    height: 5,
    borderRadius: borderRadius.full,
    backgroundColor: '#f3f4f6',
    overflow: 'hidden',
    marginTop: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
  },
});
