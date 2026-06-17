import { StyleSheet } from 'react-native';
import { borderRadius, colors, spacing } from '@/theme';

export const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
    width: '100%',
  },
  label: {
    color: colors.slate500,
    marginLeft: 4,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  inputWrap: {
    position: 'relative',
  },
  input: {
    height: 56,
    borderRadius: borderRadius.xl,
    borderWidth: 0,
    backgroundColor: colors.slate100,
    paddingLeft: 48,
    paddingRight: spacing.md,
    color: colors.slate900,
    fontSize: 16,
  },
  inputWithToggle: {
    paddingRight: 48,
  },
  icon: {
    position: 'absolute',
    left: 16,
    top: 17,
    zIndex: 1,
  },
  toggle: {
    position: 'absolute',
    right: 16,
    top: 17,
    zIndex: 1,
  },
  error: {
    color: colors.error,
    marginLeft: 4,
    fontSize: 12,
    marginTop: 4,
  },
});
