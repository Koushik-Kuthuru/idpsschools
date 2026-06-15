import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { VicePrincipalStackParamList, VicePrincipalTab } from './types';

export function handleVpTabPress(
  navigation: NativeStackNavigationProp<VicePrincipalStackParamList>,
  tab: VicePrincipalTab,
) {
  switch (tab) {
    case 'home':
      navigation.navigate('MainTabs', { screen: 'Dashboard' });
      break;
    case 'schedule':
      navigation.navigate('MainTabs', { screen: 'TimetableSubstitution' });
      break;
    case 'events':
      navigation.navigate('MainTabs', { screen: 'CalendarEvents' });
      break;
    case 'data':
      navigation.navigate('MainTabs', { screen: 'ReportsAnalytics' });
      break;
    case 'profile':
      navigation.navigate('MainTabs', { screen: 'Profile' });
      break;
    default:
      break;
  }
}
