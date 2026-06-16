import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useFees } from '@/hooks/useApi';
import { ScreenHeader, LoadingScreen, ErrorScreen } from '@/components/ui/ScreenHeader';
import { formatINR } from '@/utils/currency';

/** Stitch: fees_payments_overview */
export default function FeesPaymentsOverviewScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data, isLoading, error, refetch } = useFees();

  if (isLoading) return <LoadingScreen />;
  if (error || !data) return <ErrorScreen message="Failed to load fees" onRetry={() => refetch()} />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScreenHeader title="FEES & PAYMENTS" rightAction={
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="close" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      } />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.heroCard, { backgroundColor: theme.colors.card, borderColor: `${theme.colors.primary}1a` }]}>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>Total Outstanding</Text>
          <Text style={[styles.heroAmount, { color: theme.colors.text }]}>{formatINR(data.dueAmount)}</Text>
          <Text style={{ color: theme.colors.textSecondary }}>Due: {data.dueDate}</Text>
        </View>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Fee Structure</Text>
        {data.structure.map((item) => (
          <View key={item.label} style={styles.feeRow}>
            <Text style={{ color: theme.colors.textSecondary }}>{item.label}</Text>
            <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{formatINR(item.amount)}</Text>
          </View>
        ))}
        <View style={[styles.totalRow, { borderTopColor: theme.colors.border }]}>
          <Text style={{ fontWeight: '700', color: theme.colors.text }}>Total Dues</Text>
          <Text style={{ color: theme.colors.primary, fontWeight: '800', fontSize: 18 }}>{formatINR(data.dueAmount)}</Text>
        </View>
        <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 24 }]}>Recent Payments</Text>
        {data.recentPayments.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={[styles.paymentCard, { backgroundColor: theme.colors.card }]}
            onPress={() => router.push('/fees/receipt')}
          >
            <MaterialIcons name="check-circle" size={24} color={theme.colors.primary} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontWeight: '700', color: theme.colors.text }}>{p.period}</Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>{p.paidOn}</Text>
            </View>
            <Text style={{ fontWeight: '700', color: theme.colors.text }}>{formatINR(p.amount)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16 },
  heroCard: { padding: 24, borderRadius: 16, borderWidth: 1, marginBottom: 24, alignItems: 'center' },
  heroAmount: { fontSize: 40, fontWeight: '800', marginVertical: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, marginTop: 8, borderTopWidth: 1 },
  paymentCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 8 },
});
