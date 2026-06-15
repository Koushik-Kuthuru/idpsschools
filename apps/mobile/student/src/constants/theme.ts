export const colors = {
  primary: '#144835',
  primaryLight: 'rgba(20, 72, 53, 0.1)',
  primaryBorder: 'rgba(20, 72, 53, 0.2)',
  accent: '#a2c144',
  backgroundLight: '#f6f8f7',
  backgroundDark: '#10221c',
  white: '#ffffff',
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',
  slate900: '#0f172a',
  red500: '#ef4444',
  blue500: '#3b82f6',
  amber500: '#f59e0b',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const typography = {
  fontFamily: {
    regular: 'Lexend_400Regular',
    medium: 'Lexend_500Medium',
    semiBold: 'Lexend_600SemiBold',
    bold: 'Lexend_700Bold',
  },
} as const;

export type ThemeMode = 'light' | 'dark';

export const lightTheme = {
  mode: 'light' as ThemeMode,
  colors: {
    ...colors,
    background: colors.backgroundLight,
    surface: colors.white,
    text: colors.slate900,
    textSecondary: colors.slate500,
    textMuted: colors.slate400,
    border: colors.slate100,
    card: colors.white,
    tabBar: colors.white,
    input: colors.slate50,
  },
};

export const darkTheme = {
  mode: 'dark' as ThemeMode,
  colors: {
    ...colors,
    background: colors.backgroundDark,
    surface: colors.slate800,
    text: colors.slate100,
    textSecondary: colors.slate400,
    textMuted: colors.slate500,
    border: colors.slate800,
    card: colors.slate900,
    tabBar: colors.slate900,
    input: colors.slate800,
  },
};

export type AppTheme = typeof lightTheme | typeof darkTheme;
