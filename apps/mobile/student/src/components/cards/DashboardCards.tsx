import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { cardShadow } from '@/constants/shadows';
import { appNavigate } from '@/utils/navigation';
import type { Announcement } from '@/types';

interface DashboardHeaderProps {
  studentName: string;
  className?: string;
  admissionNumber?: string;
  avatar?: string;
  notificationCount?: number;
  onProfilePress?: () => void;
  onIdCardPress?: () => void;
  onHomeworksPress?: () => void;
}

export function DashboardHeader({
  studentName,
  className,
  admissionNumber,
  avatar,
  notificationCount = 0,
  onProfilePress,
  onIdCardPress,
  onHomeworksPress,
}: DashboardHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient colors={['#144835', '#1a5a40', '#0d2e22']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <View style={[styles.hero, { paddingTop: insets.top + 16 }]}>
        <View style={styles.heroTop}>
          <TouchableOpacity
            style={styles.heroLeft}
            onPress={onProfilePress}
            activeOpacity={0.85}
            disabled={!onProfilePress}
          >
            <View style={styles.avatarWrap}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <MaterialIcons name="person" size={24} color="#144835" />
                </View>
              )}
            </View>
            <View style={styles.greeting}>
              <Text style={styles.welcomeBack}>Welcome back</Text>
              <Text style={styles.name} numberOfLines={1}>
                {studentName}
              </Text>
              {className ? (
                <Text style={styles.classLine} numberOfLines={1}>
                  {className}
                </Text>
              ) : null}
              {admissionNumber ? (
                <Text style={styles.admissionLine} numberOfLines={1}>
                  Adm. No. {admissionNumber}
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => appNavigate('/notifications')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Open notifications"
          >
            <MaterialIcons name="notifications-none" size={22} color="#fff" />
            {notificationCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notificationCount > 9 ? '9+' : notificationCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        <View style={styles.heroActions}>
          <TouchableOpacity
            style={styles.heroActionBtn}
            onPress={onIdCardPress}
            activeOpacity={0.85}
            disabled={!onIdCardPress}
          >
            <View style={styles.heroActionIcon}>
              <MaterialIcons name="badge" size={18} color="#a2c144" />
            </View>
            <Text style={styles.heroActionText}>ID Card</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.heroActionBtn}
            onPress={onHomeworksPress}
            activeOpacity={0.85}
            disabled={!onHomeworksPress}
          >
            <View style={styles.heroActionIcon}>
              <MaterialIcons name="assignment" size={18} color="#a2c144" />
            </View>
            <Text style={styles.heroActionText}>Projects</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={[styles.heroCurve, { backgroundColor: theme.colors.background }]} />
    </LinearGradient>
  );
}

interface OverviewCardProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  iconBg: string;
  accentColor: string;
  title: string;
  subtitle: string;
  badge?: string;
  onPress?: () => void;
}

export function OverviewCard({
  icon,
  iconColor,
  iconBg,
  accentColor,
  title,
  subtitle,
  badge,
  onPress,
}: OverviewCardProps) {
  const theme = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.card,
        cardShadow,
        { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
      ]}
    >
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <MaterialIcons name={icon} size={22} color={iconColor} />
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardTitleRow}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{title}</Text>
          {badge ? (
            <View style={[styles.activeBadge, { backgroundColor: `${accentColor}18` }]}>
              <Text style={[styles.activeBadgeText, { color: accentColor }]}>{badge}</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
      {onPress ? <MaterialIcons name="chevron-right" size={20} color={theme.colors.textMuted} /> : null}
    </TouchableOpacity>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  accent: string;
  children?: React.ReactNode;
  onPress?: () => void;
}

export function StatCard({ label, value, subValue, icon, accent, children, onPress }: StatCardProps) {
  const theme = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={!onPress}
      style={[styles.statCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
    >
      <View style={[styles.statIconWrap, { backgroundColor: `${accent}14` }]}>
        <MaterialIcons name={icon} size={18} color={accent} />
      </View>
      <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
      <View style={styles.statValueRow}>
        <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
        {subValue ? <Text style={[styles.statSub, { color: theme.colors.textMuted }]}>{subValue}</Text> : null}
      </View>
      {children}
    </TouchableOpacity>
  );
}

interface AnnouncementCardProps {
  item: Announcement;
  onPress?: () => void;
}

export function AnnouncementCard({ item, onPress }: AnnouncementCardProps) {
  const theme = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={!onPress}
      style={[styles.announcement, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
    >
      <View style={[styles.announcementIcon, { backgroundColor: item.isNew ? `${theme.colors.primary}12` : theme.colors.slate100 }]}>
        <MaterialIcons
          name="campaign"
          size={18}
          color={item.isNew ? theme.colors.primary : theme.colors.textMuted}
        />
      </View>
      <View style={styles.announcementContent}>
        <View style={styles.announcementTitleRow}>
          <Text style={[styles.announcementTitle, { color: theme.colors.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          {item.isNew ? <View style={[styles.newPill, { backgroundColor: theme.colors.primary }]} /> : null}
        </View>
        <Text style={[styles.announcementDesc, { color: theme.colors.textSecondary }]} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={[styles.announcementTime, { color: theme.colors.textMuted }]}>{item.timeAgo}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 20, paddingBottom: 32 },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  heroLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  avatar: { width: '100%', height: '100%' },
  avatarFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  greeting: { marginLeft: 12, flex: 1 },
  welcomeBack: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.65)' },
  name: { fontSize: 20, fontWeight: '700', color: '#fff', marginTop: 2 },
  classLine: { fontSize: 13, fontWeight: '600', color: '#a2c144', marginTop: 4 },
  admissionLine: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#144835',
  },
  badgeText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  heroActions: { flexDirection: 'row', gap: 10, marginTop: 14, marginBottom: 12 },
  heroActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  heroActionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(162, 193, 68, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroActionText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  heroCurve: {
    height: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  accentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  cardContent: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700', flex: 1 },
  cardSubtitle: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  activeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  activeBadgeText: { fontSize: 10, fontWeight: '700' },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 120,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  statValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 4 },
  statValue: { fontSize: 22, fontWeight: '700' },
  statSub: { fontSize: 13, fontWeight: '500' },
  announcement: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
    alignItems: 'flex-start',
  },
  announcementIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  announcementContent: { flex: 1 },
  announcementTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  announcementTitle: { fontSize: 14, fontWeight: '700', flex: 1 },
  newPill: { width: 8, height: 8, borderRadius: 4 },
  announcementDesc: { fontSize: 12, marginTop: 4, lineHeight: 17 },
  announcementTime: { fontSize: 10, marginTop: 8, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
});
