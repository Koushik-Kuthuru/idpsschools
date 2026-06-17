import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { mockApi } from '@/services/api';
import {
  AppIcon,
  DashboardTopBar,
  AttendanceCardStack,
  AttendanceStackActions,
  type AttendanceCardStackRef,
} from '@/components';
import { useAttendanceStore, useAuthStore } from '@/store';
import type { RootStackParamList } from '@/types';
import { colors } from '@/theme';
import { styles } from './SwipeAttendanceScreen.styles';
import type { SwipeAttendanceScreenProps } from './SwipeAttendanceScreen.types';

function formatClassLabel(name: string) {
  return name.replace(/^CLASS\s/i, 'Class ');
}

export function SwipeAttendanceScreen({ route }: SwipeAttendanceScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const classId = route.params?.classId;
  const teacher = useAuthStore((s) => s.user);
  const { students, loadSession, setStatus, getSummary, isLoading } = useAttendanceStore();
  const stackRef = useRef<AttendanceCardStackRef>(null);
  const [stackIndex, setStackIndex] = useState(0);
  const [canUndo, setCanUndo] = useState(false);
  const [classLabel, setClassLabel] = useState('Class');
  const [subjectLabel, setSubjectLabel] = useState('Subject');
  const [periodLabel, setPeriodLabel] = useState('');

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (!classId) return;
    mockApi.faculty.getClasses().then((classes) => {
      const selected = classes.find((c) => c.id === classId);
      if (!selected) return;
      setClassLabel(formatClassLabel(selected.name));
      setSubjectLabel(selected.subject);
      setPeriodLabel(selected.period);
    });
  }, [classId]);

  const goToReview = () => navigation.navigate('AttendanceReview', { classId });

  const summary = getSummary();
  const remaining = Math.max(0, students.length - stackIndex);
  const allMarked = students.length > 0 && stackIndex >= students.length;
  const progress = students.length > 0 ? Math.min(stackIndex / students.length, 1) : 0;
  const displayName = teacher?.name ?? 'Staff';

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <DashboardTopBar
        title="Take Attendance"
        name={displayName}
        showBack
        showNotifications={false}
        showProfile={false}
        headerAction={{ label: 'Review', onPress: goToReview }}
      />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryBand}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryChip}>
              <AppIcon name="groups" size={14} color={colors.primary} />
              <Text style={styles.summaryChipText} numberOfLines={1}>
                {classLabel}
              </Text>
            </View>
            <View style={styles.summaryChip}>
              <AppIcon name="menu_book" size={14} color={colors.primary} />
              <Text style={styles.summaryChipText} numberOfLines={1}>
                {subjectLabel}
              </Text>
            </View>
            {periodLabel ? (
              <View style={styles.summaryChip}>
                <AppIcon name="schedule" size={14} color={colors.primary} />
                <Text style={styles.summaryChipText} numberOfLines={1}>
                  {periodLabel}
                </Text>
              </View>
            ) : null}
          </View>

          {students.length > 0 ? (
            <View style={styles.progressBlock}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>
                  {allMarked ? 'All students marked' : `Student ${Math.min(stackIndex + 1, students.length)} of ${students.length}`}
                </Text>
                <Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.content}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, styles.presentValue]}>{summary.present}</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, styles.absentValue]}>{summary.absent}</Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, styles.lateValue]}>{summary.late}</Text>
              <Text style={styles.statLabel}>Late</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{remaining}</Text>
              <Text style={styles.statLabel}>Left</Text>
            </View>
          </View>

          {!allMarked ? (
            <View style={styles.hintCard}>
              <AppIcon name="swipe" size={18} color={colors.primary} />
              <View style={styles.hintTextBlock}>
                <Text style={styles.hintTitle}>Swipe to mark</Text>
                <Text style={styles.hintText}>Right = Present · Left = Absent · Up = Late</Text>
              </View>
            </View>
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

          <TouchableOpacity style={styles.reviewLink} onPress={goToReview} activeOpacity={0.8}>
            <Text style={styles.reviewLinkText}>Review & edit before submit</Text>
            <AppIcon name="chevron_right" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity style={styles.submitBtn} onPress={goToReview} activeOpacity={0.9}>
          <Text style={styles.submitText}>Submit Attendance</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
