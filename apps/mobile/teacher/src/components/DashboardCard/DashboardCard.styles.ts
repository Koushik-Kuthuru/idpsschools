import { StyleSheet } from 'react-native';
import { borderRadius, colors, shadows, spacing } from '@/theme';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    ...shadows.sm,
  },
  textBlock: {
    flex: 1,
    marginRight: spacing.sm,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.onSurface,
  },
  subtitle: {
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  highlight: {
    fontWeight: '500',
    color: colors.onSurface,
  },
  errorText: {
    color: colors.error,
    fontWeight: '500',
  },
});
