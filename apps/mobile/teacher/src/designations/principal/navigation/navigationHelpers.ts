import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PrincipalStackParamList, PrincipalTab } from './types';

export function handlePrincipalTabPress(
  navigation: NativeStackNavigationProp<PrincipalStackParamList>,
  tab: PrincipalTab,
) {
  switch (tab) {
    case 'home':
      navigation.navigate('MainTabs', { screen: 'Dashboard' });
      break;
    case 'academics':
      navigation.navigate('MainTabs', { screen: 'AcademicPerformance' });
      break;
    case 'staff':
      navigation.navigate('MainTabs', { screen: 'StaffManagement' });
      break;
    case 'reports':
      navigation.navigate('MainTabs', { screen: 'ReportsAnalytics' });
      break;
    case 'profile':
      navigation.navigate('MainTabs', { screen: 'Profile' });
      break;
    default:
      break;
  }
}
