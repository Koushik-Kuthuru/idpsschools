import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useFees } from '@/hooks/useApi';
import { ScreenHeader, LoadingScreen, ErrorScreen } from '@/components/ui/ScreenHeader';
import { PaymentHistoryList } from '@/components/fees/PaymentHistoryList';
import { formatINR } from '@/utils/currency';

export default function FeesHistoryScreen() {
  const theme = useTheme();
  const { data, isLoading, error, refetch } = useFees();

  if (isLoading) return <LoadingScreen />;
  if (error || !data) return <ErrorScreen message="Failed to load payment history" onRetry={() => refetch()} />;

  const totalPaid = data.recentPayments.reduce((sum, p) => sum + (p.status === 'success' ? p.amount : 0), 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScreenHeader title="Full Payment History" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.summary, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={styles.summaryItem}>
            <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: '600' }}>TOTAL PAID</Text>
            <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>{formatINR(totalPaid)}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.summaryItem}>
            <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: '600' }}>TRANSACTIONS</Text>
            <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{data.recentPayments.length}</Text>
          </View>
        </View>
        <PaymentHistoryList payments={data.recentPayments} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 32 },
  summary: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, padding: 20, marginBottom: 20 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  divider: { width: 1, marginHorizontal: 12 },
});
