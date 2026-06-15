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
  body: { padding: spacing.md, gap: spacing.md, flex: 1 },
  subtitle: { color: colors.onSurfaceVariant },
  meterTrack: {
    height: 8,
    backgroundColor: colors.slate100,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  meterFillWeak: { height: '100%', backgroundColor: colors.error, borderRadius: borderRadius.full },
  meterFillMid: { height: '100%', backgroundColor: colors.amber500, borderRadius: borderRadius.full },
  meterFillStrong: { height: '100%', backgroundColor: colors.primaryContainer, borderRadius: borderRadius.full },
  meterLabel: { color: colors.outline, marginTop: spacing.xs },
  strengthRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  strengthText: { color: colors.onSurfaceVariant },
});
