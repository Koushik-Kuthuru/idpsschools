import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppButton, AppHeader, ScreenLayout } from '@/components';
import { mockApi } from '@/services/api';
import type { RootStackParamList, Student } from '@/types';
import { textStyle } from '@/theme';
import { styles } from './EnterMarksScreen.styles';
import type { EnterMarksScreenProps } from './EnterMarksScreen.types';

export function EnterMarksScreen(_props: EnterMarksScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Record<string, string>>({});

  useEffect(() => {
    mockApi.students.list().then(setStudents);
  }, []);

  return (
    <ScreenLayout header={<AppHeader variant="back" title="Enter Marks" />}>
      <View style={styles.body}>
        <View style={styles.selectors}>
          <View style={styles.selector}>
            <Text style={[textStyle('labelSm'), styles.selectorText]}>Mathematics</Text>
          </View>
          <View style={styles.selector}>
            <Text style={[textStyle('labelSm'), styles.selectorText]}>Unit Test 2</Text>
          </View>
        </View>
        <FlatList
          data={students}
          keyExtractor={(s) => s.id}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={[textStyle('studentName'), styles.rowName]}>{item.name}</Text>
              <TextInput
                style={[textStyle('bodyMd'), styles.markInput]}
                keyboardType="number-pad"
                placeholder="—"
                value={marks[item.id] ?? ''}
                onChangeText={(v) => setMarks((m) => ({ ...m, [item.id]: v }))}
              />
            </View>
          )}
        />
      </View>
      <View style={styles.footer}>
        <AppButton
          label="Submit & Sync"
          onPress={() =>
            navigation.navigate('MarksSuccess', { className: '10-A', examName: 'Mathematics · Final' })
          }
        />
      </View>
    </ScreenLayout>
  );
}
