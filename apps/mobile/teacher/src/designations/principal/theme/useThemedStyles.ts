import { useMemo } from 'react';
import type { PrincipalColorScheme } from './colors';
import { usePrincipalTheme } from './PrincipalThemeContext';

export function useThemedStyles<T>(factory: (colors: PrincipalColorScheme) => T): T {
  const { colors } = usePrincipalTheme();
  return useMemo(() => factory(colors), [colors]);
}
