import { TextStyle } from 'react-native';

export const fontFamily = {
  regular: 'Lexend_400Regular',
  medium: 'Lexend_500Medium',
  semiBold: 'Lexend_600SemiBold',
  bold: 'Lexend_700Bold',
  extraBold: 'Lexend_800ExtraBold',
} as const;

/** Stitch design system typography tokens */
export const typography = {
  headlineLg: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700' as const,
    letterSpacing: -0.48,
  },
  headlineMd: {
    fontFamily: fontFamily.semiBold,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600' as const,
  },
  headlineSm: {
    fontFamily: fontFamily.semiBold,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600' as const,
  },
  bodyLg: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  bodyMd: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  labelLg: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600' as const,
  },
  labelSm: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
  },
  /** Mobile extensions from Stitch HTML */
  headlineLgMobile: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700' as const,
    letterSpacing: -0.56,
  },
  headlineSmMobile: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600' as const,
  },
  labelSmMobile: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500' as const,
  },
  splashTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 36,
    lineHeight: 36,
    fontWeight: '700' as const,
  },
  statNumber: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '700' as const,
  },
  cardTitle16: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600' as const,
  },
  studentName: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700' as const,
  },
  chip10: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700' as const,
  },
  timestamp11: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '400' as const,
  },
  subtitle13: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500' as const,
  },
} as const;

export type TypographyToken = keyof typeof typography;

export function textStyle(token: TypographyToken): TextStyle {
  return typography[token];
}
