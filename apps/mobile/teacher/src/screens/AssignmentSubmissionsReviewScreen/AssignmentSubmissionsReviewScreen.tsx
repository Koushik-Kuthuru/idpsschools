import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { AppHeader, ScreenLayout } from '@/components';
import { mockApi } from '@/services/api';
import { colors, textStyle } from '@/theme';
import { styles } from './AssignmentSubmissionsReviewScreen.styles';
import type { AssignmentSubmissionsReviewScreenProps } from './AssignmentSubmissionsReviewScreen.types';

type Submission = Awaited<ReturnType<typeof mockApi.assignments.getSubmissions>>[number];

export function AssignmentSubmissionsReviewScreen({ route }: AssignmentSubmissionsReviewScreenProps) {
  const [rows, setRows] = useState<Submission[]>([]);
  const assignmentId = route.params?.assignmentId ?? 'a1';

  useEffect(() => {
    mockApi.assignments.getSubmissions(assignmentId).then(setRows);
  }, [assignmentId]);

  return (
    <ScreenLayout scroll header={<AppHeader variant="back" title="Submissions" />}>
      <LinearGradient colors={[colors.secondaryContainer, colors.primaryContainer]} style={styles.banner}>
        <Text style={[textStyle('headlineMd'), styles.bannerTitle]}>Algebra Worksheet Ch.5</Text>
        <Text style={[textStyle('bodyMd'), styles.bannerSub]}>Review and grade submissions</Text>
      </LinearGradient>
      <View style={styles.content}>
        <FlatList
          data={rows}
          keyExtractor={(r) => r.student.id}
          scrollEnabled={false}
          contentContainerStyle={styles.content}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Image source={{ uri: item.student.avatarUrl }} style={styles.avatar} contentFit="cover" />
              <Text style={[textStyle('cardTitle16'), styles.rowName]}>{item.student.name}</Text>
              <Text style={[textStyle('labelLg'), item.marks != null ? styles.rowMarks : styles.rowPending]}>
                {item.marks != null ? `${item.marks}%` : item.submitted ? 'Pending grade' : 'Not submitted'}
              </Text>
            </View>
          )}
        />
      </View>
    </ScreenLayout>
  );
}
