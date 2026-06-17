import { StyleSheet } from 'react-native';
import { borderRadius, colors, spacing } from '@/theme';
import { cardShadow } from '@/utils/cardShadow';

export const DECK_HEIGHT = 280;
export const DECK_HEIGHT_EMPTY = 148;
export const SWIPE_THRESHOLD = 100;
export const FLY_DISTANCE = 420;

export const styles = StyleSheet.create({
  deck: {
    height: DECK_HEIGHT,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSlot: {
    position: 'absolute',
    width: '100%',
    paddingHorizontal: spacing.xs,
  },
  cardSlotBack2: {
    transform: [{ scale: 0.9 }, { translateY: 20 }],
    opacity: 0.7,
    zIndex: 1,
  },
  cardSlotBack1: {
    transform: [{ scale: 0.95 }, { translateY: 10 }],
    opacity: 0.9,
    zIndex: 2,
  },
  cardSlotTop: {
    zIndex: 3,
  },
  swipableWrap: {
    width: '100%',
  },
  indicator: {
    position: 'absolute',
    top: 24,
    borderWidth: 4,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    zIndex: 10,
  },
  indicatorPresent: {
    right: 20,
    borderColor: colors.primary,
    transform: [{ rotate: '10deg' }],
  },
  indicatorAbsent: {
    left: 20,
    borderColor: colors.error,
    transform: [{ rotate: '-10deg' }],
  },
  indicatorTextPresent: {
    color: colors.primary,
    fontWeight: '800',
    letterSpacing: 1,
  },
  indicatorTextAbsent: {
    color: colors.error,
    fontWeight: '800',
    letterSpacing: 1,
  },
  empty: {
    height: DECK_HEIGHT_EMPTY,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    backgroundColor: `${colors.secondary}14`,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${colors.secondary}44`,
  },
  emptyText: {
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
    maxWidth: 320,
    alignSelf: 'center',
    width: '100%',
  },
  actionBtn: {
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    ...cardShadow,
  },
  actionUndo: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
  },
  actionAbsent: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: `${colors.error}33`,
    backgroundColor: '#fef2f2',
  },
  actionLate: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: '#fcd34d',
    backgroundColor: '#fef3c7',
  },
  actionPresent: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: `${colors.primary}33`,
    backgroundColor: `${colors.primary}10`,
  },
});
