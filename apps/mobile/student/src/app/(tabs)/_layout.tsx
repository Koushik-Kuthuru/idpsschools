import { Tabs } from 'expo-router';
import { CustomTabBar } from '@/components/navigation/TabBar';
import { useTheme } from '@/hooks/useTheme';

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="notice-board" options={{ title: 'Notice board' }} />
      <Tabs.Screen name="learning" options={{ title: 'Learning Management' }} />
      <Tabs.Screen name="attendance" options={{ href: null }} />
      <Tabs.Screen name="fees" options={{ title: 'Fees' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
