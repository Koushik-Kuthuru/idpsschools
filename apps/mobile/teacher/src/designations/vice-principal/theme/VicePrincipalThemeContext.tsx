import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useAppStore } from '@/store/appStore';
import { darkColors, lightColors, type VicePrincipalColorScheme } from './colors';

interface VicePrincipalThemeContextValue {
  colors: VicePrincipalColorScheme;
  isDark: boolean;
}

const VicePrincipalThemeContext = createContext<VicePrincipalThemeContextValue>({
  colors: lightColors,
  isDark: false,
});

export function VicePrincipalThemeProvider({ children }: { children: ReactNode }) {
  const isDark = useAppStore((s) => s.darkMode);
  const value = useMemo(
    () => ({ colors: isDark ? darkColors : lightColors, isDark }),
    [isDark],
  );

  return (
    <VicePrincipalThemeContext.Provider value={value}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {children}
    </VicePrincipalThemeContext.Provider>
  );
}

export function useVicePrincipalTheme() {
  return useContext(VicePrincipalThemeContext);
}
