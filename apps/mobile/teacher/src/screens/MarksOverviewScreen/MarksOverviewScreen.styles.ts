import { StyleSheet } from 'react-native';
import { borderRadius, colors, spacing } from '@/theme';

export const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md },
  hero: {
    backgroundColor: colors.primaryContainer,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  heroPct: { color: colors.onPrimary },
  heroLabel: { color: colors.onPrimary, marginTop: spacing.xs },
  subjectCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.slate100,
  },
  subjectName: { color: colors.onSurface },
  subjectAvg: { color: colors.primaryContainer, marginTop: spacing.xs },
});
