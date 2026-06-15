import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types';
import { styles } from './AssignmentsTabScreen.styles';
import type { AssignmentsTabScreenProps } from './AssignmentsTabScreen.types';

export function AssignmentsTabScreen({ navigation: tabNav }: AssignmentsTabScreenProps) {
  const stackNav = tabNav.getParent<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    stackNav?.navigate('AssignmentsList');
  }, [stackNav]);

  return <View style={styles.placeholder} />;
}
