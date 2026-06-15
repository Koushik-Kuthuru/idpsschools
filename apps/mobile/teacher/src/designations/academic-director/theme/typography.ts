import { TextStyle } from 'react-native';

export const fontFamily = {
  light: 'Lexend_400Regular',
  regular: 'Lexend_400Regular',
  medium: 'Lexend_500Medium',
  semiBold: 'Lexend_600SemiBold',
  bold: 'Lexend_700Bold',
  extraBold: 'Lexend_800ExtraBold',
} as const;

export const typography = {
  displayLg: { fontFamily: fontFamily.bold, fontSize: 32, lineHeight: 40, fontWeight: '700' as const, letterSpacing: -0.64 },
  headlineLgMobile: { fontFamily: fontFamily.semiBold, fontSize: 22, lineHeight: 28, fontWeight: '600' as const },
  headlineMd: { fontFamily: fontFamily.semiBold, fontSize: 20, lineHeight: 28, fontWeight: '600' as const },
  titleLg: { fontFamily: fontFamily.medium, fontSize: 18, lineHeight: 24, fontWeight: '500' as const },
  bodyLg: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodyMd: { fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  labelMd: { fontFamily: fontFamily.medium, fontSize: 12, lineHeight: 16, fontWeight: '500' as const, letterSpacing: 0.6 },
  chip10: { fontFamily: fontFamily.bold, fontSize: 10, lineHeight: 12, fontWeight: '700' as const },
} as const;

export type TypographyToken = keyof typeof typography;

export function textStyle(token: TypographyToken): TextStyle {
  return typography[token];
}
