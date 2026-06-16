import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useProfile } from '@/hooks/useApi';
import { useLogout } from '@/hooks/useLogout';
import { LoadingScreen, ErrorScreen } from '@/components/ui/ScreenHeader';
import { TabScreenHeader } from '@/components/ui/TabScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { NavLink } from '@/components/navigation/NavLink';
import { cardShadow } from '@/constants/shadows';
import { TAB_SCREEN_SCROLL_PADDING } from '@/constants/layout';
import { appNavigate } from '@/utils/navigation';
import { openPhoneDialer } from '@/utils/phone';
import type { User } from '@/types';

const ID_CARD_ROUTE = '/profile/id-card' as const;

export default function ProfileTab() {
  const theme = useTheme();
  const { confirmSignOut } = useLogout();
  const { data: profile, isLoading, error, refetch, isRefetching } = useProfile();

  if (isLoading) return <LoadingScreen />;
  if (error || !profile) return <ErrorScreen message="Failed to load profile" onRetry={() => refetch()} />;

  const quickActions: { icon: keyof typeof Ionicons.glyphMap; label: string; sub: string; route: Href }[] = [
    { icon: 'calendar-outline', label: 'Attendance', sub: 'Monthly stats', route: '/(tabs)/attendance' },
    { icon: 'bar-chart-outline', label: 'Marks', sub: 'View grades', route: '/marks' },
    { icon: 'wallet-outline', label: 'Fees', sub: 'Pay & history', route: '/(tabs)/fees' },
    { icon: 'id-card-outline', label: 'ID Card', sub: 'View details', route: ID_CARD_ROUTE },
    { icon: 'bus-outline', label: 'Transport', sub: 'Route & tracking', route: '/transport' },
    { icon: 'bed-outline', label: 'Hostel', sub: 'Dome block', route: '/hostel' },
  ];

  const menuItems: { icon: keyof typeof Ionicons.glyphMap; label: string; route: Href }[] = [
    { icon: 'folder-open-outline', label: 'Projects', route: '/assignments' },
    { icon: 'calendar-outline', label: 'Exam schedule', route: '/exams/schedule' },
    { icon: 'time-outline', label: 'Class timetable', route: '/timetable' },
    { icon: 'settings-outline', label: 'Settings', route: '/settings' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TabScreenHeader title="Profile" subtitle={`${profile.className} · Roll ${profile.rollNumber}`} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.primary} />}
      >
        <ProfileHeroCard profile={profile} />

        <SectionHeader title="Quick actions" />
        <View style={styles.actionsRow}>
          {quickActions.map((action) => (
            <NavLink
              key={action.label}
              href={action.route}
              style={[styles.actionCard, styles.actionCardThird, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            >
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.primaryLight }]}>
                <Ionicons name={action.icon} size={20} color={theme.colors.primary} />
              </View>
              <Text style={[styles.actionLabel, { color: theme.colors.text }]}>{action.label}</Text>
              <Text style={[styles.actionSub, { color: theme.colors.textSecondary }]}>{action.sub}</Text>
            </NavLink>
          ))}
        </View>

        <ProfileInfoCard
          theme={theme}
          title="Personal info"
          icon="person-outline"
          rows={[
            { label: 'Gender', value: profile.gender },
            { label: 'Date of birth', value: profile.dob },
            { label: 'Blood group', value: profile.bloodGroup },
            { label: 'Phone', value: profile.phone, phone: profile.phone },
            { label: 'Email', value: profile.email },
          ]}
        />

        {(profile.parentName || profile.parentPhone) ? (
          <ProfileInfoCard
            theme={theme}
            title="Parent & guardian"
            icon="people-outline"
            rows={[
              { label: 'Name', value: profile.parentName },
              { label: 'Phone', value: profile.parentPhone, phone: profile.parentPhone },
            ]}
          />
        ) : null}

        <SectionHeader title="Menu" />
        <View style={styles.menu}>
          {menuItems.map((item) => (
            <NavLink
              key={item.label}
              href={item.route}
              style={[styles.menuItem, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            >
              <View style={[styles.menuIcon, { backgroundColor: theme.colors.primaryLight }]}>
                <Ionicons name={item.icon} size={18} color={theme.colors.primary} />
              </View>
              <Text style={[styles.menuLabel, { color: theme.colors.text }]}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
            </NavLink>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.logoutCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: `${theme.colors.red500}33` }]}
          onPress={() => confirmSignOut()}
          activeOpacity={0.75}
        >
          <View style={[styles.logoutIcon, { backgroundColor: `${theme.colors.red500}14` }]}>
            <Ionicons name="log-out-outline" size={20} color={theme.colors.red500} />
          </View>
          <Text style={[styles.logoutText, { color: theme.colors.red500 }]}>Sign out</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.red500} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function ProfileHeroCard({ profile }: { profile: User }) {
  return (
    <View style={[styles.heroCard, cardShadow]}>
      <View style={styles.heroTop}>
        <View style={styles.avatarWrap}>
          {profile.avatar ? (
            <Image source={{ uri: profile.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Ionicons name="person" size={36} color="#144835" />
            </View>
          )}
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.heroName} numberOfLines={2}>
            {profile.name}
          </Text>
          <Text style={styles.heroSchool} numberOfLines={2}>
            {profile.schoolName}
          </Text>
          <View style={styles.heroPills}>
            <TouchableOpacity
              style={styles.heroPill}
              activeOpacity={0.85}
              onPress={() => appNavigate(ID_CARD_ROUTE)}
              accessibilityRole="button"
              accessibilityLabel={`Open ID card for ${profile.studentId}`}
            >
              <Text style={styles.heroPillText}>ID {profile.studentId}</Text>
            </TouchableOpacity>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>{profile.className}</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.heroFooter}>
        <View style={styles.heroMeta}>
          <Text style={styles.heroMetaLabel}>GRADE</Text>
          <Text style={styles.heroMetaValue}>{profile.grade}</Text>
        </View>
        <View style={styles.heroDivider} />
        <View style={styles.heroMeta}>
          <Text style={styles.heroMetaLabel}>ROLL</Text>
          <Text style={styles.heroMetaValue}>{profile.rollNumber}</Text>
        </View>
        <View style={styles.heroDivider} />
        <View style={styles.heroMeta}>
          <Text style={styles.heroMetaLabel}>CLASS</Text>
          <Text style={styles.heroMetaValue}>{profile.className}</Text>
        </View>
      </View>
    </View>
  );
}

type ProfileInfoRow = { label: string; value?: string; phone?: string };

function ProfileInfoCard({
  theme,
  title,
  icon,
  rows,
}: {
  theme: ReturnType<typeof useTheme>;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  rows: ProfileInfoRow[];
}) {
  return (
    <View style={[styles.infoCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={styles.infoHeader}>
        <View style={[styles.infoIconWrap, { backgroundColor: theme.colors.primaryLight }]}>
          <Ionicons name={icon} size={16} color={theme.colors.primary} />
        </View>
        <Text style={[styles.infoTitle, { color: theme.colors.text }]}>{title}</Text>
      </View>
      {rows.map((row) => (
        <View key={row.label} style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>{row.label}</Text>
          {row.phone && row.value ? (
            <TouchableOpacity onPress={() => openPhoneDialer(row.phone!)} style={styles.infoValueWrap}>
              <Text style={[styles.infoValue, styles.infoValueLink, { color: theme.colors.primary }]}>{row.value}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.infoValue, { color: theme.colors.text }]} numberOfLines={2}>
              {row.value ?? '—'}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: TAB_SCREEN_SCROLL_PADDING },
  heroCard: {
    backgroundColor: '#144835',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  avatar: { width: '100%', height: '100%' },
  avatarFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  heroCopy: { flex: 1 },
  heroName: { fontSize: 20, fontWeight: '800', color: '#fff' },
  heroSchool: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  heroPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  heroPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroPillText: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  heroMeta: { flex: 1, alignItems: 'center' },
  heroMetaLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  heroMetaValue: { color: '#fff', fontSize: 14, fontWeight: '700', marginTop: 4 },
  heroDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.15)' },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  actionCard: { flex: 1, padding: 14, borderRadius: 14, borderWidth: 1, minWidth: '30%', alignItems: 'center' },
  actionCardThird: { flexBasis: '30%', flexGrow: 1 },
  actionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  actionLabel: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  actionSub: { fontSize: 11, marginTop: 2, textAlign: 'center' },
  infoCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  infoIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  infoTitle: { fontSize: 15, fontWeight: '700', flex: 1 },
  infoLabel: { fontSize: 13, flex: 1 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 8, gap: 12 },
  infoValue: { fontWeight: '600', fontSize: 13, flex: 1, textAlign: 'right' },
  infoValueWrap: { flex: 1, alignItems: 'flex-end' },
  infoValueLink: { textDecorationLine: 'underline' },
  menu: { gap: 8, marginBottom: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, gap: 12 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    marginTop: 8,
  },
  logoutIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  logoutText: { flex: 1, fontSize: 15, fontWeight: '700' },
});
