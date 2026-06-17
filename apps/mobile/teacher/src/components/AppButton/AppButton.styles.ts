import { StyleSheet } from 'react-native';
import { borderRadius, colors, shadows, spacing } from '@/theme';

export const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 16,
  },
  fullWidth: {
    width: '100%',
  },
  flat: {
    shadowOpacity: 0,
    elevation: 0,
  },
  primary: {
    backgroundColor: colors.primary,
    ...shadows.primaryButton,
  },
  secondary: {
    backgroundColor: colors.surfaceContainerLow,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  danger: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.absent,
  },
  labelPrimary: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  labelOutline: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  labelDanger: {
    color: colors.absent,
    fontSize: 14,
    fontWeight: '700',
  },
});
