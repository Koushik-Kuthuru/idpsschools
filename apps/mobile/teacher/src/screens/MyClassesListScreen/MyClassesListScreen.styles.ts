import { StyleSheet } from 'react-native';
import { colors, spacing } from '@/theme';

export const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md },
  links: { gap: spacing.sm, marginTop: spacing.sm },
  link: { color: colors.primaryContainer, fontWeight: '600', textAlign: 'center' },
});
