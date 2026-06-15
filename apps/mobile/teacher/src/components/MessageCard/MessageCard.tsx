import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { textStyle } from '@/theme';
import { styles } from './MessageCard.styles';
import type { MessageCardProps } from './MessageCard.types';

export function MessageCard({ name, role, lastMessage, timestamp, avatarUrl, unread, onPress }: MessageCardProps) {
  const content = (
    <View style={styles.card}>
      <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[textStyle('cardTitle16'), styles.name]}>{name}</Text>
          <Text style={[textStyle('timestamp11'), styles.time]}>{timestamp}</Text>
        </View>
        <Text style={[textStyle('labelSm'), styles.role]}>{role}</Text>
        <Text style={[textStyle('bodyMd'), styles.preview]} numberOfLines={1}>
          {lastMessage}
        </Text>
      </View>
      {unread > 0 ? (
        <View style={styles.badge}>
          <Text style={[textStyle('chip10'), styles.badgeText]}>{unread}</Text>
        </View>
      ) : null}
    </View>
  );

  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.8}>{content}</TouchableOpacity>;
  return content;
}
