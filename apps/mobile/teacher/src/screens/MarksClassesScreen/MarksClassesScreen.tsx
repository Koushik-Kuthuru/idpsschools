import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppHeader, FacultyClassCard, FacultyStatusBanner, ScreenLayout } from '@/components';
import { mockApi } from '@/services/api';
import type { MarksExamSession, RootStackParamList } from '@/types';
import { textStyle } from '@/theme';
import { handleBottomNavPress } from '@/utils/navigationHelpers';
import { styles } from './MarksClassesScreen.styles';

export function MarksClassesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [exams, setExams] = useState<MarksExamSession[]>([]);

  useFocusEffect(
    useCallback(() => {
      mockApi.faculty.getMarksExams().then(setExams);
    }, []),
  );

  return (
    <ScreenLayout
      scroll
      header={<AppHeader variant="back" title="MARKS ENTRY" />}
      bottomNav={{ activeTab: 'marks', onTabPress: (t) => handleBottomNavPress(navigation, t) }}
    >
      <View style={styles.content}>
        <FacultyStatusBanner />
        <Text style={[textStyle('labelLg'), styles.section]}>SELECT CLASS & EXAM</Text>
        {exams.map((e) => (
          <FacultyClassCard
            key={e.id}
            title={`CLASS ${e.className}`}
            lines={[
              `${e.subject} - ${e.examName}`,
              `Max Marks: ${e.maxMarks}`,
            ]}
            statusLabel={e.status === 'completed' ? 'Completed ✓' : 'Pending'}
            statusDone={e.status === 'completed'}
            actionLabel={e.status === 'completed' ? 'View Submitted →' : 'Enter Marks →'}
            onPress={() =>
              e.status === 'completed'
                ? navigation.navigate('MarksHistory')
                : navigation.navigate('EnterMarks', { examId: e.id, classId: e.classId })
            }
          />
        ))}
        <TouchableOpacity style={styles.historyLink} onPress={() => navigation.navigate('MarksHistory')}>
          <Text style={[textStyle('labelLg'), styles.historyText]}>View All Exams / History</Text>
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
}
