import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useAppStore } from '@/store/appStore';
import { darkColors, lightColors, type AcademicColorScheme } from './colors';

interface AcademicThemeContextValue {
  colors: AcademicColorScheme;
  isDark: boolean;
}

const AcademicThemeContext = createContext<AcademicThemeContextValue>({
  colors: lightColors,
  isDark: false,
});

export function AcademicThemeProvider({ children }: { children: ReactNode }) {
  const isDark = useAppStore((s) => s.darkMode);
  const value = useMemo(
    () => ({
      colors: isDark ? darkColors : lightColors,
      isDark,
    }),
    [isDark],
  );

  return (
    <AcademicThemeContext.Provider value={value}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {children}
    </AcademicThemeContext.Provider>
  );
}

export function useAcademicTheme() {
  return useContext(AcademicThemeContext);
}
