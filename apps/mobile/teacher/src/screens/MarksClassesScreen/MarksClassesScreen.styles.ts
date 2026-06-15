import { StyleSheet } from 'react-native';
import { colors, spacing } from '@/theme';

export const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md },
  section: { color: colors.onSurface, fontWeight: '700' },
  historyLink: { alignItems: 'center', paddingVertical: spacing.sm },
  historyText: { color: colors.primaryContainer, fontWeight: '600' },
});
