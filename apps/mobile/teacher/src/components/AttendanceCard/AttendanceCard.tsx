import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { textStyle } from '@/theme';
import { styles } from './AttendanceCard.styles';
import type { AttendanceCardProps } from './AttendanceCard.types';
import type { AttendanceStatus } from '@/types';

export function AttendanceCard({ name, rollNo, className, status, onStatusChange }: AttendanceCardProps) {
  const statuses: AttendanceStatus[] = ['present', 'absent', 'late'];
  const labels = { present: 'P', absent: 'A', late: 'L' };
  const activeStyles = {
    present: styles.segPresent,
    absent: styles.segAbsent,
    late: styles.segLate,
  };

  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={[textStyle('studentName'), styles.name]}>{name}</Text>
        <View style={styles.meta}>
          <View style={styles.rollChip}>
            <Text style={[textStyle('chip10'), styles.rollText]}>Roll: {rollNo}</Text>
          </View>
          <Text style={[textStyle('chip10'), styles.classText]}>{className}</Text>
        </View>
      </View>
      <View style={styles.segment}>
        {statuses.map((s) => {
          const active = status === s;
          return (
            <TouchableOpacity
              key={s}
              style={[styles.segBtn, active && activeStyles[s]]}
              onPress={() => onStatusChange(s)}
              activeOpacity={0.7}
            >
              <Text style={[styles.segBtnText, active && styles.segBtnTextActive]}>{labels[s]}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
