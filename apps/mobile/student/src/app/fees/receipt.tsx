import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store';
import { SCHOOL_NAME } from '@/constants/config';
import { buildReceiptFileName, generateFeeReceipt, shareReceipt, downloadReceipt } from '@/utils/receipt';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { formatINR } from '@/utils/currency';

const BREAKDOWN = [
  { label: 'Tuition Fees', amount: 1800 },
  { label: 'Sports Fee', amount: 300 },
  { label: 'Transport', amount: 150 },
  { label: 'Miscellaneous', amount: 400 },
];

export default function FeeReceiptScreen() {
  const params = useLocalSearchParams<{
    transactionId: string;
    amount: string;
    method: string;
    date: string;
    dateTime?: string;
    receiptNumber?: string;
    remainingDues?: string;
  }>();
  const theme = useTheme();
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(false);

  const amount = Number(params.amount) || 2650;
  const pending = Number(params.remainingDues ?? 0);

  const receiptPayload = () => ({
    transactionId: params.transactionId ?? 'TXN123456789',
    studentName: user?.name ?? 'Alex Johnson',
    studentId: user?.studentId ?? '2024-001',
    className: user?.className ?? '10-A',
    rollNumber: user?.rollNumber ?? '001',
    amount,
    method: params.method ?? 'Credit Card',
    date: params.dateTime ?? params.date ?? 'Jan 15, 2025 • 10:45 AM',
    receiptNumber: params.receiptNumber ?? 'RCP-2024-0145',
    schoolName: SCHOOL_NAME,
    breakdown: BREAKDOWN,
    pendingDues: pending > 0 ? pending : undefined,
  });

  const handleAction = async (action: 'share' | 'download') => {
    setLoading(true);
    try {
      const payload = receiptPayload();
      const uri = await generateFeeReceipt(payload);
      const fileName = buildReceiptFileName(payload);
      if (action === 'share') {
        const path = await downloadReceipt(uri, fileName);
        await shareReceipt(path, 'Share Receipt');
      } else {
        await downloadReceipt(uri, fileName);
        Alert.alert('Downloaded', `Receipt saved as ${fileName}`);
      }
    } catch {
      Alert.alert('Error', 'Could not generate receipt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScreenHeader title="Fee Receipt" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.banner, { backgroundColor: theme.colors.primary }]}>
          <MaterialIcons name="account-balance" size={64} color="rgba(255,255,255,0.15)" style={styles.bannerBg} />
          <View style={styles.bannerIcon}>
            <MaterialIcons name="school" size={36} color={theme.colors.primary} />
          </View>
          <Text style={styles.bannerSchool}>{SCHOOL_NAME.toUpperCase()}</Text>
          <Text style={styles.bannerSub}>FEE RECEIPT</Text>
        </View>

        <View style={[styles.metaCard, { backgroundColor: theme.colors.card, borderColor: `${theme.colors.primary}0d` }]}>
          <View>
            <Text style={styles.metaLabel}>Receipt #</Text>
            <Text style={[styles.metaValue, { color: theme.colors.text }]}>{params.receiptNumber ?? 'RCP-2024-0145'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.metaLabel}>Date & Time</Text>
            <Text style={[styles.metaValue, { color: theme.colors.text }]}>{params.dateTime ?? params.date}</Text>
          </View>
        </View>

        <SectionTitle icon="person" title="Student Details" theme={theme} />
        <View style={[styles.grid, { borderColor: `${theme.colors.primary}0d` }]}>
          <GridCell label="Name" value={user?.name ?? 'Alex Johnson'} theme={theme} />
          <GridCell label="Admission" value={user?.studentId ?? '2024-001'} theme={theme} />
          <GridCell label="Class" value={user?.className ?? '10-A'} theme={theme} />
          <GridCell label="Roll No." value={user?.rollNumber ?? '001'} theme={theme} />
        </View>

        <SectionTitle icon="receipt-long" title="Fee Breakdown" theme={theme} />
        <View style={[styles.breakdown, { backgroundColor: theme.colors.card, borderColor: `${theme.colors.primary}0d` }]}>
          {BREAKDOWN.map((row) => (
            <View key={row.label} style={styles.breakRow}>
              <Text style={{ color: theme.colors.textSecondary }}>{row.label}</Text>
              <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{formatINR(row.amount)}</Text>
            </View>
          ))}
          <View style={[styles.totalRow, { borderTopColor: theme.colors.border }]}>
            <Text style={{ color: theme.colors.text, fontWeight: '700' }}>Amount Paid</Text>
            <Text style={{ color: theme.colors.primary, fontWeight: '800', fontSize: 20 }}>{formatINR(amount)}</Text>
          </View>
        </View>

        <View style={[styles.paidBadge, { backgroundColor: `${theme.colors.primary}1a` }]}>
          <MaterialIcons name="check-circle" size={18} color={theme.colors.primary} />
          <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Payment Successful</Text>
        </View>

        <View style={[styles.breakdown, { backgroundColor: theme.colors.card, borderColor: `${theme.colors.primary}0d` }]}>
          <InfoRow label="Payment Method" value={params.method ?? 'Credit Card'} theme={theme} />
          <InfoRow label="Transaction ID" value={params.transactionId ?? '—'} theme={theme} />
          {pending > 0 && <InfoRow label="Pending Dues" value={formatINR(pending)} theme={theme} highlight />}
        </View>

        <Button title="SHARE RECEIPT" onPress={() => handleAction('share')} loading={loading} icon="share" />
        <Button title="DOWNLOAD PDF" onPress={() => handleAction('download')} variant="outline" style={{ marginTop: 12 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({ icon, title, theme }: { icon: keyof typeof MaterialIcons.glyphMap; title: string; theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={styles.sectionHeader}>
      <MaterialIcons name={icon} size={16} color={theme.colors.primary} />
      <Text style={{ color: theme.colors.primary, fontSize: 13, fontWeight: '700', textTransform: 'uppercase' }}>{title}</Text>
    </View>
  );
}

function GridCell({ label, value, theme }: { label: string; value: string; theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={[styles.gridCell, { backgroundColor: theme.colors.card }]}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={{ color: theme.colors.text, fontWeight: '500' }}>{value}</Text>
    </View>
  );
}

function InfoRow({ label, value, theme, highlight }: { label: string; value: string; theme: ReturnType<typeof useTheme>; highlight?: boolean }) {
  return (
    <View style={styles.breakRow}>
      <Text style={{ color: theme.colors.textSecondary }}>{label}</Text>
      <Text style={{ color: highlight ? theme.colors.primary : theme.colors.text, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 100 },
  banner: { borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 16, overflow: 'hidden' },
  bannerBg: { position: 'absolute', top: 8, right: 8 },
  bannerIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  bannerSchool: { color: '#fff', fontSize: 18, fontWeight: '800' },
  bannerSub: { color: 'rgba(255,255,255,0.9)', fontSize: 12, letterSpacing: 2, marginTop: 4 },
  metaCard: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  metaLabel: { fontSize: 10, color: '#64748b', fontWeight: '700', textTransform: 'uppercase' },
  metaValue: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', borderRadius: 12, overflow: 'hidden', marginBottom: 16 },
  gridCell: { width: '50%', padding: 12 },
  breakdown: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  breakRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, marginTop: 8, borderTopWidth: 1 },
  paidBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 8, marginBottom: 16 },
});
