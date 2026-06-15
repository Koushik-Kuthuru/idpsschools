import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppButton, AppHeader, ScreenLayout } from '@/components';
import { useAttendanceStore } from '@/store';
import type { AttendanceStatus, RootStackParamList } from '@/types';
import { textStyle } from '@/theme';
import { handleBottomNavPress } from '@/utils/navigationHelpers';
import { styles } from './SwipeStackAttendanceScreen.styles';
import type { SwipeStackAttendanceScreenProps } from './SwipeStackAttendanceScreen.types';

export function SwipeStackAttendanceScreen({ route }: SwipeStackAttendanceScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const variant = route.params?.variant ?? 2;
  const { students, loadSession, setStatus } = useAttendanceStore();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const current = students[index];
  const next = students[index + 1];

  const mark = (status: AttendanceStatus) => {
    if (!current) return;
    setStatus(current.id, status);
    if (index < students.length - 1) setIndex((i) => i + 1);
  };

  return (
    <ScreenLayout
      header={<AppHeader variant="back" title={`Card Stack · V${variant}`} chipLabel="Stack UI" />}
      bottomNav={{
        activeTab: 'home',
        onTabPress: (tab) => handleBottomNavPress(navigation, tab),
      }}
    >
      <View style={styles.content}>
        <View style={styles.stack}>
          {next ? (
            <View style={[styles.stackCard, styles.stackCardBack]}>
              <Text style={[textStyle('cardTitle16'), styles.stackName]}>{next.name}</Text>
            </View>
          ) : null}
          {current ? (
            <View style={[styles.stackCard, next ? styles.stackCardMid : null]}>
              <Text style={[textStyle('headlineMd'), styles.stackName]}>{current.name}</Text>
              <Text style={[textStyle('bodyMd'), styles.stackMeta]}>Roll {current.rollNo} · {current.className}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.footer}>
          <Text style={[textStyle('bodyMd'), styles.footerText]}>Tap to mark then advance stack</Text>
          <AppButton label="Present" variant="primary" onPress={() => mark('present')} fullWidth={false} />
          <AppButton label="Absent" variant="danger" onPress={() => mark('absent')} fullWidth={false} />
        </View>
      </View>
    </ScreenLayout>
  );
}
