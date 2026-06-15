import { StyleSheet } from 'react-native';
import { borderRadius, colors, spacing } from '@/theme';

export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, maxWidth: spacing.maxWidth, width: '100%', alignSelf: 'center' },
  messages: { flex: 1, padding: spacing.md, gap: spacing.sm },
  bubbleSent: {
    alignSelf: 'flex-end',
    maxWidth: '80%',
    backgroundColor: colors.primaryContainer,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  bubbleReceived: {
    alignSelf: 'flex-start',
    maxWidth: '80%',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.slate100,
  },
  bubbleTextSent: { color: colors.onPrimary },
  bubbleTextReceived: { color: colors.onSurface },
  bubbleTime: { color: colors.outline, marginTop: spacing.xs },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.slate100,
    backgroundColor: colors.surfaceContainerLowest,
  },
  input: {
    flex: 1,
    backgroundColor: colors.slate100,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.onSurface,
  },
});
