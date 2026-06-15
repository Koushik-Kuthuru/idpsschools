import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { textStyle } from '@/theme';
import { styles } from './AssignmentCard.styles';
import type { AssignmentCardProps } from './AssignmentCard.types';

export function AssignmentCard({
  title,
  subject,
  dueDate,
  status,
  submissionsCount,
  totalStudents,
  onPress,
}: AssignmentCardProps) {
  const pct = totalStudents > 0 ? Math.round((submissionsCount / totalStudents) * 100) : 0;
  const fillStyle = useMemo(
    () => StyleSheet.create({ fill: { width: `${Math.min(100, pct)}%` } }).fill,
    [pct],
  );
  const isDraft = status === 'draft';

  const content = (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={[textStyle('cardTitle16'), styles.title]}>{title}</Text>
        <View style={[styles.badge, isDraft && styles.badgeDraft]}>
          <Text style={[textStyle('chip10'), styles.badgeText, isDraft && styles.badgeTextDraft]}>
            {status.toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={[textStyle('bodyMd'), styles.meta]}>
        {subject} · Due {dueDate}
      </Text>
      <View style={styles.progressRow}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, fillStyle]} />
        </View>
        <Text style={[textStyle('labelSm'), styles.progressText]}>
          {submissionsCount}/{totalStudents}
        </Text>
      </View>
    </View>
  );

  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.8}>{content}</TouchableOpacity>;
  return content;
}
