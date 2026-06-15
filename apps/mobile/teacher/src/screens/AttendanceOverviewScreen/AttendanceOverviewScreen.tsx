import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppButton, AppHeader, ScreenLayout, StudentCard } from '@/components';
import { mockApi } from '@/services/api';
import type { RootStackParamList, Student } from '@/types';
import { textStyle } from '@/theme';
import { handleBottomNavPress } from '@/utils/navigationHelpers';
import { styles } from './AttendanceOverviewScreen.styles';
import type { AttendanceOverviewScreenProps } from './AttendanceOverviewScreen.types';

export function AttendanceOverviewScreen(_props: AttendanceOverviewScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [data, setData] = useState<Awaited<ReturnType<typeof mockApi.attendance.getOverview>> | null>(null);

  useEffect(() => {
    mockApi.attendance.getOverview().then(setData);
  }, []);

  return (
    <ScreenLayout
      scroll
      header={<AppHeader variant="back" title="Attendance Overview" chipLabel="Class 10-A" />}
      bottomNav={{
        activeTab: 'home',
        onTabPress: (tab) => handleBottomNavPress(navigation, tab),
      }}
    >
      <View style={styles.content}>
        <View style={styles.donutWrap}>
          <View style={styles.donutOuter}>
            <View style={styles.donutInner}>
              <Text style={[textStyle('statNumber'), styles.donutPct]}>{data?.overallPercent ?? 88}%</Text>
              <Text style={[textStyle('labelSm'), styles.donutLabel]}>Present rate</Text>
            </View>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthlyScroll}>
          {data?.monthly.map((m) => (
            <View key={m.month} style={styles.monthCard}>
              <Text style={[textStyle('cardTitle16'), styles.monthTitle]}>{m.month}</Text>
              <Text style={[textStyle('bodyMd'), styles.monthStat]}>
                {m.present}/{m.total} present
              </Text>
            </View>
          ))}
        </ScrollView>
        <AppButton
          label="Take Attendance"
          onPress={() => navigation.navigate('SwipeAttendance', { variant: 1 })}
          fullWidth
        />
        <FlatList
          data={data?.students ?? []}
          keyExtractor={(s: Student) => s.id}
          scrollEnabled={false}
          contentContainerStyle={styles.listGap}
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
