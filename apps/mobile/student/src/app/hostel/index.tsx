import { ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useProfile } from '@/hooks/useApi';
import { ScreenHeader, LoadingScreen, ErrorScreen } from '@/components/ui/ScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { cardShadow } from '@/constants/shadows';
import { openPhoneDialer } from '@/utils/phone';
import type { HostelInfo } from '@/types';

export default function HostelScreen() {
  const theme = useTheme();
  const { data: profile, isLoading, error, refetch, isRefetching } = useProfile();

  if (isLoading) return <LoadingScreen />;
  if (error || !profile) return <ErrorScreen message="Failed to load hostel details" onRetry={() => refetch()} />;
  if (!profile.hostel) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
        <ScreenHeader title="Hostel" fallbackRoute="/(tabs)/profile" />
        <View style={styles.emptyWrap}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.colors.primaryLight }]}>
            <Ionicons name="bed-outline" size={32} color={theme.colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No hostel assigned</Text>
          <Text style={[styles.emptySub, { color: theme.colors.textSecondary }]}>
            You are not registered in school hostel. Contact the warden office for assistance.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const hostel = profile.hostel;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <ScreenHeader title="Hostel" fallbackRoute="/(tabs)/profile" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.primary} />}
      >
        <HostelHero hostel={hostel} />

        <SectionHeader title="Room details" />
        <View style={styles.detailGrid}>
          <DetailCard theme={theme} icon="business-outline" label="Block" value={hostel.block} />
          <DetailCard theme={theme} icon="home-outline" label="Room" value={hostel.roomNo} />
          <DetailCard theme={theme} icon="bed-outline" label="Bed" value={hostel.bedNo} />
        </View>

        {hostel.messTimings ? (
          <>
            <SectionHeader title="Mess timings" />
            <View style={[styles.messCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <View style={[styles.messIcon, { backgroundColor: theme.colors.primaryLight }]}>
                <Ionicons name="restaurant-outline" size={20} color={theme.colors.primary} />
              </View>
              <Text style={[styles.messText, { color: theme.colors.text }]}>{hostel.messTimings}</Text>
            </View>
          </>
        ) : null}

        <SectionHeader title="Warden contact" />
        <View style={[styles.contactCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={[styles.contactIcon, { backgroundColor: theme.colors.primaryLight }]}>
            <Ionicons name="person-circle-outline" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.contactCopy}>
            <Text style={[styles.contactName, { color: theme.colors.text }]}>{hostel.wardenName}</Text>
            <Text style={[styles.contactRole, { color: theme.colors.textSecondary }]}>Hostel warden</Text>
            <Text style={[styles.contactPhone, { color: theme.colors.text }]}>{hostel.wardenPhone}</Text>
          </View>
          <TouchableOpacity
            style={[styles.callBtn, { backgroundColor: theme.colors.primary }]}
            onPress={() => openPhoneDialer(hostel.wardenPhone)}
            activeOpacity={0.85}
          >
            <Ionicons name="call" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function HostelHero({ hostel }: { hostel: HostelInfo }) {
  return (
    <View style={[styles.heroCard, cardShadow]}>
      <View style={styles.heroTop}>
        <View style={styles.heroIcon}>
          <Ionicons name="bed" size={28} color="#144835" />
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.heroEyebrow}>ASSIGNED HOSTEL</Text>
          <Text style={styles.heroBlock}>{hostel.block}</Text>
          <Text style={styles.heroRoom}>
            Room {hostel.roomNo} · Bed {hostel.bedNo}
          </Text>
        </View>
      </View>
    </View>
  );
}

function DetailCard({
  theme,
  icon,
  label,
  value,
}: {
  theme: ReturnType<typeof useTheme>;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={[styles.detailCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={[styles.detailIcon, { backgroundColor: theme.colors.primaryLight }]}>
        <Ionicons name={icon} size={18} color={theme.colors.primary} />
      </View>
      <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: theme.colors.text }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  heroCard: {
    backgroundColor: '#144835',
    borderRadius: 16,
    padding: 20,
    marginTop: 4,
    marginBottom: 8,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#a2c144',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: { flex: 1 },
  heroEyebrow: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  heroBlock: { color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 4 },
  heroRoom: { color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: '600', marginTop: 6 },
  detailGrid: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  detailCard: { flex: 1, padding: 14, borderRadius: 14, borderWidth: 1, minWidth: 0, alignItems: 'center' },
  detailIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  detailLabel: { fontSize: 11, fontWeight: '600' },
  detailValue: { fontSize: 15, fontWeight: '800', marginTop: 4, textAlign: 'center' },
  messCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  messIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  messText: { flex: 1, fontSize: 14, fontWeight: '600', lineHeight: 20 },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  contactIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  contactCopy: { flex: 1 },
  contactName: { fontSize: 15, fontWeight: '700' },
  contactRole: { fontSize: 12, marginTop: 2 },
  contactPhone: { fontSize: 13, fontWeight: '600', marginTop: 6 },
  callBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
