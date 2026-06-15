import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types';
import type { TakeAttendanceScreenProps } from './TakeAttendanceScreen.types';

/** Legacy route — swipe attendance is the default UX per Stitch */
export function TakeAttendanceScreen(_props: TakeAttendanceScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    navigation.replace('SwipeAttendance', { variant: 1 });
  }, [navigation]);

  return null;
}
