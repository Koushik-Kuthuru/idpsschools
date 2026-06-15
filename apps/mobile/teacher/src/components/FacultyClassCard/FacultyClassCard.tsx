import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AppIcon } from '../AppIcon';
import { colors, textStyle } from '@/theme';
import { styles } from './FacultyClassCard.styles';

interface FacultyClassCardProps {
  title: string;
  lines: string[];
  statusLabel: string;
  statusDone?: boolean;
  actionLabel: string;
  onPress: () => void;
}

export function FacultyClassCard({
  title,
  lines,
  statusLabel,
  statusDone,
  actionLabel,
  onPress,
}: FacultyClassCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <AppIcon name="menu_book" size={22} color={colors.primaryContainer} />
        <Text style={[textStyle('headlineSm'), styles.title]}>{title}</Text>
      </View>
      {lines.map((line) => (
        <Text key={line} style={[textStyle('bodyMd'), styles.line]}>
          {line}
        </Text>
      ))}
      <Text
        style={[
          textStyle('labelSm'),
          styles.status,
          statusDone ? styles.statusDone : styles.statusPending,
        ]}
      >
        Status: {statusLabel}
      </Text>
      <TouchableOpacity style={styles.action} onPress={onPress} activeOpacity={0.85}>
        <Text style={[textStyle('labelLg'), styles.actionText]}>{actionLabel}</Text>
        <AppIcon name="chevron_right" size={20} color={colors.primaryContainer} />
      </TouchableOpacity>
    </View>
  );
}
