import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Lexend_400Regular,
  Lexend_500Medium,
  Lexend_600SemiBold,
  Lexend_700Bold,
  useFonts,
} from '@expo-google-fonts/lexend';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore, useThemeStore, useSettingsStore } from '@/store';
import { useTheme } from '@/hooks/useTheme';
import { usePushNotifications } from '@/hooks/useNotifications';
import { OfflineBanner } from '@/components/navigation/OfflineBanner';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 2 } },
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, restoreSession } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const theme = useTheme();

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuth) {
      router.replace('/(auth)/splash');
    } else if (isAuthenticated && inAuth) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Lexend_400Regular,
    Lexend_500Medium,
    Lexend_600SemiBold,
    Lexend_700Bold,
  });
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const isDark = useThemeStore((s) => s.isDark);
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const theme = useTheme();
  usePushNotifications(notificationsEnabled);

  useEffect(() => {
    hydrateTheme();
    hydrateSettings();
  }, [hydrateTheme, hydrateSettings]);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AuthGuard>
        <View style={{ flex: 1 }}>
          <OfflineBanner />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="attendance" />
            <Stack.Screen name="marks" />
            <Stack.Screen name="assignments" />
            <Stack.Screen name="exams" />
            <Stack.Screen name="fees" />
            <Stack.Screen name="announcements" />
            <Stack.Screen name="notifications/index" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="offline" options={{ presentation: 'modal' }} />
          </Stack>
        </View>
      </AuthGuard>
    </QueryClientProvider>
  );
}
