import React, { useEffect, useMemo, useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppHeader, ScreenLayout, StudentCard } from '@/components';
import { mockApi } from '@/services/api';
import type { RootStackParamList, Student } from '@/types';
import { textStyle } from '@/theme';
import { handleBottomNavPress } from '@/utils/navigationHelpers';
import { styles } from './MyStudentsListScreen.styles';
import type { MyStudentsListScreenProps } from './MyStudentsListScreen.types';

const FILTERS = ['All', 'High Attendance', 'At Risk'] as const;

export function MyStudentsListScreen(_props: MyStudentsListScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [students, setStudents] = useState<Student[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');

  useEffect(() => {
    mockApi.students.list().then(setStudents);
  }, []);

  const filtered = useMemo(() => {
    let list = students.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()));
    if (filter === 'High Attendance') list = list.filter((s) => s.attendancePercent >= 90);
    if (filter === 'At Risk') list = list.filter((s) => s.attendancePercent < 80);
    return list;
  }, [students, query, filter]);

  return (
    <ScreenLayout
      scroll
      header={<AppHeader variant="back" title="My Students" chipLabel="Class 10-A" />}
      bottomNav={{
        activeTab: 'classes',
        onTabPress: (tab) => handleBottomNavPress(navigation, tab),
      }}
    >
      <View style={styles.content}>
        <TextInput
          style={[textStyle('bodyMd'), styles.search]}
          placeholder="Search students..."
          value={query}
          onChangeText={setQuery}
        />
        <View style={styles.chips}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.chip, filter === f && styles.chipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[textStyle('labelSm'), styles.chipText, filter === f && styles.chipTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <FlatList
          data={filtered}
          keyExtractor={(s) => s.id}
          scrollEnabled={false}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <StudentCard
              name={item.name}
              rollNo={item.rollNo}
              className={item.className}
              avatarUrl={item.avatarUrl}
              attendancePercent={item.attendancePercent}
              onPress={() => navigation.navigate('StudentDetail', { studentId: item.id })}
            />
          )}
        />
      </View>
    </ScreenLayout>
  );
}
