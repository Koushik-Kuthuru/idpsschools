import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useFees } from '@/hooks/useApi';
import { useAuthStore } from '@/store';
import { ScreenHeader, LoadingScreen, ErrorScreen } from '@/components/ui/ScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { PaymentHistoryList } from '@/components/fees/PaymentHistoryList';
import { downloadPaymentReceipt } from '@/utils/receipt';
import { cardShadow } from '@/constants/shadows';
import { formatINR } from '@/utils/currency';
import type { PaymentRecord } from '@/types';

export default function FeeReceiptsScreen() {
  const theme = useTheme();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, error, refetch, isRefetching } = useFees();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  if (isLoading) return <LoadingScreen />;
  if (error || !data) return <ErrorScreen message="Failed to load receipts" onRetry={() => refetch()} />;

  const receipts = data.recentPayments.filter((p) => p.status === 'success');
  const receiptTotal = receipts.reduce((sum, p) => sum + p.amount, 0);

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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <ScreenHeader title="Receipts" fallbackRoute="/(tabs)/fees" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.primary} />}
      >
        <View style={[styles.heroCard, cardShadow]}>
          <View style={styles.heroTop}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>DOWNLOAD PDFs</Text>
              <Text style={styles.heroTitle}>{receipts.length} receipts</Text>
              <Text style={styles.heroSub}>Tap any receipt to save as PDF</Text>
            </View>
            <View style={styles.heroIconWrap}>
              <Ionicons name="document-text-outline" size={28} color="rgba(255,255,255,0.9)" />
            </View>
          </View>
          <View style={styles.heroFooter}>
            <View style={styles.heroMeta}>
              <Text style={styles.heroMetaLabel}>TOTAL</Text>
              <Text style={styles.heroMetaValue}>{formatINR(receiptTotal)}</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroMeta}>
              <Text style={styles.heroMetaLabel}>AVAILABLE</Text>
              <Text style={styles.heroMetaValue}>{receipts.length}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.tipCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Ionicons name="information-circle-outline" size={18} color={theme.colors.primary} />
          <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
            Receipts include school details, payment method, transaction ID, and fee breakdown.
          </Text>
        </View>

        <SectionHeader title="Available receipts" />
        <PaymentHistoryList
          payments={receipts}
          mode="receipt"
          emptyMessage="No receipts available yet"
          onDownload={handleDownload}
          downloadingId={downloadingId}
        />
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
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroCopy: { flex: 1, marginRight: 12 },
  heroEyebrow: { color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 6 },
  heroSub: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '500', marginTop: 4 },
  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  heroMetaValue: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 4 },
  heroDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.15)' },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  tipText: { flex: 1, fontSize: 13, lineHeight: 18 },
});
