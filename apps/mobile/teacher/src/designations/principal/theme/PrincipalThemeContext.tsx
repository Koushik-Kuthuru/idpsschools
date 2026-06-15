import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useAppStore } from '@/store/appStore';
import { darkColors, lightColors, type PrincipalColorScheme } from './colors';

interface PrincipalThemeContextValue {
  colors: PrincipalColorScheme;
  isDark: boolean;
}

const PrincipalThemeContext = createContext<PrincipalThemeContextValue>({
  colors: lightColors,
  isDark: false,
});

export function PrincipalThemeProvider({ children }: { children: ReactNode }) {
  const isDark = useAppStore((s) => s.darkMode);
  const value = useMemo(
    () => ({
      colors: isDark ? darkColors : lightColors,
      isDark,
    }),
    [isDark],
  );

  return (
    <PrincipalThemeContext.Provider value={value}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {children}
    </PrincipalThemeContext.Provider>
  );
}

export function usePrincipalTheme() {
  return useContext(PrincipalThemeContext);
}
