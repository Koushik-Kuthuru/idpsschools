import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppButton, AppHeader, ScreenLayout } from '@/components';
import { mockApi } from '@/services/api';
import type { RootStackParamList } from '@/types';
import { textStyle } from '@/theme';
import { handleBottomNavPress } from '@/utils/navigationHelpers';
import { styles } from './MarksOverviewScreen.styles';
import type { MarksOverviewScreenProps } from './MarksOverviewScreen.types';

export function MarksOverviewScreen(_props: MarksOverviewScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [data, setData] = useState<Awaited<ReturnType<typeof mockApi.marks.getOverview>> | null>(null);

  useEffect(() => {
    mockApi.marks.getOverview().then(setData);
  }, []);

  return (
    <ScreenLayout
      scroll
      header={<AppHeader variant="back" title="Marks Overview" />}
      bottomNav={{
        activeTab: 'home',
        onTabPress: (tab) => handleBottomNavPress(navigation, tab),
      }}
    >
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={[textStyle('splashTitle'), styles.heroPct]}>{data?.classAverage ?? 74}%</Text>
          <Text style={[textStyle('bodyMd'), styles.heroLabel]}>Class Average</Text>
        </View>
        {data?.subjects.map((s) => (
          <View key={s.name} style={styles.subjectCard}>
            <Text style={[textStyle('cardTitle16'), styles.subjectName]}>{s.name}</Text>
            <Text style={[textStyle('statNumber'), styles.subjectAvg]}>{s.avg}% avg</Text>
          </View>
        ))}
        <AppButton label="Enter Marks" onPress={() => navigation.navigate('EnterMarks')} />
      </View>
    </ScreenLayout>
  );
}
