import { Stack } from 'expo-router';

export default function AssignmentsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="overview" />
      <Stack.Screen name="browse" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="[id]/submit" />
    </Stack>
  );
}
