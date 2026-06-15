import { useMemo } from 'react';
import { useThemeStore } from '@/store';
import { lightTheme, darkTheme, type AppTheme } from '@/constants/theme';

export function useTheme(): AppTheme {
  const isDark = useThemeStore((s) => s.isDark);
  return useMemo(() => (isDark ? darkTheme : lightTheme), [isDark]);
}

export function useThemedStyles<T>(factory: (theme: AppTheme) => T): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [theme, factory]);
}
