import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { VicePrincipalHeader } from '../components/VicePrincipalHeader';
import { ScreenShell } from '../components/ScreenShell';
import {
  dashboardStats as initialDashboardStats,
  initialPriorityActions,
  initialRecentActivity,
  initialTodayOverview,
  vpProfile,
  type PriorityAction,
  type PriorityActionRoute,
  type RecentActivityItem,
  type TodayOverviewItem,
  type TodayOverviewRoute,
} from '../data/mockData';
import { getVpUnreadCount, useVpNotificationsStore } from '../store/vpNotificationsStore';
import { handleVpTabPress } from '../navigation/navigationHelpers';
import type { VicePrincipalStackParamList } from '../navigation/types';
import { SCHOOL_NAME } from '@/constants/school';
import { useAuthStore } from '@/store';
import { formatLongDate } from '@/utils/datetime';
import { getGreeting } from '@/utils/greeting';
import { spacing, textStyle, useThemedStyles, useVicePrincipalTheme } from '../theme';
import type { VicePrincipalColorScheme } from '../theme/colors';

type DashboardStat = (typeof initialDashboardStats)[number] & { value: string };

function cloneStats(): DashboardStat[] {
  return initialDashboardStats.map((s) => ({ ...s }));
}

function navigateForAction(
  navigation: NativeStackNavigationProp<VicePrincipalStackParamList>,
  route: PriorityActionRoute | TodayOverviewRoute,
) {
  if (route === 'TimetableSubstitution') {
    navigation.navigate('MainTabs', { screen: 'TimetableSubstitution' });
    return;
  }
  navigation.navigate(route);
}

function decrementStat(stats: DashboardStat[], label: string): DashboardStat[] {
  return stats.map((s) => {
    if (s.label !== label) return s;
    const num = parseInt(s.value, 10);
    if (Number.isNaN(num)) return s;
    return { ...s, value: String(Math.max(0, num - 1)) };
  });
}

function ActivityDot({ color }: { color: string }) {
  return (
    <View style={[activityDotStyles.ring, { backgroundColor: `${color}1a` }]}>
      <View style={[activityDotStyles.dot, { backgroundColor: color }]} />
    </View>
  );
}

const activityDotStyles = StyleSheet.create({
  ring: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
});

export function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<VicePrincipalStackParamList>>();
  const { colors } = useVicePrincipalTheme();
  const styles = useThemedStyles(createStyles);
  const user = useAuthStore((s) => s.user);
  const notificationItems = useVpNotificationsStore((s) => s.items);
  const unreadCount = getVpUnreadCount(notificationItems);

  const [dateLine, setDateLine] = useState(() => formatLongDate());
  const [stats, setStats] = useState<DashboardStat[]>(cloneStats);
  const [actions, setActions] = useState<PriorityAction[]>(initialPriorityActions);
  const [overview] = useState<TodayOverviewItem[]>(initialTodayOverview);
  const [activity] = useState<RecentActivityItem[]>(initialRecentActivity);

  const displayName = user?.name ?? vpProfile.name;
  const greetingPrefix = getGreeting();

  useFocusEffect(
    useCallback(() => {
      setDateLine(formatLongDate());
    }, []),
  );

  const dismissAction = (id: string, route: PriorityActionRoute) => {
    setActions((prev) => prev.filter((a) => a.id !== id));
    if (route === 'LeaveApprovals') {
      setStats((prev) => decrementStat(prev, 'Leaves'));
    }
    if (route === 'TimetableSubstitution') {
      setStats((prev) => decrementStat(prev, 'Issues'));
    }
  };

  const handlePriorityAction = (action: PriorityAction) => {
    dismissAction(action.id, action.route);
    navigateForAction(navigation, action.route);
  };

  const handleViewAllActions = () => {
    if (actions.length === 0) return;
    navigateForAction(navigation, actions[0].route);
  };

  const handleOverviewPress = (item: TodayOverviewItem) => {
    navigateForAction(navigation, item.route);
  };

  const getOverviewIconColor = (colorKey: TodayOverviewItem['colorKey']) => {
    if (colorKey === 'primaryContainer') return colors.onPrimaryContainer;
    if (colorKey === 'tertiary') return colors.tertiary;
    if (colorKey === 'secondary') return colors.secondary;
    return colors.primary;
  };

  const getOverviewIconBg = (colorKey: TodayOverviewItem['colorKey']) => {
    if (colorKey === 'primaryContainer') return `${colors.primaryContainer}33`;
    if (colorKey === 'tertiary') return `${colors.tertiary}1a`;
    if (colorKey === 'secondary') return `${colors.secondary}1a`;
    return `${colors.primary}1a`;
  };

  const getActivityDotColor = (dot: RecentActivityItem['dot']) => {
    if (dot === 'amber') return colors.amber500;
    if (dot === 'blue') return colors.blue500;
    return colors.primary;
  };

  return (
    <ScreenShell
      activeTab="home"
      onTabPress={(t) => handleVpTabPress(navigation, t)}
      paddingBottom={100}
      header={
        <VicePrincipalHeader
          title={SCHOOL_NAME}
          identity={{
            orgTitle: SCHOOL_NAME,
            orgSubtitle: 'Vice Principal',
            notificationCount: unreadCount > 0 ? unreadCount : undefined,
            onNotifications: () => navigation.navigate('Notifications'),
          }}
        />
      }
      fab={
        <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={() => navigation.navigate('Notifications')}>
          <MaterialIcons name="add" size={28} color={colors.onPrimaryContainer} />
        </TouchableOpacity>
      }
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[colors.primaryContainer, colors.gradientEnd]} style={styles.greeting}>
          <View style={styles.datePill}>
            <MaterialIcons name="calendar-today" size={14} color={colors.onPrimary} />
            <Text style={styles.dateText}>{dateLine}</Text>
          </View>
          <Text style={styles.greetLine}>{greetingPrefix},</Text>
          <Text style={styles.greetName}>{displayName}</Text>
          <Text style={styles.greetRole}>Vice Principal</Text>
          <MaterialIcons name="domain" size={120} color="rgba(255,255,255,0.1)" style={styles.greetIcon} />
        </LinearGradient>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
          {stats.map((s) => {
            const iconColor =
              s.colorKey === 'error'
                ? colors.onErrorContainer
                : s.colorKey === 'secondary'
                  ? colors.secondary
                  : s.colorKey === 'tertiary'
                    ? colors.tertiary
                    : colors.primary;
            const bgColor =
              s.colorKey === 'error'
                ? colors.errorContainer
                : s.colorKey === 'secondary'
                  ? `${colors.secondary}22`
                  : s.colorKey === 'tertiary'
                    ? `${colors.tertiary}22`
                    : `${colors.primary}22`;
            return (
              <View key={s.label} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: bgColor }]}>
                  <MaterialIcons name={s.icon} size={22} color={iconColor} />
                </View>
                <View>
                  <Text style={styles.statLbl}>{s.label}</Text>
                  <Text style={[styles.statVal, { color: iconColor }]}>{s.value}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitleInline}>Priority Actions</Text>
          {actions.length > 0 ? (
            <TouchableOpacity onPress={handleViewAllActions} activeOpacity={0.7}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {actions.length === 0 ? (
          <Text style={styles.emptyHint}>No priority actions — you're all caught up.</Text>
        ) : (
          actions.map((a) => (
            <View key={a.id} style={styles.actionCard}>
              <View style={[styles.actionAccent, { backgroundColor: a.accent }]} />
              <View style={styles.actionBody}>
                <View style={styles.actionLeft}>
                  <View style={[styles.actionIcon, { backgroundColor: a.iconBg }]}>
                    <MaterialIcons name={a.icon} size={22} color={a.iconColor} />
                  </View>
                  <View style={styles.actionTextWrap}>
                    <Text style={styles.actionTitle}>{a.title}</Text>
                    <Text style={styles.actionSub}>{a.subtitle}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.actionBtn, a.ctaFilled ? styles.actionBtnFilled : styles.actionBtnOutline]}
                  onPress={() => handlePriorityAction(a)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.actionBtnText, a.ctaFilled ? styles.actionBtnTextFilled : styles.actionBtnTextOutline]}>
                    {a.cta}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>Today's Overview</Text>
        <View style={styles.overviewGrid}>
          {overview.map((o) => (
            <TouchableOpacity
              key={o.label}
              style={styles.overviewCard}
              onPress={() => handleOverviewPress(o)}
              activeOpacity={0.7}
            >
              <View style={styles.overviewTop}>
                <View style={[styles.overviewIcon, { backgroundColor: getOverviewIconBg(o.colorKey) }]}>
                  <MaterialIcons name={o.icon} size={20} color={getOverviewIconColor(o.colorKey)} />
                </View>
                {o.trend ? (
                  <View style={styles.trendRow}>
                    <Text style={[styles.trend, { color: o.trendUp ? colors.primary : colors.tertiary }]}>{o.trend}</Text>
                    <MaterialIcons
                      name={o.trendUp ? 'trending-up' : 'trending-down'}
                      size={12}
                      color={o.trendUp ? colors.primary : colors.tertiary}
                    />
                  </View>
                ) : (
                  <View />
                )}
              </View>
              <Text style={styles.overviewLbl}>{o.label.toUpperCase()}</Text>
              <Text style={styles.overviewVal}>{o.value}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityCard}>
          {activity.map((a, i) => (
            <View key={a.id} style={[styles.activityRow, i < activity.length - 1 && styles.activityBorder]}>
              <ActivityDot color={getActivityDotColor(a.dot)} />
              <View style={styles.activityBody}>
                <Text style={styles.activityText}>{a.text}</Text>
                <Text style={styles.activityMeta}>
                  {a.time} • {a.source}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenShell>
  );
}

function createStyles(colors: VicePrincipalColorScheme) {
  return StyleSheet.create({
    content: { paddingBottom: 24 },
    greeting: { marginHorizontal: spacing.gutter, marginTop: spacing.lg, borderRadius: 16, padding: spacing.lg, overflow: 'hidden' },
    datePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 999,
      alignSelf: 'flex-start',
      marginBottom: 12,
    },
    dateText: { ...textStyle('labelMd'), color: colors.onPrimary },
    greetLine: { ...textStyle('headlineLgMobile'), color: colors.onPrimary },
    greetName: { ...textStyle('headlineMd'), color: colors.onPrimary, opacity: 0.95 },
    greetRole: { ...textStyle('bodyMd'), color: colors.onPrimary, opacity: 0.8, marginTop: 4 },
    greetIcon: { position: 'absolute', right: -16, bottom: -16 },
    statsRow: { gap: 12, paddingHorizontal: spacing.gutter, paddingTop: spacing.lg, paddingBottom: 4 },
    statCard: {
      minWidth: 160,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      backgroundColor: colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderRadius: 12,
      padding: spacing.md,
    },
    statIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    statLbl: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
    statVal: { ...textStyle('titleLg'), fontWeight: '700' },
    sectionHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.gutter,
      marginTop: spacing.lg,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      ...textStyle('headlineMd'),
      color: colors.onSurface,
      paddingHorizontal: spacing.gutter,
      marginBottom: spacing.md,
    },
    sectionTitleInline: { ...textStyle('headlineMd'), color: colors.onSurface },
    viewAll: { ...textStyle('labelMd'), color: colors.primary, fontWeight: '600' },
    emptyHint: {
      ...textStyle('bodyMd'),
      color: colors.onSurfaceVariant,
      paddingHorizontal: spacing.gutter,
      marginBottom: spacing.md,
    },
    actionCard: {
      marginHorizontal: spacing.gutter,
      marginBottom: spacing.md,
      backgroundColor: colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderRadius: 12,
      overflow: 'hidden',
    },
    actionAccent: { height: 6, width: '100%' },
    actionBody: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, gap: 8 },
    actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    actionTextWrap: { flex: 1 },
    actionIcon: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    actionTitle: { ...textStyle('bodyLg'), fontWeight: '700', color: colors.onSurface },
    actionSub: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant },
    actionBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
    actionBtnFilled: { backgroundColor: colors.primary },
    actionBtnOutline: { borderWidth: 1, borderColor: colors.primary },
    actionBtnText: { ...textStyle('labelMd'), fontWeight: '700' },
    actionBtnTextFilled: { color: colors.onPrimary },
    actionBtnTextOutline: { color: colors.primary },
    overviewGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
      paddingHorizontal: spacing.gutter,
      marginBottom: spacing.sm,
    },
    overviewCard: {
      width: '47.5%',
      backgroundColor: colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderRadius: 12,
      padding: spacing.md,
    },
    overviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, minHeight: 40 },
    overviewIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    trendRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    trend: { fontSize: 12, fontWeight: '700' },
    overviewLbl: { ...textStyle('labelMd'), color: colors.onSurfaceVariant, letterSpacing: 1 },
    overviewVal: { ...textStyle('headlineMd'), fontWeight: '700', marginTop: 4, color: colors.onSurface },
    activityCard: {
      marginHorizontal: spacing.gutter,
      marginBottom: spacing.lg,
      backgroundColor: colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderRadius: 12,
      overflow: 'hidden',
    },
    activityRow: { flexDirection: 'row', gap: 16, padding: spacing.md, alignItems: 'flex-start' },
    activityBorder: { borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },
    activityBody: { flex: 1 },
    activityText: { ...textStyle('bodyMd'), fontWeight: '500', color: colors.onSurface },
    activityMeta: { ...textStyle('labelMd'), color: colors.onSurfaceVariant, marginTop: 2, fontSize: 12 },
    fab: {
      position: 'absolute',
      right: spacing.gutter,
      bottom: spacing.fabBottom,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 6,
    },
  });
}
