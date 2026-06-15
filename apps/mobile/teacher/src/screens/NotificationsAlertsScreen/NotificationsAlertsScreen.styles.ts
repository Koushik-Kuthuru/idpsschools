import { StyleSheet } from 'react-native';
import { colors, spacing } from '@/theme';

export const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.sm },
  unreadBanner: { color: colors.primaryContainer, marginBottom: spacing.xs },
  allReadBanner: { color: colors.outline, marginBottom: spacing.xs },
});
