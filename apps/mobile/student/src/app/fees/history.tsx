import { ScrollView, View, Text, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useFees } from '@/hooks/useApi';
import { ScreenHeader, LoadingScreen, ErrorScreen } from '@/components/ui/ScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { PaymentHistoryList } from '@/components/fees/PaymentHistoryList';
import { cardShadow } from '@/constants/shadows';
import { formatINR } from '@/utils/currency';

export default function FeesHistoryScreen() {
  const theme = useTheme();
  const { data, isLoading, error, refetch, isRefetching } = useFees();

  if (isLoading) return <LoadingScreen />;
  if (error || !data) return <ErrorScreen message="Failed to load payment history" onRetry={() => refetch()} />;

  const successPayments = data.recentPayments.filter((p) => p.status === 'success');
  const totalPaid = successPayments.reduce((sum, p) => sum + p.amount, 0);

  const stats = [
    { label: 'Total paid', value: formatINR(totalPaid), color: theme.colors.primary, icon: 'checkmark-circle-outline' as const },
    { label: 'Transactions', value: String(data.recentPayments.length), color: theme.colors.text, icon: 'swap-horizontal-outline' as const },
    { label: 'Due now', value: formatINR(data.dueAmount), color: data.dueAmount > 0 ? theme.colors.amber500 : theme.colors.primary, icon: 'time-outline' as const },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <ScreenHeader title="Payment history" fallbackRoute="/(tabs)/fees" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.primary} />}
      >
        <View style={[styles.heroCard, cardShadow]}>
          <Text style={styles.heroEyebrow}>ALL PAYMENTS</Text>
          <Text style={styles.heroTitle}>{formatINR(totalPaid)}</Text>
          <Text style={styles.heroSub}>{data.recentPayments.length} transactions on record</Text>
        </View>

        <View style={styles.statsRow}>
          {stats.map((s) => (
            <View
              key={s.label}
              style={[styles.statCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            >
              <View style={[styles.statIcon, { backgroundColor: `${s.color}14` }]}>
                <Ionicons name={s.icon} size={14} color={s.color} />
              </View>
              <Text style={[styles.statValue, { color: s.color }]} numberOfLines={1}>
                {s.value}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textMuted }]} numberOfLines={1}>
                {s.label}
              </Text>
            </View>
          ))}
        </View>

        <SectionHeader title="Transactions" />
        <PaymentHistoryList payments={data.recentPayments} dueAmount={data.dueAmount} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  heroCard: {
    backgroundColor: '#144835',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    marginTop: 4,
  },
  heroEyebrow: { color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  heroTitle: { color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 6 },
  heroSub: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '500', marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  statCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 0,
  },
  statIcon: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statValue: { fontSize: 12, fontWeight: '800' },
  statLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 2, textAlign: 'center' },
});
