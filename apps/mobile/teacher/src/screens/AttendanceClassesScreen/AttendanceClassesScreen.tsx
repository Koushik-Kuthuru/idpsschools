import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppHeader, FacultyClassCard, FacultyStatusBanner, ScreenLayout } from '@/components';
import { mockApi } from '@/services/api';
import type { FacultyClass, RootStackParamList } from '@/types';
import { textStyle } from '@/theme';
import { handleBottomNavPress } from '@/utils/navigationHelpers';
import { styles } from './AttendanceClassesScreen.styles';

export function AttendanceClassesScreen() {
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
      header={<AppHeader variant="back" title="ATTENDANCE" />}
      bottomNav={{ activeTab: 'attendance', onTabPress: (t) => handleBottomNavPress(navigation, t) }}
    >
      <View style={styles.content}>
        <FacultyStatusBanner
          onRetry={() => {}}
          onViewQueue={() => navigation.navigate('SyncQueue')}
          pendingCount={3}
        />
        <Text style={[textStyle('labelLg'), styles.section]}>SELECT CLASS</Text>
        {classes.map((c) => (
          <FacultyClassCard
            key={c.id}
            title={c.name}
            lines={[
              `${c.studentCount} Students`,
              `Period: ${c.period}`,
              c.subject,
            ]}
            statusLabel={c.attendanceStatus === 'completed' ? 'Completed ✓' : 'Pending'}
            statusDone={c.attendanceStatus === 'completed'}
            actionLabel={c.attendanceStatus === 'completed' ? 'View Submitted →' : 'Mark Attendance →'}
            onPress={() =>
              c.attendanceStatus === 'completed'
                ? navigation.navigate('SubmittedAttendance', { classId: c.id })
                : navigation.navigate('SwipeAttendance', { classId: c.id })
            }
          />
        ))}
        <TouchableOpacity style={styles.historyLink} onPress={() => navigation.navigate('AttendanceHistory')}>
          <Text style={[textStyle('labelLg'), styles.historyText]}>View History</Text>
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
}
