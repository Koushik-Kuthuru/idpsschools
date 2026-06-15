import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import type { Announcement } from '@/types';

interface DashboardHeaderProps {
  studentName: string;
  avatar?: string;
  notificationCount?: number;
}

export function DashboardHeader({ studentName, avatar, notificationCount = 0 }: DashboardHeaderProps) {
  const theme = useTheme();
  const router = useRouter();
  const greeting = getGreeting();

  return (
    <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
      <View style={styles.left}>
        <View style={[styles.avatarWrap, { borderColor: `${theme.colors.primary}33` }]}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <MaterialIcons name="person" size={24} color={theme.colors.primary} />
          )}
        </View>
        <View style={styles.greeting}>
          <Text style={[styles.welcome, { color: theme.colors.textSecondary }]}>Welcome back,</Text>
          <Text style={[styles.name, { color: theme.colors.text }]}>
            {greeting}, {studentName}!
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.notifBtn}
        onPress={() => router.push('/notifications' as '/assignments')}
      >
        <MaterialIcons name="notifications" size={24} color={theme.colors.textSecondary} />
        {notificationCount > 0 && <View style={styles.badge} />}
      </TouchableOpacity>
    </View>
  );
}

interface OverviewCardProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  badge?: string;
  onPress?: () => void;
}

export function OverviewCard({ icon, iconColor, iconBg, title, subtitle, badge, onPress }: OverviewCardProps) {
  const theme = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
    >
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <MaterialIcons name={icon} size={28} color={iconColor} />
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardTitleRow}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{title}</Text>
          {badge && (
            <View style={[styles.activeBadge, { backgroundColor: `${theme.colors.primary}33` }]}>
              <Text style={[styles.activeBadgeText, { color: theme.colors.primary }]}>{badge}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>
      </View>
      {onPress && <MaterialIcons name="chevron-right" size={24} color={theme.colors.textMuted} />}
    </TouchableOpacity>
  );
}

interface AnnouncementCardProps {
  item: Announcement;
}

export function AnnouncementCard({ item }: AnnouncementCardProps) {
  const theme = useTheme();

  return (
    <View style={[styles.announcement, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View
        style={[
          styles.dot,
          { backgroundColor: item.isNew ? theme.colors.primary : theme.colors.slate300 },
        ]}
      />
      <View style={styles.announcementContent}>
        <Text style={[styles.announcementTitle, { color: theme.colors.text }]}>{item.title}</Text>
        <Text style={[styles.announcementDesc, { color: theme.colors.textSecondary }]}>{item.description}</Text>
        <Text style={[styles.announcementTime, { color: theme.colors.textMuted }]}>{item.timeAgo}</Text>
      </View>
    </View>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { width: '100%', height: '100%' },
  greeting: { marginLeft: 12, flex: 1 },
  welcome: { fontSize: 12, fontWeight: '500' },
  name: { fontSize: 16, fontWeight: '700' },
  notifBtn: { padding: 8, position: 'relative' },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
    marginBottom: 12,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardSubtitle: { fontSize: 14, marginTop: 2 },
  activeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  activeBadgeText: { fontSize: 10, fontWeight: '600' },
  announcement: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  announcementContent: { flex: 1 },
  announcementTitle: { fontSize: 14, fontWeight: '600' },
  announcementDesc: { fontSize: 12, marginTop: 4, lineHeight: 18 },
  announcementTime: { fontSize: 10, marginTop: 8, textTransform: 'uppercase', fontWeight: '500' },
});
