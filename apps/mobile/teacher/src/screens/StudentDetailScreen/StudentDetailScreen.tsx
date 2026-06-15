import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppHeader, ScreenLayout } from '@/components';
import { mockApi } from '@/services/api';
import type { RootStackParamList, Student } from '@/types';
import { colors, textStyle } from '@/theme';
import { styles } from './StudentDetailScreen.styles';
import type { StudentDetailScreenProps } from './StudentDetailScreen.types';

const TABS = ['Overview', 'Attendance', 'Marks'] as const;

export function StudentDetailScreen({ route }: StudentDetailScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [student, setStudent] = useState<Student | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>('Overview');

  useEffect(() => {
    mockApi.students.getById(route.params.studentId).then(setStudent);
  }, [route.params.studentId]);

  if (!student) return null;

  return (
    <ScreenLayout
      scroll
      header={<AppHeader variant="back" title="Student Detail" showBack onBackPress={() => navigation.goBack()} />}
    >
      <LinearGradient colors={[colors.primaryContainer, colors.heroGradientEnd]} style={styles.hero}>
        <Image source={{ uri: student.avatarUrl }} style={styles.avatar} contentFit="cover" />
        <Text style={[textStyle('headlineLg'), styles.heroName]}>{student.name}</Text>
        <Text style={[textStyle('bodyMd'), styles.heroMeta]}>
          Roll {student.rollNo} · {student.className}
        </Text>
      </LinearGradient>
      <View style={styles.content}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[textStyle('statNumber'), styles.statValue]}>{student.attendancePercent}%</Text>
            <Text style={[textStyle('labelSm'), styles.statLabel]}>Attendance</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[textStyle('statNumber'), styles.statValue]}>88</Text>
            <Text style={[textStyle('labelSm'), styles.statLabel]}>Avg Marks</Text>
          </View>
        </View>
        <View style={styles.tabs}>
          {TABS.map((t) => (
            <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
              <Text style={[textStyle('labelSm'), styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.panel}>
          {tab === 'Overview' ? (
            <ScrollView>
              <Text style={[textStyle('bodyMd'), styles.panelText]}>Parent: {student.parentName ?? '—'}</Text>
              <Text style={[textStyle('bodyMd'), styles.panelText]}>Phone: {student.parentPhone ?? '—'}</Text>
            </ScrollView>
          ) : (
            <Text style={[textStyle('bodyMd'), styles.panelText]}>{tab} data for {student.name}</Text>
          )}
        </View>
      </View>
    </ScreenLayout>
  );
}
