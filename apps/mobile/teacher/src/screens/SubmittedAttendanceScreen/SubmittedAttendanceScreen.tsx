import React, { useCallback, useState } from 'react';
import { View, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppHeader, ScreenLayout } from '@/components';
import { mockApi } from '@/services/api';
import type { AttendanceStatus, SubmittedClassAttendance } from '@/types';
import { colors, textStyle } from '@/theme';
import { styles } from './SubmittedAttendanceScreen.styles';
import type { SubmittedAttendanceScreenProps } from './SubmittedAttendanceScreen.types';

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'Present',
  absent: 'Absent',
  late: 'Late',
};

function statusStyle(status: AttendanceStatus) {
  if (status === 'present') return { badge: styles.badgePresent, text: styles.textPresent };
  if (status === 'absent') return { badge: styles.badgeAbsent, text: styles.textAbsent };
  return { badge: styles.badgeLate, text: styles.textLate };
}

export function SubmittedAttendanceScreen({ route }: SubmittedAttendanceScreenProps) {
  const { classId } = route.params;
  const [submission, setSubmission] = useState<SubmittedClassAttendance | null>(null);

  useFocusEffect(
    useCallback(() => {
      mockApi.attendance.getSubmitted(classId).then(setSubmission);
    }, [classId]),
  );

  const present = submission?.students.filter((s) => s.status === 'present').length ?? 0;
  const absent = submission?.students.filter((s) => s.status === 'absent').length ?? 0;
  const late = submission?.students.filter((s) => s.status === 'late').length ?? 0;

  return (
    <ScreenLayout
      scroll
      header={
        <AppHeader
          variant="back"
          title="SUBMITTED ATTENDANCE"
          chipLabel={submission ? `Class ${submission.className}` : undefined}
        />
      }
    >
      <View style={styles.content}>
        {submission ? (
          <>
            <Text style={[textStyle('labelSm'), styles.meta]}>
              {submission.subject} · {submission.submittedAt}
            </Text>
            <View style={styles.summary}>
              <View style={styles.summaryCell}>
                <Text style={[textStyle('headlineSm'), styles.summaryValue, { color: colors.primaryContainer }]}>
                  {present}
                </Text>
                <Text style={[textStyle('labelSm'), styles.summaryLabel]}>Present</Text>
              </View>
              <View style={[styles.summaryDivider, { height: 32 }]} />
              <View style={styles.summaryCell}>
                <Text style={[textStyle('headlineSm'), styles.summaryValue, { color: colors.absent }]}>{absent}</Text>
                <Text style={[textStyle('labelSm'), styles.summaryLabel]}>Absent</Text>
              </View>
              <View style={[styles.summaryDivider, { height: 32 }]} />
              <View style={styles.summaryCell}>
                <Text style={[textStyle('headlineSm'), styles.summaryValue, { color: colors.late }]}>{late}</Text>
                <Text style={[textStyle('labelSm'), styles.summaryLabel]}>Late</Text>
              </View>
            </View>
            <View style={styles.list}>
              {submission.students.map((student) => {
                const badge = statusStyle(student.status);
                return (
                  <View key={student.id} style={styles.row}>
                    <View style={styles.rowInfo}>
                      <Text style={[textStyle('labelLg'), styles.name]}>{student.name}</Text>
                      <Text style={[textStyle('labelSm'), styles.roll]}>Roll {student.rollNo}</Text>
                    </View>
                    <View style={[styles.badge, badge.badge]}>
                      <Text style={[textStyle('labelSm'), styles.badgeText, badge.text]}>
                        {STATUS_LABELS[student.status]}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        ) : (
          <Text style={[textStyle('bodyMd'), styles.empty]}>No submitted attendance found for this class.</Text>
        )}
      </View>
    </ScreenLayout>
  );
}
