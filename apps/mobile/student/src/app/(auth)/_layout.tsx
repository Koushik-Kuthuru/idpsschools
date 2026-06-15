import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';

export default function AuthLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: theme.colors.card },
      }}
    >
      <Stack.Screen name="splash" />
      <Stack.Screen name="login" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="reset-success" />
    </Stack>
  );
}
