import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ManagerStackParamList, ManagerTab } from './types';

export function handleManagerTabPress(navigation: NativeStackNavigationProp<ManagerStackParamList>, tab: ManagerTab) {
  switch (tab) {
    case 'home':
      navigation.navigate('MainTabs', { screen: 'Dashboard' } as never);
      break;
    case 'timetable':
      navigation.navigate('MainTabs', { screen: 'Timetable' } as never);
      break;
    case 'calendar':
      navigation.navigate('MainTabs', { screen: 'Calendar' } as never);
      break;
    case 'tasks':
      navigation.navigate('MainTabs', { screen: 'Tasks' } as never);
      break;
    case 'profile':
      navigation.navigate('MainTabs', { screen: 'Profile' } as never);
      break;
    default:
      break;
  }
}
