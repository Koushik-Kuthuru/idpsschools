import { useMemo } from 'react';
import type { VicePrincipalColorScheme } from './colors';
import { useVicePrincipalTheme } from './VicePrincipalThemeContext';

export function useThemedStyles<T>(factory: (colors: VicePrincipalColorScheme) => T): T {
  const { colors } = useVicePrincipalTheme();
  return useMemo(() => factory(colors), [colors]);
}
