import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useFees } from '@/hooks/useApi';
import { useAuthStore } from '@/store';
import { ScreenHeader, LoadingScreen, ErrorScreen } from '@/components/ui/ScreenHeader';
import { downloadPaymentReceipt } from '@/utils/receipt';
import { formatINR } from '@/utils/currency';
import type { PaymentRecord } from '@/types';

export default function FeeReceiptsScreen() {
  const theme = useTheme();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, error, refetch } = useFees();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  if (isLoading) return <LoadingScreen />;
  if (error || !data) return <ErrorScreen message="Failed to load receipts" onRetry={() => refetch()} />;

  const receipts = data.recentPayments.filter((p) => p.status === 'success');

  const handleDownload = async (payment: PaymentRecord) => {
    setDownloadingId(payment.id);
    try {
      const { fileName } = await downloadPaymentReceipt(payment, {
        name: user?.name,
        studentId: user?.studentId,
        className: user?.className,
        rollNumber: user?.rollNumber,
      });
      Alert.alert('Downloaded', `Receipt saved as ${fileName}`);
    } catch {
      Alert.alert('Error', 'Could not download receipt');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScreenHeader title="Download Receipts" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={{ color: theme.colors.textSecondary, fontSize: 14, marginBottom: 16 }}>
          Tap a receipt to download it as a PDF with school details and payment information.
        </Text>
        {receipts.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <MaterialIcons name="receipt-long" size={36} color={theme.colors.textMuted} />
            <Text style={{ color: theme.colors.textSecondary, marginTop: 8 }}>No receipts available yet</Text>
          </View>
        ) : (
          receipts.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
              onPress={() => handleDownload(p)}
              disabled={downloadingId === p.id}
            >
              <View style={[styles.icon, { backgroundColor: `${theme.colors.primary}1a` }]}>
                <MaterialIcons name="receipt-long" size={24} color={theme.colors.primary} />
              </View>
              <View style={styles.content}>
                <Text style={[styles.title, { color: theme.colors.text }]}>{p.period}</Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>{p.paidOn}</Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: 11, marginTop: 2 }}>
                  {p.receiptNumber ?? `Receipt ${p.id}`} • {p.method ?? 'Online'}
                </Text>
              </View>
              <View style={styles.right}>
                <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{formatINR(p.amount)}</Text>
                <MaterialIcons
                  name={downloadingId === p.id ? 'hourglass-top' : 'download'}
                  size={20}
                  color={theme.colors.primary}
                  style={{ marginTop: 6 }}
                />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 32 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 10, gap: 12 },
  icon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1 },
  title: { fontWeight: '700', fontSize: 15 },
  right: { alignItems: 'flex-end' },
  empty: { alignItems: 'center', padding: 40, borderRadius: 12, borderWidth: 1 },
});
