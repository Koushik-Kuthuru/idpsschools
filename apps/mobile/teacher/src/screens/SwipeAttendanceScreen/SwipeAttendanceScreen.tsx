import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { mockApi } from '@/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AppHeader,
  AppIcon,
  AppBottomNav,
  AttendanceCardStack,
  AttendanceStackActions,
  type AttendanceCardStackRef,
} from '@/components';
import { useAttendanceStore } from '@/store';
import type { RootStackParamList } from '@/types';
import { colors, textStyle } from '@/theme';
import { handleBottomNavPress } from '@/utils/navigationHelpers';
import { styles } from './SwipeAttendanceScreen.styles';
import type { SwipeAttendanceScreenProps } from './SwipeAttendanceScreen.types';

export function SwipeAttendanceScreen({ route }: SwipeAttendanceScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const classId = route.params?.classId;
  const { students, loadSession, setStatus, getSummary, isLoading } = useAttendanceStore();
  const stackRef = useRef<AttendanceCardStackRef>(null);
  const [stackIndex, setStackIndex] = useState(0);
  const [canUndo, setCanUndo] = useState(false);
  const [classChips, setClassChips] = useState(['Class 10-A', 'Mathematics', 'Today']);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (!classId) return;
    mockApi.faculty.getClasses().then((classes) => {
      const selected = classes.find((c) => c.id === classId);
      if (!selected) return;
      const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
      setClassChips([selected.name.replace('CLASS ', 'Class '), selected.subject, today]);
    });
  }, [classId]);

  const goToReview = () => navigation.navigate('AttendanceReview', { classId });

  const summary = getSummary();
  const remaining = Math.max(0, students.length - stackIndex);
  const allMarked = students.length > 0 && stackIndex >= students.length;
  const progressLabel =
    students.length > 0
      ? allMarked
        ? `${students.length} of ${students.length}`
        : `${stackIndex + 1} of ${students.length}`
      : '';

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <AppHeader
        variant="back"
        title="TAKE ATTENDANCE"
        rightAction={{
          label: 'Review',
          onPress: goToReview,
        }}
      />
      <ScrollView
        contentContainerStyle={[styles.scroll, allMarked && styles.scrollDone]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.chips}>
          {classChips.map((chip) => (
            <View key={chip} style={styles.chip}>
              <Text style={[textStyle('labelSm'), styles.chipText]}>{chip}</Text>
            </View>
          ))}
        </View>
        <View style={styles.content}>
          <View style={styles.summary}>
            <View style={styles.summaryCell}>
              <Text style={[textStyle('headlineSm'), styles.summaryValue, styles.presentValue]}>
                {summary.present}
              </Text>
              <Text style={[textStyle('labelSm'), styles.summaryLabel]}>Present</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCell}>
              <Text style={[textStyle('headlineSm'), styles.summaryValue, styles.absentValue]}>
                {summary.absent}
              </Text>
              <Text style={[textStyle('labelSm'), styles.summaryLabel]}>Absent</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCell}>
              <Text style={[textStyle('headlineSm'), styles.summaryValue, styles.lateValue]}>
                {summary.late}
              </Text>
              <Text style={[textStyle('labelSm'), styles.summaryLabel]}>Late</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCell}>
              <Text style={[textStyle('headlineSm'), styles.summaryValue]}>{remaining}</Text>
              <Text style={[textStyle('labelSm'), styles.summaryLabel]}>Left</Text>
            </View>
          </View>
          {!allMarked ? (
            <View style={styles.hint}>
              <AppIcon name="swipe" size={14} color={colors.outline} />
              <Text style={[textStyle('labelSm'), styles.hintText]}>
                Swipe Right for Present, Left for Absent
              </Text>
            </View>
          ) : null}
          {progressLabel ? (
            <Text style={[textStyle('labelLg'), styles.progress]}>{progressLabel}</Text>
          ) : null}
          {!isLoading && students.length > 0 ? (
            <>
              <AttendanceCardStack
                ref={stackRef}
                students={students}
                onMark={(id, status) => {
                  setStatus(id, status);
                  setCanUndo(true);
                }}
                onIndexChange={setStackIndex}
                onHistoryChange={(len) => setCanUndo(len > 0)}
              />
              {stackIndex < students.length ? (
                <AttendanceStackActions stackRef={stackRef} canUndo={canUndo} />
              ) : null}
            </>
          ) : null}
          <TouchableOpacity
            style={[styles.listBtn, allMarked && styles.listBtnDone]}
            onPress={goToReview}
          >
            <Text style={[textStyle('labelLg'), styles.listBtnText]}>Review & edit before submit →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={goToReview}
          activeOpacity={0.9}
        >
          <Text style={[textStyle('headlineSm'), styles.submitText]}>Submit Attendance</Text>
        </TouchableOpacity>
      </View>
      <AppBottomNav
        activeTab="attendance"
        onTabPress={(tab) => handleBottomNavPress(navigation, tab)}
      />
    </SafeAreaView>
  );
}
