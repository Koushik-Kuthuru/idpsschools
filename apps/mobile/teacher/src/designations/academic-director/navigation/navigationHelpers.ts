import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AcademicTab, RootStackParamList } from './types';

export function handleAcademicTabPress(
  navigation: NativeStackNavigationProp<RootStackParamList>,
  tab: AcademicTab,
) {
  switch (tab) {
    case 'home':
      navigation.navigate('MainTabs', { screen: 'Dashboard' } as never);
      break;
    case 'staff':
      navigation.navigate('MainTabs', { screen: 'Staff' } as never);
      break;
    case 'curriculum':
      navigation.navigate('MainTabs', { screen: 'Curriculum' } as never);
      break;
    case 'exams':
      navigation.navigate('MainTabs', { screen: 'Exams' } as never);
      break;
    case 'profile':
      navigation.navigate('MainTabs', { screen: 'Profile' } as never);
      break;
    default:
      break;
  }
}
