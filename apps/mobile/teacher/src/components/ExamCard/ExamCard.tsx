import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { textStyle } from '@/theme';
import { styles } from './ExamCard.styles';
import type { ExamCardProps } from './ExamCard.types';

export function ExamCard({ subject, date, time, room, status, syllabusPercent = 0, onPress }: ExamCardProps) {
  const fillStyle = useMemo(
    () => StyleSheet.create({ fill: { width: `${Math.min(100, syllabusPercent)}%` } }).fill,
    [syllabusPercent],
  );

  const content = (
    <View style={styles.card}>
      <Text style={[textStyle('cardTitle16'), styles.subject]}>{subject}</Text>
      <Text style={[textStyle('bodyMd'), styles.meta]}>
        {date} · {time} · {room}
      </Text>
      <View style={styles.syllabusRow}>
        <View style={styles.syllabusBar}>
          <View style={[styles.syllabusFill, fillStyle]} />
        </View>
        <Text style={[textStyle('labelSm'), styles.syllabusText]}>{syllabusPercent}% syllabus</Text>
      </View>
      <View style={styles.statusChip}>
        <Text style={[textStyle('chip10'), styles.statusText]}>{status.toUpperCase()}</Text>
      </View>
    </View>
  );

  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.8}>{content}</TouchableOpacity>;
  return content;
}
