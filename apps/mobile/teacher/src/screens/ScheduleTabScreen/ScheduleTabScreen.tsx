import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types';
import { styles } from './ScheduleTabScreen.styles';
import type { ScheduleTabScreenProps } from './ScheduleTabScreen.types';

export function ScheduleTabScreen({ navigation: tabNav }: ScheduleTabScreenProps) {
  const stackNav = tabNav.getParent<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    stackNav?.navigate('ClassTimetable');
  }, [stackNav]);

  return <View style={styles.placeholder} />;
}
