import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader, AttendanceCard } from '@/components';
import { useAttendanceStore } from '@/store';
import { colors, textStyle } from '@/theme';
import { styles } from './AttendanceReviewScreen.styles';
import type { AttendanceReviewScreenProps } from './AttendanceReviewScreen.types';

export function AttendanceReviewScreen({ navigation, route }: AttendanceReviewScreenProps) {
  const classId = route.params?.classId;
  const { students, setStatus, submit, getSummary } = useAttendanceStore();
  const [submitting, setSubmitting] = useState(false);
  const summary = getSummary();

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await submit(classId);
      const className = students[0]?.className ?? '10-A';
      navigation.navigate('AttendanceSuccess', {
        classId,
        className,
        present: summary.present,
        absent: summary.absent,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <AppHeader variant="back" title="REVIEW ATTENDANCE" chipLabel="Edit before submit" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.banner}>
          <Text style={[textStyle('bodyMd'), styles.bannerText]}>
            Tap P / A / L on each student to change status before submitting.
          </Text>
        </View>
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={[textStyle('headlineSm'), { color: colors.primaryContainer }]}>
              {summary.present}
            </Text>
            <Text style={[textStyle('labelSm'), { color: colors.outline }]}>Present</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[textStyle('headlineSm'), { color: colors.absent }]}>{summary.absent}</Text>
            <Text style={[textStyle('labelSm'), { color: colors.outline }]}>Absent</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[textStyle('headlineSm'), { color: colors.late }]}>{summary.late}</Text>
            <Text style={[textStyle('labelSm'), { color: colors.outline }]}>Late</Text>
          </View>
        </View>
        <View style={styles.list}>
          {students.map((s) => (
            <AttendanceCard
              key={s.id}
              name={s.name}
              rollNo={s.rollNo}
              className={s.className}
              avatarUrl={s.avatarUrl}
              status={s.status}
              onStatusChange={(status) => setStatus(s.id, status)}
            />
          ))}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={[textStyle('labelLg'), styles.backText]}>← Back to swipe list</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={handleConfirm}
          disabled={submitting}
          activeOpacity={0.9}
        >
          <Text style={[textStyle('headlineSm'), styles.confirmText]}>
            {submitting ? 'Submitting…' : 'Confirm & Submit'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
