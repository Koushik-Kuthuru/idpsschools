import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomNavTab } from '@/components/AppBottomNav/AppBottomNav.types';
import { getBottomTabsForRole, isTabAllowedForRole } from '@/config/roleConfig';
import { useAuthStore } from '@/store';
import type { RootStackParamList } from '@/types/navigation';

export function handleBottomNavPress(
  navigation: NativeStackNavigationProp<RootStackParamList>,
  tab: BottomNavTab,
) {
  const designation = useAuthStore.getState().user?.designation ?? 'teacher';
  const resolvedTab = isTabAllowedForRole(designation, tab)
    ? tab
    : getBottomTabsForRole(designation)[0];

  switch (resolvedTab) {
    case 'home':
      navigation.navigate('MainTabs', { screen: 'Dashboard' });
      break;
    case 'classes':
      navigation.navigate('MainTabs', { screen: 'Classes' });
      break;
    case 'attendance':
      navigation.navigate('MainTabs', { screen: 'Attendance' });
      break;
    case 'marks':
      navigation.navigate('MainTabs', { screen: 'Marks' });
      break;
    case 'profile':
      navigation.navigate('MainTabs', { screen: 'Profile' });
      break;
    default:
      break;
  }
}
