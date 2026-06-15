import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { AppIcon } from '../AppIcon';
import { colors, textStyle } from '@/theme';
import { styles } from './StudentCard.styles';
import type { StudentCardProps } from './StudentCard.types';

export function StudentCard({ name, rollNo, className, avatarUrl, attendancePercent, onPress }: StudentCardProps) {
  const content = (
    <View style={styles.card}>
      <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" />
      <View style={styles.info}>
        <Text style={[textStyle('studentName'), styles.name]}>{name}</Text>
        <Text style={[textStyle('bodyMd'), styles.meta]}>
          Roll {rollNo} · {className}
        </Text>
      </View>
      <View style={styles.percentWrap}>
        <Text style={[textStyle('statNumber'), styles.percent]}>{attendancePercent}%</Text>
        <Text style={[textStyle('chip10'), styles.percentLabel]}>ATTENDANCE</Text>
      </View>
      <AppIcon name="chevron_right" color={colors.outline} />
    </View>
  );

  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.8}>{content}</TouchableOpacity>;
  return content;
}
