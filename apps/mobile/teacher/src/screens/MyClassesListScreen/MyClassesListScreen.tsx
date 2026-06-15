import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppHeader, FacultyClassCard, FacultyStatusBanner, ScreenLayout } from '@/components';
import { mockApi } from '@/services/api';
import type { FacultyClass, RootStackParamList } from '@/types';
import { textStyle } from '@/theme';
import { handleBottomNavPress } from '@/utils/navigationHelpers';
import { styles } from './MyClassesListScreen.styles';

export function MyClassesListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [classes, setClasses] = useState<FacultyClass[]>([]);

  useFocusEffect(
    useCallback(() => {
      mockApi.faculty.getClasses().then(setClasses);
    }, []),
  );

  return (
    <ScreenLayout
      scroll
      header={<AppHeader variant="back" title="MY CLASSES" />}
      bottomNav={{ activeTab: 'classes', onTabPress: (t) => handleBottomNavPress(navigation, t) }}
    >
      <View style={styles.content}>
        <FacultyStatusBanner />
        {classes.map((c) => (
          <FacultyClassCard
            key={c.id}
            title={c.name}
            lines={[
              c.subject,
              `Students: ${c.studentCount}`,
              `Avg Attendance: ${c.avgAttendance ?? 90}%`,
            ]}
            statusLabel="Active"
            statusDone
            actionLabel="View Students →"
            onPress={() => navigation.navigate('MyStudentsList')}
          />
        ))}
        <View style={styles.links}>
          <TouchableOpacity onPress={() => navigation.navigate('ClassTimetable')}>
            <Text style={[textStyle('labelLg'), styles.link]}>View Timetable</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('ExamDuties')}>
            <Text style={[textStyle('labelLg'), styles.link]}>View Exam Schedule</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenLayout>
  );
}
