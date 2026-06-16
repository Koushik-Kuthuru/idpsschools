import { Stack } from 'expo-router';

export default function FeesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="payments-overview" />
      <Stack.Screen name="history" />
      <Stack.Screen name="receipts" />
      <Stack.Screen name="receipt" />
    </Stack>
  );
}
