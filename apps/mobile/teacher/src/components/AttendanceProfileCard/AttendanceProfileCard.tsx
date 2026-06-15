import React from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { textStyle } from '@/theme';
import { styles } from './AttendanceProfileCard.styles';
import type { AttendanceProfileCardProps } from './AttendanceProfileCard.types';

export function AttendanceProfileCard({
  name,
  rollNo,
  className,
  avatarUrl,
  attendancePercent,
  status,
}: AttendanceProfileCardProps) {
  const cardStyle = [
    styles.card,
    status === 'present' && styles.cardPresent,
    status === 'absent' && styles.cardAbsent,
    status === 'late' && styles.cardLate,
  ];

  return (
    <View style={cardStyle}>
      <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" />
      <Text style={[textStyle('headlineLg'), styles.name]}>{name}</Text>
      <View style={styles.chips}>
        <View style={styles.rollChip}>
          <Text style={[textStyle('labelLg'), styles.rollText]}>Roll: {rollNo}</Text>
        </View>
        <Text style={[textStyle('labelLg'), styles.classText]}>Class {className}</Text>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={[textStyle('headlineSm'), styles.statValue]}>{attendancePercent}%</Text>
          <Text style={[textStyle('labelSm'), styles.statLabel]}>Attendance</Text>
        </View>
      </View>
    </View>
  );
}
