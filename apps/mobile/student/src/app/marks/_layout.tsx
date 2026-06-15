import { Stack } from 'expo-router';

export default function MarksLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="overview" />
      <Stack.Screen name="subject/[id]" />
      <Stack.Screen name="performance" />
    </Stack>
  );
}
