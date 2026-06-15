import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { formatINR } from '@/utils/currency';
import type { PaymentRecord } from '@/types';

interface PaymentHistoryListProps {
  payments: PaymentRecord[];
  emptyMessage?: string;
}

export function PaymentHistoryList({ payments, emptyMessage = 'No payment history yet' }: PaymentHistoryListProps) {
  const theme = useTheme();

  if (payments.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <MaterialIcons name="history" size={32} color={theme.colors.textMuted} />
        <Text style={{ color: theme.colors.textSecondary, marginTop: 8 }}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <>
      {payments.map((p) => (
        <View key={p.id} style={[styles.card, { backgroundColor: theme.colors.card, borderColor: `${theme.colors.primary}0d` }]}>
          <View style={styles.left}>
            <View style={[styles.icon, { backgroundColor: `${theme.colors.primary}1a` }]}>
              <MaterialIcons
                name={p.status === 'success' ? 'check-circle' : p.status === 'pending' ? 'schedule' : 'error'}
                size={22}
                color={p.status === 'success' ? theme.colors.primary : p.status === 'pending' ? theme.colors.amber500 : theme.colors.red500}
              />
            </View>
            <View style={styles.details}>
              <Text style={[styles.period, { color: theme.colors.text }]}>{p.period}</Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>Paid on {p.paidOn}</Text>
              {p.method && <Text style={{ color: theme.colors.textSecondary, fontSize: 11, marginTop: 2 }}>{p.method}</Text>}
              {p.transactionId && (
                <Text style={{ color: theme.colors.textMuted, fontSize: 10, marginTop: 2 }}>TXN: {p.transactionId}</Text>
              )}
            </View>
          </View>
          <View style={styles.right}>
            <Text style={[styles.amount, { color: theme.colors.text }]}>{formatINR(p.amount)}</Text>
            <View style={[styles.badge, { backgroundColor: statusBg(p.status, theme.colors.primary) }]}>
              <Text style={{ color: statusColor(p.status, theme.colors.primary, theme.colors.amber500, theme.colors.red500), fontSize: 10, fontWeight: '700' }}>
                {p.status.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </>
  );
}

function statusBg(status: PaymentRecord['status'], primary: string) {
  if (status === 'success') return `${primary}33`;
  if (status === 'pending') return 'rgba(245, 158, 11, 0.2)';
  return 'rgba(239, 68, 68, 0.2)';
}

function statusColor(status: PaymentRecord['status'], primary: string, amber: string, red: string) {
  if (status === 'success') return primary;
  if (status === 'pending') return amber;
  return red;
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  left: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1 },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  details: { flex: 1 },
  period: { fontWeight: '700', fontSize: 14 },
  right: { alignItems: 'flex-end' },
  amount: { fontWeight: '700', fontSize: 15 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 6 },
  empty: { alignItems: 'center', padding: 32, borderRadius: 12, borderWidth: 1 },
});
