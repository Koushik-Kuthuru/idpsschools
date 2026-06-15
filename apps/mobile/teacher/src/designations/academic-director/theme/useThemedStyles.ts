import { useMemo } from 'react';
import type { AcademicColorScheme } from './colors';
import { useAcademicTheme } from './AcademicThemeContext';

export function useThemedStyles<T>(factory: (colors: AcademicColorScheme) => T): T {
  const { colors } = useAcademicTheme();
  return useMemo(() => factory(colors), [colors]);
}
