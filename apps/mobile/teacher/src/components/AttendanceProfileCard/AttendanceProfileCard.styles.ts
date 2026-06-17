import { StyleSheet } from 'react-native';
import { borderRadius, colors, spacing } from '@/theme';
import { teacherBrand } from '@/theme/brand';
import { cardShadow } from '@/utils/cardShadow';

export const styles = StyleSheet.create({
  card: {
    width: '100%',
    minHeight: 220,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    ...cardShadow,
  },
  cardPresent: {
    borderColor: `${colors.primary}55`,
  },
  cardAbsent: {
    borderColor: `${colors.error}55`,
  },
  cardLate: {
    borderColor: '#fcd34d',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: teacherBrand.navy,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
  },
  schoolName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
  schoolTag: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
    letterSpacing: 0.4,
  },
  idBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: teacherBrand.amber,
  },
  idBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: teacherBrand.navyDark,
    letterSpacing: 0.8,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
  },
  photoFrame: {
    width: 96,
    height: 118,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: teacherBrand.navy,
    overflow: 'hidden',
    backgroundColor: colors.slate100,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.primary}14`,
  },
  photoInitials: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
  },
  details: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.slate900,
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.slate500,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.slate900,
  },
  attendanceValue: {
    color: colors.primary,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 14,
    gap: 6,
  },
  footerAccent: {
    height: 3,
    borderRadius: borderRadius.full,
    backgroundColor: teacherBrand.amber,
  },
  footerText: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.slate400,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
});
