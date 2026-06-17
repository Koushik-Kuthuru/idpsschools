import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { styles } from './AttendanceProfileCard.styles';
import type { AttendanceProfileCardProps } from './AttendanceProfileCard.types';

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function AttendanceProfileCard({
  name,
  rollNo,
  className,
  avatarUrl,
  attendancePercent,
  status,
}: AttendanceProfileCardProps) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const showPhoto = Boolean(avatarUrl) && !avatarFailed;
  const initials = getInitials(name);

  const cardStyle = [
    styles.card,
    status === 'present' && styles.cardPresent,
    status === 'absent' && styles.cardAbsent,
    status === 'late' && styles.cardLate,
  ];

  return (
    <View style={cardStyle}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.schoolName}>IDPS Kalaburagi</Text>
          <Text style={styles.schoolTag}>International Delhi Public School</Text>
        </View>
        <View style={styles.idBadge}>
          <Text style={styles.idBadgeText}>STUDENT ID</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.photoFrame}>
          {showPhoto ? (
            <Image
              source={{ uri: avatarUrl }}
              style={styles.photo}
              contentFit="cover"
              onError={() => setAvatarFailed(true)}
            />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoInitials}>{initials}</Text>
            </View>
          )}
        </View>

        <View style={styles.details}>
          <Text style={styles.studentName} numberOfLines={2}>{name}</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Roll No</Text>
            <Text style={styles.detailValue}>{rollNo}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Class</Text>
            <Text style={styles.detailValue}>{className}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Attendance</Text>
            <Text style={[styles.detailValue, styles.attendanceValue]}>{attendancePercent}%</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerAccent} />
        <Text style={styles.footerText}>Official student identification</Text>
      </View>
    </View>
  );
}
