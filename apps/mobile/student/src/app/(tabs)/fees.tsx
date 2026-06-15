import { ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useFees } from '@/hooks/useApi';
import { LoadingScreen, ErrorScreen } from '@/components/ui/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { formatINR } from '@/utils/currency';
import { TAB_SCREEN_SCROLL_PADDING } from '@/constants/layout';

export default function FeesTab() {
  const theme = useTheme();
  const router = useRouter();
  const { data, isLoading, error, refetch, isRefetching } = useFees();

  if (isLoading) return <LoadingScreen />;
  if (error || !data) return <ErrorScreen message="Failed to load fees" onRetry={() => refetch()} />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Fees & Payments</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.primary} />}
      >
        <View style={[styles.dueCard, { backgroundColor: theme.colors.card, borderColor: `${theme.colors.primary}0d` }]}>
          <View style={[styles.decor, { backgroundColor: `${theme.colors.primary}1a` }]} />
          <View style={styles.dueContent}>
            <View style={styles.periodRow}>
              <MaterialIcons name="event-repeat" size={16} color={theme.colors.primary} />
              <Text style={[styles.periodLabel, { color: theme.colors.primary }]}>CURRENT PERIOD</Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={[styles.amount, { color: theme.colors.text }]}>{formatINR(data.dueAmount)}</Text>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>Total Outstanding</Text>
            </View>
            <View style={styles.dueFooter}>
              <View>
                <Text style={[styles.dueLabel, { color: theme.colors.textSecondary }]}>DUE DATE</Text>
                <Text style={[styles.dueDate, { color: theme.colors.text }]}>{data.dueDate}</Text>
              </View>
              {data.dueAmount > 0 ? (
                <Button title="Pay Now" onPress={() => router.push('/fees/payment-options')} style={{ minWidth: 120, paddingVertical: 12 }} />
              ) : (
                <View style={[styles.paidBadge, { backgroundColor: `${theme.colors.primary}1a` }]}>
                  <Text style={{ color: theme.colors.primary, fontWeight: '700', fontSize: 12 }}>FULLY PAID</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.quickLinks}>
          {[
            { icon: 'history' as const, label: 'Full History', route: '/fees/history' as const },
            { icon: 'receipt-long' as const, label: 'Download Receipts', route: '/fees/receipts' as const },
            { icon: 'payments' as const, label: 'Payment Plans' },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.quickItem, { backgroundColor: theme.colors.card, borderColor: `${theme.colors.primary}1a` }]}
              onPress={() => item.route && router.push(item.route)}
            >
              <View style={[styles.quickIcon, { backgroundColor: `${theme.colors.primary}1a` }]}>
                <MaterialIcons name={item.icon} size={22} color={theme.colors.primary} />
              </View>
              <Text style={[styles.quickLabel, { color: theme.colors.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.structureCard, { backgroundColor: theme.colors.card, borderColor: `${theme.colors.primary}0d` }]}>
          <View style={styles.structureHeader}>
            <MaterialIcons name="analytics" size={22} color={theme.colors.primary} />
            <Text style={[styles.structureTitle, { color: theme.colors.text }]}>Fee Structure</Text>
          </View>
          {data.structure.map((item) => (
            <View key={item.label} style={styles.structureRow}>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>{item.label}</Text>
              <Text style={{ color: theme.colors.text, fontWeight: '600', fontSize: 14 }}>{formatINR(item.amount)}</Text>
            </View>
          ))}
          <View style={[styles.totalRow, { borderTopColor: `${theme.colors.primary}1a` }]}>
            <Text style={{ color: theme.colors.text, fontWeight: '700' }}>Total Dues</Text>
            <Text style={{ color: theme.colors.primary, fontWeight: '800', fontSize: 18 }}>{formatINR(data.dueAmount)}</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Payments</Text>
        {data.recentPayments.map((p) => (
          <View key={p.id} style={[styles.paymentCard, { backgroundColor: theme.colors.card, borderColor: `${theme.colors.primary}0d` }]}>
            <View style={styles.paymentLeft}>
              <View style={[styles.paymentIcon, { backgroundColor: `${theme.colors.primary}1a` }]}>
                <MaterialIcons name="check-circle" size={22} color={theme.colors.primary} />
              </View>
              <View>
                <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 14 }}>{p.period}</Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: 10, textTransform: 'uppercase' }}>Paid on {p.paidOn}</Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{formatINR(p.amount)}</Text>
              <View style={[styles.successBadge, { backgroundColor: `${theme.colors.primary}33` }]}>
                <Text style={{ color: theme.colors.primary, fontSize: 10, fontWeight: '700' }}>SUCCESS</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scroll: { padding: 16, paddingBottom: TAB_SCREEN_SCROLL_PADDING },
  dueCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  decor: { position: 'absolute', top: -32, right: -32, width: 128, height: 128, borderRadius: 64 },
  dueContent: { padding: 24 },
  periodRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  periodLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 1 },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 24 },
  amount: { fontSize: 32, fontWeight: '800' },
  dueFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dueLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  dueDate: { fontSize: 16, fontWeight: '600' },
  quickLinks: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  quickItem: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1 },
  quickIcon: { padding: 8, borderRadius: 999, marginBottom: 8 },
  quickLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  structureCard: { padding: 20, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  structureHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  structureTitle: { fontSize: 18, fontWeight: '700' },
  structureRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, marginTop: 8, borderTopWidth: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  paymentCard: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  paymentLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  paymentIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  successBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  paidBadge: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
});
