import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Linking, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useProfile } from '@/hooks/useApi';
import { ScreenHeader, LoadingScreen, ErrorScreen } from '@/components/ui/ScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { cardShadow } from '@/constants/shadows';
import { openPhoneDialer } from '@/utils/phone';
import type { TransportInfo } from '@/types';

export default function TransportScreen() {
  const theme = useTheme();
  const { data: profile, isLoading, error, refetch, isRefetching } = useProfile();

  if (isLoading) return <LoadingScreen />;
  if (error || !profile) return <ErrorScreen message="Failed to load transport details" onRetry={() => refetch()} />;
  if (!profile.transport) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
        <ScreenHeader title="Transport" fallbackRoute="/(tabs)/profile" />
        <View style={styles.emptyWrap}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.colors.primaryLight }]}>
            <Ionicons name="bus-outline" size={32} color={theme.colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No transport assigned</Text>
          <Text style={[styles.emptySub, { color: theme.colors.textSecondary }]}>
            You are not registered for school transport. Contact the school office for assistance.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const transport = profile.transport;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <ScreenHeader title="Transport" fallbackRoute="/(tabs)/profile" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.primary} />}
      >
        <TransportHero transport={transport} />

        <SectionHeader title="Pickup point" />
        <View style={[styles.locationCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={[styles.locationIcon, { backgroundColor: `${theme.colors.accent}22` }]}>
            <Ionicons name="location" size={22} color={theme.colors.accent} />
          </View>
          <View style={styles.locationCopy}>
            <Text style={[styles.locationLabel, { color: theme.colors.textSecondary }]}>Child pickup point</Text>
            <Text style={[styles.locationValue, { color: theme.colors.text }]}>{transport.pickupPoint}</Text>
          </View>
        </View>

        <SectionHeader title="Route details" />
        <View style={styles.routeGrid}>
          <RouteDetailCard
            theme={theme}
            icon="bus-outline"
            label="Route no."
            value={transport.routeNo}
            accent={theme.colors.primary}
          />
          {transport.vehicleNo ? (
            <RouteDetailCard
              theme={theme}
              icon="car-outline"
              label="Vehicle no."
              value={transport.vehicleNo}
              accent={theme.colors.primary}
            />
          ) : null}
        </View>

        <View style={[styles.schoolCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={[styles.schoolIcon, { backgroundColor: theme.colors.primaryLight }]}>
            <Ionicons name="school-outline" size={18} color={theme.colors.primary} />
          </View>
          <View style={styles.schoolCopy}>
            <Text style={[styles.schoolLabel, { color: theme.colors.textSecondary }]}>School destination</Text>
            <Text style={[styles.schoolValue, { color: theme.colors.text }]}>{transport.destinationAddress}</Text>
          </View>
        </View>

        <SectionHeader title="Driver details" />
        <ContactPersonCard
          theme={theme}
          name={transport.driverName}
          role="Bus driver"
          phone={transport.driverNumber}
          icon="person-circle-outline"
        />

        <SectionHeader title="Support contacts" />
        <View style={styles.contacts}>
          <ContactPersonCard
            theme={theme}
            name="Transport incharge"
            role="Route coordinator"
            phone={transport.inchargeNumber}
            icon="headset-outline"
            compact
          />
          <View style={[styles.contactCard, styles.contactCardCompact, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={[styles.contactIcon, { backgroundColor: theme.colors.primaryLight }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color={theme.colors.primary} />
            </View>
            <View style={styles.contactCopy}>
              <Text style={[styles.contactName, { color: theme.colors.text }]}>{transport.captainName}</Text>
              <Text style={[styles.contactRole, { color: theme.colors.textSecondary }]}>Bus captain</Text>
            </View>
          </View>
        </View>

        <SectionHeader title="Live tracking" />
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.trackCard, cardShadow]}
          onPress={() => Linking.openURL(transport.trackingLink)}
        >
          <View style={styles.trackLeft}>
            <View style={styles.trackIconWrap}>
              <Ionicons name="navigate" size={22} color="#fff" />
            </View>
            <View style={styles.trackCopy}>
              <Text style={styles.trackTitle}>Track bus live</Text>
              <Text style={styles.trackSub} numberOfLines={2}>
                See real-time location for route {transport.routeNo}
              </Text>
            </View>
          </View>
          <Ionicons name="open-outline" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.trackLink, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}
          onPress={() => Linking.openURL(transport.trackingLink)}
          activeOpacity={0.75}
        >
          <Ionicons name="link-outline" size={16} color={theme.colors.primary} />
          <Text style={[styles.trackLinkText, { color: theme.colors.primary }]} numberOfLines={1}>
            {transport.trackingLink}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function TransportHero({ transport }: { transport: TransportInfo }) {
  return (
    <View style={[styles.heroCard, cardShadow]}>
      <View style={styles.heroTop}>
        <View style={styles.heroBusIcon}>
          <Ionicons name="bus" size={28} color="#144835" />
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.heroEyebrow}>ASSIGNED ROUTE</Text>
          <Text style={styles.heroRoute}>{transport.routeNo}</Text>
          {transport.vehicleNo ? <Text style={styles.heroVehicle}>Vehicle {transport.vehicleNo}</Text> : null}
        </View>
      </View>
      <View style={styles.heroFooter}>
        <View style={styles.heroMeta}>
          <Text style={styles.heroMetaLabel}>DRIVER</Text>
          <Text style={styles.heroMetaValue} numberOfLines={1}>
            {transport.driverName.replace(/^Mr\. |^Mrs\. /, '')}
          </Text>
        </View>
        <View style={styles.heroDivider} />
        <View style={styles.heroMeta}>
          <Text style={styles.heroMetaLabel}>CAPTAIN</Text>
          <Text style={styles.heroMetaValue} numberOfLines={1}>
            {transport.captainName.replace(/^Mr\. |^Mrs\. /, '')}
          </Text>
        </View>
      </View>
    </View>
  );
}

function RouteDetailCard({
  theme,
  icon,
  label,
  value,
  accent,
}: {
  theme: ReturnType<typeof useTheme>;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <View style={[styles.routeCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={[styles.routeIcon, { backgroundColor: `${accent}14` }]}>
        <Ionicons name={icon} size={18} color={accent} />
      </View>
      <Text style={[styles.routeLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.routeValue, { color: theme.colors.text }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function ContactPersonCard({
  theme,
  name,
  role,
  phone,
  icon,
  compact = false,
}: {
  theme: ReturnType<typeof useTheme>;
  name: string;
  role: string;
  phone: string;
  icon: keyof typeof Ionicons.glyphMap;
  compact?: boolean;
}) {
  return (
    <View
      style={[
        styles.contactCard,
        compact && styles.contactCardCompact,
        cardShadow,
        { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
      ]}
    >
      <View style={[styles.contactIcon, { backgroundColor: theme.colors.primaryLight }]}>
        <Ionicons name={icon} size={compact ? 18 : 24} color={theme.colors.primary} />
      </View>
      <View style={styles.contactCopy}>
        <Text style={[styles.contactName, { color: theme.colors.text }]}>{name}</Text>
        <Text style={[styles.contactRole, { color: theme.colors.textSecondary }]}>{role}</Text>
        <Text style={[styles.contactPhone, { color: theme.colors.text }]}>{phone}</Text>
      </View>
      <TouchableOpacity
        style={[styles.callBtn, { backgroundColor: theme.colors.primary }]}
        onPress={() => openPhoneDialer(phone)}
        activeOpacity={0.85}
      >
        <Ionicons name="call" size={18} color="#fff" />
      </TouchableOpacity>
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
  heroBusIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#a2c144',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: { flex: 1 },
  heroEyebrow: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  heroRoute: { color: '#fff', fontSize: 32, fontWeight: '800', marginTop: 4 },
  heroVehicle: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600', marginTop: 4 },
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
  heroMetaValue: { color: '#fff', fontSize: 13, fontWeight: '700', marginTop: 4 },
  heroDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.15)' },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  locationIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  locationCopy: { flex: 1 },
  locationLabel: { fontSize: 12, fontWeight: '600' },
  locationValue: { fontSize: 15, fontWeight: '700', marginTop: 4, lineHeight: 22 },
  routeGrid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  routeCard: { flex: 1, padding: 14, borderRadius: 14, borderWidth: 1, minWidth: 0 },
  routeIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  routeLabel: { fontSize: 11, fontWeight: '600' },
  routeValue: { fontSize: 16, fontWeight: '800', marginTop: 4 },
  schoolCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  schoolIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  schoolCopy: { flex: 1 },
  schoolLabel: { fontSize: 11, fontWeight: '600' },
  schoolValue: { fontSize: 14, fontWeight: '600', marginTop: 4, lineHeight: 20 },
  contacts: { gap: 10, marginBottom: 8 },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  contactCardCompact: { padding: 14, marginBottom: 0 },
  contactIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  contactCopy: { flex: 1 },
  contactName: { fontSize: 15, fontWeight: '700' },
  contactRole: { fontSize: 12, marginTop: 2 },
  contactPhone: { fontSize: 13, fontWeight: '600', marginTop: 6 },
  callBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  trackCard: {
    backgroundColor: '#144835',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  trackLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  trackIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(162,193,68,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackCopy: { flex: 1 },
  trackTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  trackSub: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 4, lineHeight: 17 },
  trackLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  trackLinkText: { flex: 1, fontSize: 12, fontWeight: '600' },
});
