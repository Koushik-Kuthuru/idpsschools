import { useEffect, useRef } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { buildReceiptFileName, downloadReceipt, generateFeeReceipt, shareReceipt } from '@/utils/receipt';
import { useAuthStore } from '@/store';
import { SCHOOL_NAME } from '@/constants/config';
import { formatINR } from '@/utils/currency';

export default function PaymentConfirmationScreen() {
  const params = useLocalSearchParams<{
    transactionId: string;
    amount: string;
    method: string;
    date: string;
    dateTime?: string;
    receiptNumber?: string;
    feeCategory?: string;
    nextDueDate?: string;
    remainingDues?: string;
    status?: string;
  }>();
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  }, [scale]);

  const amount = Number(params.amount) || 2650;
  const remaining = Number(params.remainingDues ?? 0);

  const handleShare = async () => {
    const payload = {
      transactionId: params.transactionId ?? 'TXN000',
      studentName: user?.name ?? 'Alex Johnson',
      studentId: user?.studentId ?? '2024-001',
      className: user?.className ?? '10-A',
      rollNumber: user?.rollNumber ?? '001',
      amount,
      method: params.method ?? 'Card',
      date: params.dateTime ?? params.date ?? '',
      receiptNumber: params.receiptNumber ?? 'RCP-2024-0145',
      schoolName: SCHOOL_NAME,
      breakdown: [
        { label: 'Tuition Fees', amount: 1800 },
        { label: 'Sports & Activities', amount: 300 },
        { label: 'Transport Facility', amount: 150 },
        { label: 'Miscellaneous', amount: 400 },
      ],
      pendingDues: remaining > 0 ? remaining : undefined,
    };
    const uri = await generateFeeReceipt(payload);
    const fileName = buildReceiptFileName(payload);
    const path = await downloadReceipt(uri, fileName);
    await shareReceipt(path, 'Share Receipt');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={[styles.topHeader, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: theme.colors.text }]}>Payment Confirmation</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.successSection}>
          <Animated.View style={[styles.successIcon, { backgroundColor: `${theme.colors.primary}1a`, transform: [{ scale }] }]}>
            <MaterialIcons name="check-circle" size={72} color={theme.colors.primary} />
          </Animated.View>
          <Text style={[styles.successTitle, { color: theme.colors.text }]}>PAYMENT SUCCESS</Text>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>Your payment has been processed successfully</Text>
          <Text style={[styles.amount, { color: theme.colors.primary }]}>{formatINR(amount)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${theme.colors.primary}33` }]}>
            <Text style={{ color: theme.colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>{params.status ?? 'COMPLETED'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>TRANSACTION DETAILS</Text>
          <DetailRow label="Transaction ID" value={params.transactionId ?? '—'} theme={theme} />
          <DetailRow label="Date & Time" value={params.dateTime ?? params.date ?? '—'} theme={theme} />
          <DetailRow label="Payment Method" value={params.method ?? '—'} theme={theme} icon="credit-card" />
          <DetailRow label="Fee Category" value={params.feeCategory ?? 'Tuition & Activities'} theme={theme} />
          <DetailRow label="Receipt Number" value={params.receiptNumber ?? 'RCP-2024-0145'} theme={theme} />
        </View>

        <View style={[styles.infoBox, { backgroundColor: `${theme.colors.primary}0d`, borderColor: `${theme.colors.primary}33` }]}>
          <MaterialIcons name="calendar-today" size={22} color={theme.colors.primary} />
          <View>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>Next Fee Due</Text>
            <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{params.nextDueDate ?? 'Feb 15, 2025'}</Text>
          </View>
        </View>

        {remaining > 0 && (
          <View style={[styles.duesBox, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={{ color: theme.colors.textSecondary }}>Remaining Dues</Text>
            <Text style={{ color: theme.colors.primary, fontWeight: '800', fontSize: 18 }}>{formatINR(remaining)}</Text>
          </View>
        )}

        <Button title="Download Receipt" onPress={() => router.replace({ pathname: '/fees/receipt', params })} icon="download" />
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.secondaryBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]} onPress={handleShare}>
            <MaterialIcons name="share" size={20} color={theme.colors.primary} />
            <Text style={{ color: theme.colors.text, fontWeight: '600' }}>Share Receipt</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/(tabs)')}>
          <Text style={{ color: theme.colors.textSecondary, fontWeight: '600' }}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value, theme, icon }: { label: string; value: string; theme: ReturnType<typeof useTheme>; icon?: keyof typeof MaterialIcons.glyphMap }) {
  return (
    <View style={styles.row}>
      <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {icon && <MaterialIcons name={icon} size={16} color={theme.colors.text} />}
        <Text style={{ color: theme.colors.text, fontWeight: '600', fontSize: 14 }}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  topTitle: { fontSize: 18, fontWeight: '700' },
  scroll: { padding: 24, paddingBottom: 48 },
  successSection: { alignItems: 'center', marginBottom: 28 },
  successIcon: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  amount: { fontSize: 32, fontWeight: '800', marginTop: 16 },
  statusBadge: { marginTop: 8, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  duesBox: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  secondaryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
  homeBtn: { marginTop: 16, paddingVertical: 14, alignItems: 'center' },
});
