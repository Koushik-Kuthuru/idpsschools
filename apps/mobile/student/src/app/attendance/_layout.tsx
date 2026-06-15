import { Stack } from 'expo-router';

export default function AttendanceLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="overview" />
      <Stack.Screen name="detailed" />
      <Stack.Screen name="by-subject" />
    </Stack>
  );
}
