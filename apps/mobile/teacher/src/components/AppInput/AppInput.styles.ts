import { StyleSheet } from 'react-native';
import { borderRadius, colors, spacing } from '@/theme';

export const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  label: {
    color: colors.onSurfaceVariant,
    marginLeft: 4,
  },
  inputWrap: {
    position: 'relative',
  },
  input: {
    height: 48,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.slate200,
    backgroundColor: colors.surfaceContainerLowest,
    paddingLeft: 40,
    paddingRight: spacing.md,
    color: colors.onSurface,
  },
  inputWithToggle: {
    paddingRight: 44,
  },
  icon: {
    position: 'absolute',
    left: 12,
    top: 12,
    zIndex: 1,
  },
  toggle: {
    position: 'absolute',
    right: 12,
    top: 12,
    zIndex: 1,
  },
  error: {
    color: colors.error,
    marginLeft: 4,
  },
});
