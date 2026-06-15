import { StyleSheet } from 'react-native';
import { borderRadius, colors, shadows, spacing } from '@/theme';

export const styles = StyleSheet.create({
  content: { flex: 1, padding: spacing.md, alignItems: 'center', justifyContent: 'center' },
  stack: { width: '100%', height: 320, alignItems: 'center', justifyContent: 'center' },
  stackCard: {
    position: 'absolute',
    width: '90%',
    backgroundColor: colors.stackCardDark,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.stackCardBorder,
    ...shadows.sm,
  },
  stackCardBack: { transform: [{ scale: 0.92 }, { translateY: 16 }] },
  stackCardMid: { transform: [{ scale: 0.96 }, { translateY: 8 }] },
  stackName: { color: colors.inverseOnSurface },
  stackMeta: { color: colors.outlineVariant, marginTop: spacing.xs },
  footer: { marginTop: spacing.xl, alignItems: 'center', gap: spacing.sm },
  footerText: { color: colors.onSurfaceVariant },
});
