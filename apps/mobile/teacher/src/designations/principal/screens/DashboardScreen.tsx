import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PrincipalHeader } from '../components/PrincipalHeader';
import { ScreenShell } from '../components/ScreenShell';
import { Card } from '../components/ui';
import {
  initialAgendaItems,
  initialDashboardStats,
  initialLatestPosts,
  initialPriorityApprovals,
  principalProfile,
  quickModules,
  type DashboardStat,
  type LatestPost,
  type PriorityApproval,
} from '../data/mockData';
import { getPrincipalUnreadCount, usePrincipalNotificationsStore } from '../store/principalNotificationsStore';
import { handlePrincipalTabPress } from '../navigation/navigationHelpers';
import type { PrincipalColorScheme } from '@/designations/principal/theme/colors';
import type { PrincipalStackParamList } from '../navigation/types';
import { SCHOOL_NAME } from '@/constants/school';
import { useAuthStore } from '@/store';
import { formatAcademicTermLine, formatLongDate } from '@/utils/datetime';
import { getGreeting } from '@/utils/greeting';
import { spacing, textStyle, usePrincipalTheme, useThemedStyles } from '@/designations/principal/theme';

const AGENDA_PREVIEW = 3;

function cloneStats(stats: DashboardStat[]): DashboardStat[] {
  return stats.map((s) => ({ ...s }));
}

function refreshStatValues(stats: DashboardStat[]): DashboardStat[] {
  return stats.map((s) => {
    if (s.label === 'Enrolled') return { ...s, value: '1,248' };
    if (s.label === 'Attendance') return { ...s, value: `${(93.8 + Math.random() * 1.2).toFixed(1)}%` };
    if (s.label === 'Staff') return { ...s, value: `${86 + Math.floor(Math.random() * 3)}/92` };
    return s;
  });
}

function decrementAwaiting(stats: DashboardStat[]): DashboardStat[] {
  return stats.map((s) => {
    if (s.label !== 'Awaiting') return s;
    const next = Math.max(0, parseInt(s.value, 10) - 1);
    return { ...s, value: String(next) };
  });
}

export function DashboardScreen() {
  const { colors } = usePrincipalTheme();
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<NativeStackNavigationProp<PrincipalStackParamList>>();
  const user = useAuthStore((s) => s.user);
  const notificationItems = usePrincipalNotificationsStore((s) => s.items);
  const unreadCount = getPrincipalUnreadCount(notificationItems);

  const [metaLine, setMetaLine] = useState(() => formatAcademicTermLine());
  const [stats, setStats] = useState(() => cloneStats(initialDashboardStats));
  const [approvals, setApprovals] = useState<PriorityApproval[]>(initialPriorityApprovals);
  const [posts, setPosts] = useState<LatestPost[]>(initialLatestPosts);
  const [pulseRefreshing, setPulseRefreshing] = useState(false);
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const [showAllPosts, setShowAllPosts] = useState(false);
  const [selectedPost, setSelectedPost] = useState<LatestPost | null>(null);
  const [showAgenda, setShowAgenda] = useState(false);

  const displayName = user?.name?.split(' ').slice(-2).join(' ') ?? principalProfile.shortName;
  const greetingPrefix = getGreeting();
  const agendaPreview = useMemo(() => initialAgendaItems.slice(0, AGENDA_PREVIEW), []);

  useEffect(() => {
    const timer = setInterval(() => setMetaLine(formatAcademicTermLine()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setMetaLine(formatAcademicTermLine());
    }, []),
  );

  const handleRefreshPulse = () => {
    if (pulseRefreshing) return;
    setPulseRefreshing(true);
    setTimeout(() => {
      setStats((prev) => refreshStatValues(prev));
      setPulseRefreshing(false);
    }, 600);
  };

  const handlePullRefresh = useCallback(() => {
    if (pullRefreshing) return;
    setPullRefreshing(true);
    setMetaLine(formatAcademicTermLine());
    setStats((prev) => refreshStatValues(prev));
    setTimeout(() => setPullRefreshing(false), 700);
  }, [pullRefreshing]);

  const dismissApproval = (id: string) => {
    setApprovals((prev) => prev.filter((a) => a.id !== id));
    setStats((prev) => decrementAwaiting(prev));
  };

  const handleReject = (item: PriorityApproval) => {
    dismissApproval(item.id);
  };

  const handleApprove = (item: PriorityApproval) => {
    dismissApproval(item.id);
  };

  const handleReview = (item: PriorityApproval) => {
    dismissApproval(item.id);
    navigation.navigate('ExamResultsManagement');
  };

  const openPost = (post: LatestPost) => {
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, unread: false } : p)));
    setSelectedPost(post);
  };

  const handleQuickAccess = (route: (typeof quickModules)[number]['route']) => {
    navigation.navigate(route);
  };

  return (
    <>
      <ScreenShell
        scroll={false}
        paddingBottom={0}
        activeTab="home"
        onTabPress={(t) => handlePrincipalTabPress(navigation, t)}
        header={
          <PrincipalHeader
            title={SCHOOL_NAME}
            identity={{
              orgTitle: SCHOOL_NAME,
              orgSubtitle: 'Principal',
              notificationCount: unreadCount,
              onNotifications: () => navigation.navigate('Notifications'),
            }}
          />
        }
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={pullRefreshing}
              onRefresh={handlePullRefresh}
              tintColor={colors.primary}
              colors={[colors.primaryContainer]}
              progressBackgroundColor={colors.surfaceContainerLowest}
              title={Platform.OS === 'ios' ? 'Pull to refresh' : undefined}
              titleColor={colors.onSurfaceVariant}
            />
          }
        >
          <View style={styles.greeting}>
            <Text style={styles.greetingSub}>{greetingPrefix},</Text>
            <Text style={styles.greetingName}>{displayName} 👋</Text>
            <Text style={styles.greetingMeta}>{metaLine}</Text>
            <MaterialIcons name="school" size={120} color="rgba(255,255,255,0.12)" style={styles.watermark} />
          </View>

          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Quick Pulse</Text>
            <TouchableOpacity onPress={handleRefreshPulse} activeOpacity={0.7} style={styles.refreshBtn}>
              {pulseRefreshing ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={styles.link}>Refresh</Text>
              )}
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
            {stats.map((s) => (
              <View key={s.label} style={[styles.statCard, s.highlight && styles.statHighlight, pulseRefreshing && styles.statRefreshing]}>
                <MaterialIcons name={s.icon} size={22} color={s.highlight ? colors.onTertiaryContainer : colors.primary} />
                <Text style={[styles.statLbl, s.highlight && styles.statLblHi]}>{s.label}</Text>
                <Text style={[styles.statVal, s.highlight && styles.statValHi]}>{s.value}</Text>
              </View>
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>Priority Approvals</Text>
          {approvals.length === 0 ? (
            <Text style={styles.emptyHint}>No pending approvals — you're all caught up.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.approvalRow}>
              {approvals.map((a) => (
                <Card key={a.id} style={styles.approvalCard}>
                  <View style={styles.approvalTop}>
                    <View style={[styles.approvalAvatar, a.type === 'exam' && styles.approvalAvatarIcon]}>
                      {a.type === 'leave' ? (
                        <Text style={styles.approvalInitials}>{a.initials}</Text>
                      ) : (
                        <MaterialIcons name="description" size={20} color={colors.onPrimary} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.approvalName}>{a.name}</Text>
                      <Text style={styles.approvalDetail}>{a.detail}</Text>
                    </View>
                  </View>
                  <View style={styles.approvalActions}>
                    <TouchableOpacity
                      style={styles.approvalBtn}
                      onPress={() => (a.type === 'exam' ? handleReview(a) : handleReject(a))}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.rejectText}>{a.type === 'leave' ? 'Reject' : 'Review'}</Text>
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.approvalBtn} onPress={() => handleApprove(a)} activeOpacity={0.7}>
                      <Text style={styles.approveText}>Approve</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              ))}
            </ScrollView>
          )}

          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Today's Agenda</Text>
            <TouchableOpacity onPress={() => setShowAgenda(true)} activeOpacity={0.7} hitSlop={8}>
              <MaterialIcons name="calendar-today" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <Card style={styles.agendaCard}>
            {agendaPreview.map((item, index) => (
              <View key={item.id} style={styles.agendaRow}>
                <View style={styles.timelineCol}>
                  <View style={styles.agendaDot} />
                  {index < agendaPreview.length - 1 ? <View style={styles.timelineLine} /> : null}
                </View>
                <View style={styles.agendaBody}>
                  <Text style={styles.agendaTitle}>{item.title}</Text>
                  <Text style={styles.agendaLoc}>{item.location}</Text>
                </View>
                <Text style={styles.agendaTime}>{item.time}</Text>
              </View>
            ))}
          </Card>

          <Text style={styles.sectionTitle}>Performance Health</Text>
          <Card style={styles.healthCard}>
            <View style={styles.healthCol}>
              <Text style={styles.healthLbl}>Attendance</Text>
              <View style={styles.miniBars}>
                {[3, 5, 4, 7].map((h, i) => (
                  <View key={i} style={[styles.miniBar, { height: h * 3 }]} />
                ))}
              </View>
              <Text style={styles.healthVal}>+2.4%</Text>
            </View>
            <View style={[styles.healthCol, styles.healthBorder]}>
              <Text style={styles.healthLbl}>Academics</Text>
              <View style={styles.donut}>
                <Text style={styles.donutText}>88%</Text>
              </View>
              <Text style={styles.healthValDark}>Target</Text>
            </View>
            <View style={styles.healthCol}>
              <Text style={styles.healthLbl}>Discipline</Text>
              <View style={styles.discBars}>
                <View style={[styles.discBar, { height: 32, backgroundColor: `${colors.error}4d` }]} />
                <View style={[styles.discBar, { height: 40 }]} />
              </View>
              <Text style={styles.healthVal}>Stable</Text>
            </View>
          </Card>

          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Latest Posts</Text>
            <TouchableOpacity onPress={() => setShowAllPosts(true)} activeOpacity={0.7}>
              <Text style={styles.link}>See all</Text>
            </TouchableOpacity>
          </View>
          {posts.slice(0, 2).map((p) => (
            <TouchableOpacity key={p.id} style={styles.postRow} onPress={() => openPost(p)} activeOpacity={0.7}>
              <View style={styles.postIcon}>
                <MaterialIcons name={p.icon} size={20} color={colors.onSurfaceVariant} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.postHead}>
                  <Text style={styles.postTitle}>{p.title}</Text>
                  {p.unread ? <View style={styles.unreadDot} /> : null}
                </View>
                <Text style={styles.postPreview} numberOfLines={1}>{p.preview}</Text>
                <Text style={styles.postTime}>{p.time}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          ))}

          <Text style={[styles.sectionTitle, { marginTop: spacing.sm }]}>Quick Access</Text>
          <View style={styles.moduleGrid}>
            {quickModules.map((m) => (
              <TouchableOpacity
                key={m.route}
                style={styles.moduleChip}
                onPress={() => handleQuickAccess(m.route)}
                activeOpacity={0.7}
              >
                <MaterialIcons name={m.icon} size={20} color={colors.primary} />
                <Text style={styles.moduleLabel}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('CommunicationAnnouncements')}
        >
          <MaterialIcons name="add" size={32} color={colors.onPrimary} />
        </TouchableOpacity>
      </ScreenShell>

      {/* Today's full agenda */}
      <Modal visible={showAgenda} transparent animationType="slide" onRequestClose={() => setShowAgenda(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowAgenda(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Today's Agenda</Text>
              <TouchableOpacity onPress={() => setShowAgenda(false)}>
                <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>{formatLongDate()}</Text>
            {initialAgendaItems.map((item, index) => (
              <View key={item.id} style={styles.agendaModalRow}>
                <View style={styles.timelineCol}>
                  <View style={styles.agendaDot} />
                  {index < initialAgendaItems.length - 1 ? <View style={styles.timelineLine} /> : null}
                </View>
                <View style={styles.agendaBody}>
                  <Text style={styles.agendaTitle}>{item.title}</Text>
                  <Text style={styles.agendaLoc}>{item.location}</Text>
                </View>
                <Text style={styles.agendaTime}>{item.time}</Text>
              </View>
            ))}
            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={() => {
                setShowAgenda(false);
                navigation.navigate('TimetableManagement');
              }}
            >
              <Text style={styles.modalPrimaryText}>Open Timetable</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* All posts */}
      <Modal visible={showAllPosts} transparent animationType="slide" onRequestClose={() => setShowAllPosts(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowAllPosts(false)}>
          <Pressable style={[styles.modalSheet, styles.postsSheet]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>All Posts</Text>
              <TouchableOpacity onPress={() => setShowAllPosts(false)}>
                <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {posts.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.postListRow}
                  onPress={() => {
                    setShowAllPosts(false);
                    openPost(p);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.postIcon}>
                    <MaterialIcons name={p.icon} size={20} color={colors.onSurfaceVariant} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.postTitle}>{p.title}</Text>
                    <Text style={styles.postPreview} numberOfLines={2}>{p.preview}</Text>
                    <Text style={styles.postTime}>{p.time}</Text>
                  </View>
                  {p.unread ? <View style={styles.unreadDot} /> : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Post detail */}
      <Modal visible={!!selectedPost} transparent animationType="slide" onRequestClose={() => setSelectedPost(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedPost(null)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            {selectedPost ? (
              <>
                <View style={styles.modalHead}>
                  <View style={styles.postDetailHead}>
                    <View style={styles.postIcon}>
                      <MaterialIcons name={selectedPost.icon} size={20} color={colors.onSurfaceVariant} />
                    </View>
                    <Text style={styles.modalTitle}>{selectedPost.title}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedPost(null)}>
                    <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.postDetailTime}>{selectedPost.time}</Text>
                <ScrollView style={styles.postDetailScroll} showsVerticalScrollIndicator={false}>
                  <Text style={styles.postDetailBody}>{selectedPost.body}</Text>
                </ScrollView>
                <TouchableOpacity style={styles.modalPrimaryBtn} onPress={() => setSelectedPost(null)}>
                  <Text style={styles.modalPrimaryText}>Close</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function createStyles(colors: PrincipalColorScheme) {
  return StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.gutter, gap: spacing.md, paddingBottom: 100 },
  greeting: { backgroundColor: colors.primaryContainer, borderRadius: 12, padding: spacing.md, overflow: 'hidden', position: 'relative' },
  greetingSub: { ...textStyle('bodyMd'), color: colors.onPrimaryContainer, opacity: 0.9 },
  greetingName: { ...textStyle('headlineLgMobile'), color: colors.onPrimaryContainer, fontWeight: '700' },
  greetingMeta: { ...textStyle('labelMd'), color: colors.onPrimaryContainer, opacity: 0.8, marginTop: 4 },
  watermark: { position: 'absolute', right: -16, bottom: -16, transform: [{ rotate: '12deg' }] },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { ...textStyle('titleLg'), fontWeight: '600' },
  link: { ...textStyle('labelMd'), color: colors.primary, fontWeight: '600' },
  refreshBtn: { minWidth: 56, alignItems: 'flex-end', justifyContent: 'center' },
  emptyHint: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant, fontStyle: 'italic' },
  statsRow: { gap: spacing.md, paddingBottom: 4 },
  statCard: { minWidth: 140, backgroundColor: colors.surfaceContainerLow, borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: 12, padding: spacing.md, gap: spacing.sm },
  statHighlight: { backgroundColor: colors.tertiaryContainer, borderColor: colors.tertiaryContainer },
  statRefreshing: { opacity: 0.7 },
  statLbl: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  statLblHi: { color: colors.onTertiaryContainer, opacity: 0.8 },
  statVal: { ...textStyle('headlineMd'), fontWeight: '700' },
  statValHi: { color: colors.onTertiaryContainer },
  approvalRow: { gap: spacing.md },
  approvalCard: { minWidth: 280, padding: 0, overflow: 'hidden' },
  approvalTop: { flexDirection: 'row', gap: 12, padding: spacing.md, alignItems: 'center' },
  approvalAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.secondaryContainer, alignItems: 'center', justifyContent: 'center' },
  approvalAvatarIcon: { backgroundColor: colors.primaryContainer },
  approvalInitials: { ...textStyle('labelMd'), fontWeight: '700', color: colors.onSecondaryContainer },
  approvalName: { ...textStyle('bodyLg'), fontWeight: '600' },
  approvalDetail: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  approvalActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.outlineVariant },
  approvalBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  divider: { width: 1, backgroundColor: colors.outlineVariant },
  rejectText: { ...textStyle('labelMd'), color: colors.error, fontWeight: '600' },
  approveText: { ...textStyle('labelMd'), color: colors.primary, fontWeight: '700' },
  agendaCard: { gap: 0, paddingVertical: spacing.sm },
  agendaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingVertical: 10 },
  agendaModalRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingVertical: 12 },
  timelineCol: { width: 20, alignItems: 'center' },
  agendaDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.primaryContainer,
    borderWidth: 3,
    borderColor: colors.surfaceContainerLowest,
  },
  timelineLine: { flex: 1, width: 2, minHeight: 28, backgroundColor: `${colors.primaryContainer}33`, marginTop: 2 },
  agendaBody: { flex: 1, minWidth: 0 },
  agendaTitle: { ...textStyle('bodyMd'), fontWeight: '600' },
  agendaLoc: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  agendaTime: { ...textStyle('labelMd'), color: colors.primaryContainer, fontWeight: '600', flexShrink: 0 },
  healthCard: { flexDirection: 'row', padding: spacing.md },
  healthCol: { flex: 1, alignItems: 'center', gap: spacing.sm },
  healthBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.outlineVariant },
  healthLbl: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  healthVal: { ...textStyle('bodyMd'), fontWeight: '700', color: colors.primary },
  healthValDark: { ...textStyle('bodyMd'), fontWeight: '700' },
  miniBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 40 },
  miniBar: { width: 4, backgroundColor: colors.primaryContainer, borderRadius: 2 },
  donut: { width: 40, height: 40, borderRadius: 20, borderWidth: 4, borderColor: `${colors.primaryContainer}33`, alignItems: 'center', justifyContent: 'center' },
  donutText: { fontSize: 10, fontWeight: '700' },
  discBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 40 },
  discBar: { width: 12, backgroundColor: colors.primaryContainer, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  postRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center', paddingVertical: 4 },
  postListRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },
  postIcon: { width: 40, height: 40, borderRadius: 8, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  postHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  postTitle: { ...textStyle('bodyMd'), fontWeight: '600', flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  postPreview: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant },
  postTime: { ...textStyle('labelMd'), color: colors.onSurfaceVariant, opacity: 0.8 },
  moduleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  moduleChip: { width: '30%', minWidth: 100, alignItems: 'center', gap: 4, padding: spacing.sm, borderRadius: 12, borderWidth: 1, borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLowest },
  moduleLabel: { ...textStyle('chip10'), fontWeight: '600', textAlign: 'center' },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.gutter,
    maxHeight: '85%',
  },
  postsSheet: { maxHeight: '90%' },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 12 },
  modalTitle: { ...textStyle('titleLg'), fontWeight: '700', flex: 1 },
  modalSub: { ...textStyle('labelMd'), color: colors.onSurfaceVariant, marginBottom: spacing.md },
  modalPrimaryBtn: { marginTop: spacing.md, backgroundColor: colors.primaryContainer, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: spacing.sm },
  modalPrimaryText: { ...textStyle('bodyMd'), color: colors.onPrimary, fontWeight: '700' },
  postDetailHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  postDetailTime: { ...textStyle('labelMd'), color: colors.onSurfaceVariant, marginBottom: spacing.sm },
  postDetailScroll: { maxHeight: 280 },
  postDetailBody: { ...textStyle('bodyMd'), color: colors.onSurface, lineHeight: 22 },
});
}
