import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types';
import { styles } from './StudentsTabScreen.styles';
import type { StudentsTabScreenProps } from './StudentsTabScreen.types';

export function StudentsTabScreen({ navigation: tabNav }: StudentsTabScreenProps) {
  const stackNav = tabNav.getParent<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    stackNav?.navigate('MyStudentsList');
  }, [stackNav]);

  return <View style={styles.placeholder} />;
}
