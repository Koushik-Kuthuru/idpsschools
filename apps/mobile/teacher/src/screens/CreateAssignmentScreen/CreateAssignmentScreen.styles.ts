import { StyleSheet } from 'react-native';
import { colors, spacing } from '@/theme';

export const styles = StyleSheet.create({
  body: { flex: 1, padding: spacing.md, gap: spacing.md },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.slate100,
    backgroundColor: colors.surfaceContainerLowest,
  },
});
