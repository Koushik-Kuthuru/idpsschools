import { StyleSheet } from 'react-native';
import { borderRadius, colors, spacing } from '@/theme';

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
    maxWidth: spacing.maxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  body: { padding: spacing.md, gap: spacing.lg, flex: 1 },
  subtitle: { color: colors.onSurfaceVariant, textAlign: 'center' },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  otpBox: {
    width: 44,
    height: 52,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.slate200,
    backgroundColor: colors.surfaceContainerLowest,
    textAlign: 'center',
    fontSize: 20,
    color: colors.onSurface,
  },
  otpBoxFocused: { borderColor: colors.primaryContainer, borderWidth: 2 },
  errorText: { color: colors.error, textAlign: 'center' },
  resend: { alignItems: 'center' },
  resendText: { color: colors.primaryContainer },
});
