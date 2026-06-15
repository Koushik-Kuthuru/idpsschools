import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppHeader, AppIcon, AssignmentCard, ScreenLayout } from '@/components';
import { mockApi } from '@/services/api';
import type { Assignment, RootStackParamList } from '@/types';
import { colors, textStyle } from '@/theme';
import { handleBottomNavPress } from '@/utils/navigationHelpers';
import { styles } from './AssignmentsListScreen.styles';
import type { AssignmentsListScreenProps } from './AssignmentsListScreen.types';

const FILTERS = ['All', 'Published', 'Draft'] as const;

export function AssignmentsListScreen(_props: AssignmentsListScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [items, setItems] = useState<Assignment[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');

  const loadAssignments = useCallback(() => {
    mockApi.assignments.list().then(setItems);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAssignments();
    }, [loadAssignments]),
  );

  const filtered = useMemo(() => {
    if (filter === 'All') return items;
    return items.filter((a) => a.status === filter.toLowerCase());
  }, [items, filter]);

  return (
    <ScreenLayout
      scroll
      header={<AppHeader variant="back" title="Assignments" />}
      bottomNav={{
        activeTab: 'classes',
        onTabPress: (tab) => handleBottomNavPress(navigation, tab),
      }}
    >
      <View style={styles.content}>
        <View style={styles.tabs}>
          {FILTERS.map((f) => (
            <TouchableOpacity key={f} style={[styles.tab, filter === f && styles.tabActive]} onPress={() => setFilter(f)}>
              <Text style={[textStyle('labelSm'), styles.tabText, filter === f && styles.tabTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <FlatList
          data={filtered}
          keyExtractor={(a) => a.id}
          scrollEnabled={false}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <AssignmentCard
              title={item.title}
              subject={item.subject}
              dueDate={item.dueDate}
              status={item.status}
              submissionsCount={item.submissionsCount}
              totalStudents={item.totalStudents}
              onPress={() => navigation.navigate('AssignmentSubmissionsReview', { assignmentId: item.id })}
            />
          )}
        />
      </View>
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateAssignment')}>
        <AppIcon name="add" color={colors.onPrimary} size={28} />
      </TouchableOpacity>
    </ScreenLayout>
  );
}
