import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { cardShadow } from '@/constants/shadows';
import { formatINR } from '@/utils/currency';
import type { PaymentRecord } from '@/types';

interface PaymentHistoryListProps {
  payments: PaymentRecord[];
  emptyMessage?: string;
  dueAmount?: number;
  onDownload?: (payment: PaymentRecord) => void;
  downloadingId?: string | null;
  mode?: 'history' | 'receipt';
}

export function PaymentHistoryList({
  payments,
  emptyMessage = 'No payment history yet',
  dueAmount = 0,
  onDownload,
  downloadingId,
  mode = 'history',
}: PaymentHistoryListProps) {
  const theme = useTheme();
  const router = useRouter();

  if (payments.length === 0) {
    return (
      <View style={[styles.empty, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Ionicons name={mode === 'receipt' ? 'receipt-outline' : 'time-outline'} size={32} color={theme.colors.textMuted} />
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>{emptyMessage}</Text>
      </View>
    );
  }

  const handlePress = (payment: PaymentRecord) => {
    if (mode === 'receipt' && onDownload) {
      onDownload(payment);
      return;
    }
    router.push({
      pathname: '/fees/receipt',
      params: {
        transactionId: payment.transactionId ?? payment.id,
        amount: String(payment.amount),
        method: payment.method ?? 'Online',
        date: payment.paidOn,
        dateTime: payment.dateTime,
        receiptNumber: payment.receiptNumber,
        remainingDues: String(dueAmount),
      },
    });
  };

  return (
    <>
      {payments.map((p) => {
        const status = statusConfig(p.status, theme);
        const isDownloading = downloadingId === p.id;

        return (
          <TouchableOpacity
            key={p.id}
            activeOpacity={0.75}
            style={[styles.card, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={() => handlePress(p)}
            disabled={isDownloading}
          >
            <View style={[styles.accentBar, { backgroundColor: status.color }]} />
            <View style={styles.left}>
              <View style={[styles.icon, { backgroundColor: `${status.color}14` }]}>
                <Ionicons name={status.icon} size={20} color={status.color} />
              </View>
              <View style={styles.details}>
                <Text style={[styles.period, { color: theme.colors.text }]} numberOfLines={1}>
                  {p.period}
                </Text>
                <Text style={[styles.meta, { color: theme.colors.textMuted }]}>{p.paidOn}</Text>
                <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
                  {p.method ?? 'Online'}
                  {p.receiptNumber ? ` · ${p.receiptNumber}` : ''}
                </Text>
                {p.transactionId ? (
                  <Text style={[styles.txn, { color: theme.colors.textMuted }]} numberOfLines={1}>
                    {p.transactionId}
                  </Text>
                ) : null}
              </View>
            </View>
            <View style={styles.right}>
              <Text style={[styles.amount, { color: theme.colors.text }]}>{formatINR(p.amount)}</Text>
              <View style={[styles.badge, { backgroundColor: `${status.color}18` }]}>
                <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
              </View>
              {mode === 'receipt' ? (
                isDownloading ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} style={styles.actionIcon} />
                ) : (
                  <Ionicons name="download-outline" size={18} color={theme.colors.primary} style={styles.actionIcon} />
                )
              ) : (
                <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} style={styles.actionIcon} />
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </>
  );
}

function statusConfig(status: PaymentRecord['status'], theme: ReturnType<typeof useTheme>) {
  if (status === 'success') {
    return { color: theme.colors.primary, icon: 'checkmark-circle' as const, label: 'Paid' };
  }
  if (status === 'pending') {
    return { color: theme.colors.amber500, icon: 'time-outline' as const, label: 'Pending' };
  }
  return { color: theme.colors.red500, icon: 'close-circle' as const, label: 'Failed' };
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
    gap: 10,
  },
  accentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  left: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1, marginLeft: 4 },
  icon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  details: { flex: 1, minWidth: 0 },
  period: { fontWeight: '700', fontSize: 14 },
  meta: { fontSize: 11, marginTop: 2 },
  txn: { fontSize: 10, marginTop: 4 },
  right: { alignItems: 'flex-end' },
  amount: { fontWeight: '800', fontSize: 15 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 4 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  actionIcon: { marginTop: 6 },
  empty: { alignItems: 'center', padding: 36, borderRadius: 14, borderWidth: 1, gap: 8 },
  emptyText: { fontSize: 14, fontWeight: '500' },
});
