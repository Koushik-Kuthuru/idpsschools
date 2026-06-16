import { ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useFees } from '@/hooks/useApi';
import { ProgressBar } from '@/components/charts/ProgressChart';
import { LoadingScreen, ErrorScreen } from '@/components/ui/ScreenHeader';
import { TabScreenHeader } from '@/components/ui/TabScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button } from '@/components/ui/Button';
import { NavLink } from '@/components/navigation/NavLink';
import { formatINR } from '@/utils/currency';
import { appNavigate } from '@/utils/navigation';
import { cardShadow } from '@/constants/shadows';
import { TAB_SCREEN_SCROLL_PADDING } from '@/constants/layout';
import type { FeesOverview } from '@/types';

const STRUCTURE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Tuition Fees': 'school-outline',
  'Sports & Activities': 'football-outline',
  'Transport Facility': 'bus-outline',
  Miscellaneous: 'grid-outline',
};

function structureIcon(label: string): keyof typeof Ionicons.glyphMap {
  return STRUCTURE_ICONS[label] ?? 'document-text-outline';
}

export default function FeesTab() {
  const theme = useTheme();
  const { data, isLoading, error, refetch, isRefetching } = useFees();

  if (isLoading) return <LoadingScreen />;
  if (error || !data) return <ErrorScreen message="Failed to load fees" onRetry={() => refetch()} />;

  const paidPercent = data.totalFees > 0 ? Math.round((data.paidAmount / data.totalFees) * 100) : 0;
  const structureTotal = data.structure.reduce((sum, item) => sum + item.amount, 0);

  const stats = [
    { label: 'Total', value: formatINR(data.totalFees), color: theme.colors.text, icon: 'wallet-outline' as const },
    { label: 'Paid', value: formatINR(data.paidAmount), color: theme.colors.primary, icon: 'checkmark-circle-outline' as const },
    { label: 'Due', value: formatINR(data.dueAmount), color: data.dueAmount > 0 ? theme.colors.amber500 : theme.colors.primary, icon: 'time-outline' as const },
  ];

  const quickActions = [
    { icon: 'time-outline' as const, label: 'History', sub: 'All payments', route: '/fees/history' as const },
    { icon: 'receipt-outline' as const, label: 'Receipts', sub: 'Download PDFs', route: '/fees/receipts' as const },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TabScreenHeader
        title="Fees"
        subtitle={data.dueAmount > 0 ? `${formatINR(data.dueAmount)} due · ${data.dueDate}` : 'All fees paid'}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.primary} />}
      >
        <FeesHeroCard data={data} paidPercent={paidPercent} onPay={() => appNavigate('/fees/payment-options')} />

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
              <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        <SectionHeader title="Quick actions" />
        <View style={styles.actionsRow}>
          {quickActions.map((action) => (
            <NavLink
              key={action.label}
              href={action.route}
              style={[styles.actionCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            >
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.primaryLight }]}>
                <Ionicons name={action.icon} size={20} color={theme.colors.primary} />
              </View>
              <Text style={[styles.actionLabel, { color: theme.colors.text }]}>{action.label}</Text>
              <Text style={[styles.actionSub, { color: theme.colors.textSecondary }]}>{action.sub}</Text>
            </NavLink>
          ))}
        </View>

        <SectionHeader title="Fee structure" />
        <View style={[styles.structureCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          {data.structure.map((item, i) => (
            <View
              key={item.label}
              style={[styles.structureRow, i < data.structure.length - 1 && { borderBottomColor: theme.colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
            >
              <View style={styles.structureLeft}>
                <View style={[styles.structureIcon, { backgroundColor: theme.colors.primaryLight }]}>
                  <Ionicons name={structureIcon(item.label)} size={16} color={theme.colors.primary} />
                </View>
                <Text style={[styles.structureLabel, { color: theme.colors.text }]}>{item.label}</Text>
              </View>
              <Text style={[styles.structureAmount, { color: theme.colors.text }]}>{formatINR(item.amount)}</Text>
            </View>
          ))}
          <View style={[styles.totalRow, { borderTopColor: theme.colors.border }]}>
            <Text style={[styles.totalLabel, { color: theme.colors.text }]}>Period total</Text>
            <Text style={[styles.totalAmount, { color: theme.colors.primary }]}>{formatINR(structureTotal)}</Text>
          </View>
        </View>

        <SectionHeader title="Recent payments" actionLabel="See all" onAction={() => appNavigate('/fees/history')} />
        {data.recentPayments.length === 0 ? (
          <View style={[styles.emptyCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Ionicons name="receipt-outline" size={28} color={theme.colors.textMuted} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No payments yet</Text>
          </View>
        ) : (
          data.recentPayments.slice(0, 5).map((p) => (
            <TouchableOpacity
              key={p.id}
              activeOpacity={0.75}
              style={[styles.paymentCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
              onPress={() =>
                appNavigate({
                  pathname: '/fees/receipt',
                  params: {
                    transactionId: p.transactionId ?? p.id,
                    amount: String(p.amount),
                    method: p.method ?? 'Online',
                    date: p.paidOn,
                    dateTime: p.dateTime,
                    receiptNumber: p.receiptNumber,
                    remainingDues: String(data.dueAmount),
                  },
                })
              }
            >
              <View style={[styles.accentBar, { backgroundColor: theme.colors.primary }]} />
              <View style={styles.paymentLeft}>
                <View style={[styles.paymentIcon, { backgroundColor: theme.colors.primaryLight }]}>
                  <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} />
                </View>
                <View style={styles.paymentCopy}>
                  <Text style={[styles.paymentPeriod, { color: theme.colors.text }]} numberOfLines={1}>
                    {p.period}
                  </Text>
                  <Text style={[styles.paymentMeta, { color: theme.colors.textMuted }]}>
                    {p.paidOn}{p.method ? ` · ${p.method}` : ''}
                  </Text>
                </View>
              </View>
              <View style={styles.paymentRight}>
                <Text style={[styles.paymentAmount, { color: theme.colors.text }]}>{formatINR(p.amount)}</Text>
                <View style={[styles.successBadge, { backgroundColor: theme.colors.primaryLight }]}>
                  <Text style={[styles.successText, { color: theme.colors.primary }]}>Paid</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} style={styles.chevron} />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function FeesHeroCard({
  data,
  paidPercent,
  onPay,
}: {
  data: FeesOverview;
  paidPercent: number;
  onPay: () => void;
}) {
  const isPaid = data.dueAmount <= 0;

  return (
    <View style={[styles.heroCard, cardShadow]}>
      <View style={styles.heroTop}>
        <View style={styles.heroCopy}>
          <Text style={styles.heroEyebrow}>OUTSTANDING FEES</Text>
          <Text style={styles.heroAmount}>{formatINR(data.dueAmount)}</Text>
          <Text style={styles.heroSub}>{isPaid ? 'No pending dues' : `Due by ${data.dueDate}`}</Text>
        </View>
        <View style={styles.heroIconWrap}>
          <Ionicons name="wallet" size={28} color="rgba(255,255,255,0.9)" />
        </View>
      </View>

      <View style={styles.progressBlock}>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>Payment progress</Text>
          <Text style={styles.progressPercent}>{paidPercent}% paid</Text>
        </View>
        <ProgressBar percent={paidPercent} height={8} color="#a2c144" />
        <Text style={styles.progressMeta}>
          {formatINR(data.paidAmount)} of {formatINR(data.totalFees)} paid
        </Text>
      </View>

      <View style={styles.heroFooter}>
        {isPaid ? (
          <View style={styles.paidBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#144835" />
            <Text style={styles.paidText}>All fees cleared</Text>
          </View>
        ) : (
          <Button title="Pay now" onPress={onPay} style={styles.payBtn} textStyle={styles.payBtnText} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: TAB_SCREEN_SCROLL_PADDING },
  heroCard: {
    backgroundColor: '#144835',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroCopy: { flex: 1, marginRight: 12 },
  heroEyebrow: { color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  heroAmount: { color: '#fff', fontSize: 32, fontWeight: '800', marginTop: 6 },
  heroSub: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '500', marginTop: 4 },
  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBlock: { marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)' },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
  progressPercent: { color: '#a2c144', fontSize: 12, fontWeight: '700' },
  progressMeta: { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '500', marginTop: 8 },
  heroFooter: { marginTop: 16, alignItems: 'flex-start' },
  payBtn: { minWidth: 140, paddingVertical: 12, backgroundColor: '#fff' },
  payBtnText: { color: '#144835' },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  paidText: { color: '#144835', fontWeight: '700', fontSize: 13 },
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
  statValue: { fontSize: 13, fontWeight: '800' },
  statLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  actionCard: { flex: 1, padding: 14, borderRadius: 14, borderWidth: 1 },
  actionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  actionLabel: { fontSize: 14, fontWeight: '700' },
  actionSub: { fontSize: 11, marginTop: 2 },
  structureCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 8 },
  structureRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  structureLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  structureIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  structureLabel: { fontSize: 14, fontWeight: '600', flex: 1 },
  structureAmount: { fontWeight: '700', fontSize: 14 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  totalLabel: { fontWeight: '700', fontSize: 15 },
  totalAmount: { fontWeight: '800', fontSize: 18 },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    marginBottom: 8,
  },
  emptyText: { fontSize: 14, fontWeight: '500' },
  paymentCard: {
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
  paymentLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginLeft: 4 },
  paymentIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  paymentCopy: { flex: 1, minWidth: 0 },
  paymentPeriod: { fontWeight: '700', fontSize: 14 },
  paymentMeta: { fontSize: 11, marginTop: 2 },
  paymentRight: { alignItems: 'flex-end' },
  paymentAmount: { fontWeight: '800', fontSize: 15 },
  successBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 4 },
  successText: { fontSize: 10, fontWeight: '700' },
  chevron: { marginTop: 4 },
});
