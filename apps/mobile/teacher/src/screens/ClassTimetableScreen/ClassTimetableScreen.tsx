import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppHeader, ScreenLayout } from '@/components';
import { mockApi } from '@/services/api';
import type { RootStackParamList, TimetablePeriod } from '@/types';
import { textStyle } from '@/theme';
import { handleBottomNavPress } from '@/utils/navigationHelpers';
import { styles } from './ClassTimetableScreen.styles';
import type { ClassTimetableScreenProps } from './ClassTimetableScreen.types';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export function ClassTimetableScreen(_props: ClassTimetableScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [periods, setPeriods] = useState<TimetablePeriod[]>([]);
  const [activeDay, setActiveDay] = useState(0);

  useEffect(() => {
    mockApi.timetable.get().then(setPeriods);
  }, []);

  return (
    <ScreenLayout
      scroll
      header={<AppHeader variant="back" title="Class Timetable" chipLabel="Week view" />}
      bottomNav={{
        activeTab: 'classes',
        onTabPress: (tab) => handleBottomNavPress(navigation, tab),
      }}
    >
      <View style={styles.content}>
        <View style={styles.dayRow}>
          {DAYS.map((d, i) => (
            <TouchableOpacity
              key={d}
              style={[styles.dayPill, i === activeDay && styles.dayPillActive]}
              onPress={() => setActiveDay(i)}
            >
              <Text style={[textStyle('labelSm'), styles.dayText, i === activeDay && styles.dayTextActive]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {periods.map((p) => {
          const accentStyle = StyleSheet.create({ bar: { backgroundColor: p.accentColor } }).bar;
          return (
            <View key={p.id} style={[styles.periodCard, p.isBreak && styles.periodBreak]}>
              <View style={[styles.accentBar, accentStyle]} />
              <View>
                <Text style={[textStyle('cardTitle16'), styles.periodSubject]}>{p.subject}</Text>
                <Text style={[textStyle('bodyMd'), styles.periodMeta]}>
                  {p.time}{p.room ? ` · ${p.room}` : ''}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </ScreenLayout>
  );
}
