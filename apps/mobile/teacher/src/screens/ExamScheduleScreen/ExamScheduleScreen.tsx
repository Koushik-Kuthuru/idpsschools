import React, { useEffect, useState } from 'react';
import { View, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppHeader, ExamCard, ScreenLayout } from '@/components';
import { mockApi } from '@/services/api';
import type { ExamItem, RootStackParamList } from '@/types';
import { handleBottomNavPress } from '@/utils/navigationHelpers';
import { styles } from './ExamScheduleScreen.styles';
import type { ExamScheduleScreenProps } from './ExamScheduleScreen.types';

export function ExamScheduleScreen(_props: ExamScheduleScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [exams, setExams] = useState<ExamItem[]>([]);

  useEffect(() => {
    mockApi.exams.list().then(setExams);
  }, []);

  return (
    <ScreenLayout
      scroll
      header={<AppHeader variant="back" title="Exam Schedule" />}
      bottomNav={{
        activeTab: 'classes',
        onTabPress: (tab) => handleBottomNavPress(navigation, tab),
      }}
    >
      <View style={styles.content}>
        <FlatList
          data={exams}
          keyExtractor={(e) => e.id}
          scrollEnabled={false}
          contentContainerStyle={styles.content}
          renderItem={({ item }) => (
            <ExamCard
              subject={item.subject}
              date={item.date}
              time={item.time}
              room={item.room}
              status={item.status}
              syllabusPercent={item.syllabusPercent}
            />
          )}
        />
      </View>
    </ScreenLayout>
  );
}
