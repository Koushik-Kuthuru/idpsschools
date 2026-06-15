import { StyleSheet } from 'react-native';
import { borderRadius, colors, shadows, spacing } from '@/theme';

export const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: borderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  fullWidth: {
    width: '100%',
  },
  primary: {
    backgroundColor: colors.primaryContainer,
    ...shadows.primaryButton,
  },
  secondary: {
    backgroundColor: colors.surfaceContainerLow,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primaryContainer,
  },
  danger: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.absent,
  },
  labelPrimary: {
    color: colors.onPrimary,
  },
  labelOutline: {
    color: colors.primaryContainer,
  },
  labelDanger: {
    color: colors.absent,
  },
});
