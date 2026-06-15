import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { PrincipalHeader } from '../components/PrincipalHeader';
import { ScreenShell } from '../components/ScreenShell';
import { Card, ProgressBar } from '../components/ui';
import {
  FINANCE_REPORT_RANGES,
  allFeeDefaulters,
  concessionRequests as initialConcessions,
  feeCategories,
  feeDefaulters as initialDefaulters,
  financeOverview,
  scholarshipList,
  type ConcessionRequest,
  type FeeDefaulter,
  type FinanceReportRange,
} from '../data/mockData';
import { shareFinanceReportAsPdf } from '@/utils/financePdf';
import { formatMonthYear } from '@/utils/datetime';
import { spacing, textStyle, usePrincipalTheme, useThemedStyles } from '@/designations/principal/theme';
import type { PrincipalColorScheme } from '@/designations/principal/theme/colors';

type QuickAction = 'report' | 'reminder' | 'concession' | 'scholarship';
type CategoryFilter = 'All' | (typeof feeCategories)[number]['label'];

const QUICK_ACTIONS: { key: QuickAction; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { key: 'report', label: 'Generate Report', icon: 'assessment' },
  { key: 'reminder', label: 'Send Fee Reminder', icon: 'notifications-active' },
  { key: 'concession', label: 'Concession Requests', icon: 'request-quote' },
  { key: 'scholarship', label: 'Scholarship List', icon: 'school' },
];

export function FeeFinanceOverviewScreen() {
  const { colors } = usePrincipalTheme();
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation();
  const overview = financeOverview;
  const [defaulters, setDefaulters] = useState<FeeDefaulter[]>(initialDefaulters);
  const [concessions, setConcessions] = useState<ConcessionRequest[]>(initialConcessions);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('All');
  const [showDownload, setShowDownload] = useState(false);
  const [showCustomDownload, setShowCustomDownload] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showDefaulters, setShowDefaulters] = useState(false);
  const [showConcessions, setShowConcessions] = useState(false);
  const [showScholarships, setShowScholarships] = useState(false);
  const [customRange, setCustomRange] = useState<FinanceReportRange>('month');
  const [downloading, setDownloading] = useState(false);

  const visibleCategories = useMemo(() => {
    if (categoryFilter === 'All') return feeCategories;
    return feeCategories.filter((c) => c.label === categoryFilter);
  }, [categoryFilter]);

  const pendingConcessions = useMemo(() => concessions.filter((c) => c.status === 'pending'), [concessions]);
  const unremindedCount = useMemo(() => defaulters.filter((d) => !d.reminded).length, [defaulters]);

  const buildReportInput = (range: FinanceReportRange, title: string) => {
    const rangeMeta = FINANCE_REPORT_RANGES.find((r) => r.id === range);
    return {
      title,
      periodLabel: formatMonthYear(),
      rangeLabel: rangeMeta?.label,
      summary: {
        total: overview.total,
        target: overview.target,
        balance: overview.balance,
        progress: overview.progress,
        month: overview.month,
      },
      categories: feeCategories.map((c) => ({ label: c.label, amount: c.amount, percent: c.percent })),
      defaulters: allFeeDefaulters,
      includeDefaulters: rangeMeta?.includeDefaulters ?? false,
    };
  };

  const handleDownload = async (custom = false) => {
    if (downloading) return;
    setDownloading(true);
    const range = custom ? customRange : 'month';
    const title = custom ? 'Custom Finance Report' : 'Monthly Fee Collection Report';
    try {
      await shareFinanceReportAsPdf(buildReportInput(range, title));
      setShowDownload(false);
      setShowCustomDownload(false);
      if (custom) {
        Alert.alert('Report ready', 'Custom finance report exported successfully.');
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleQuickAction = (key: QuickAction) => {
    switch (key) {
      case 'report':
        handleDownload(false);
        break;
      case 'reminder':
        if (unremindedCount === 0) {
          Alert.alert('Already sent', 'All listed defaulters have been reminded this week.');
          return;
        }
        Alert.alert(
          'Send fee reminders?',
          `SMS and email will be sent to ${unremindedCount} parent account${unremindedCount === 1 ? '' : 's'}.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Send now',
              onPress: () => {
                setDefaulters((prev) => prev.map((d) => ({ ...d, reminded: true })));
                Alert.alert('Reminders sent', `${unremindedCount} fee reminder${unremindedCount === 1 ? '' : 's'} delivered.`);
              },
            },
          ],
        );
        break;
      case 'concession':
        setShowConcessions(true);
        break;
      case 'scholarship':
        setShowScholarships(true);
        break;
      default:
        break;
    }
  };

  const handleConcession = (id: string, decision: 'approved' | 'rejected') => {
    setConcessions((prev) => prev.map((c) => (c.id === id ? { ...c, status: decision } : c)));
    Alert.alert(decision === 'approved' ? 'Concession approved' : 'Concession rejected', 'Parent will be notified.');
  };

  return (
    <>
      <ScreenShell
        scroll={false}
        paddingBottom={0}
        header={
          <PrincipalHeader
            title="Fee & Finance"
            onBack={() => navigation.goBack()}
            right={
              <View style={styles.headerRight}>
                <TouchableOpacity onPress={() => setShowDownload(true)} activeOpacity={0.7} hitSlop={8}>
                  <MaterialIcons name="download" size={22} color={colors.onSurfaceVariant} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowFilter(true)} activeOpacity={0.7} hitSlop={8}>
                  <MaterialIcons name="filter-list" size={22} color={colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>
            }
          />
        }
      >
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Text style={styles.heroLbl}>Total Collection {overview.month}</Text>
            <Text style={styles.heroVal}>{overview.total}</Text>
            <ProgressBar percent={overview.progress} color={colors.onPrimary} height={10} />
            <View style={styles.heroMeta}>
              <Text style={styles.heroMetaText}>Target {overview.target}</Text>
              <Text style={styles.heroMetaText}>Balance {overview.balance}</Text>
            </View>
            <Text style={styles.heroPct}>{overview.progress}% collected</Text>
          </View>

          {categoryFilter !== 'All' ? (
            <Text style={styles.filterHint}>Showing: {categoryFilter} only</Text>
          ) : null}

          <Text style={styles.sectionTitle}>Monthly Collection Trend</Text>
          <Card style={styles.chartCard}>
            <View style={styles.areaBars}>
              {[40, 55, 48, 62, 58, 76].map((h, i) => (
                <View key={i} style={[styles.areaBar, { height: h }]} />
              ))}
            </View>
          </Card>

          <Text style={styles.sectionTitle}>By Fee Category</Text>
          {visibleCategories.map((c) => (
            <View key={c.label} style={styles.catRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.catLabel}>{c.label}</Text>
                <Text style={styles.catAmount}>{c.amount}</Text>
              </View>
              <View style={styles.catBarTrack}>
                <View style={[styles.catBarFill, { width: `${c.percent}%`, backgroundColor: c.color }]} />
              </View>
              <Text style={styles.catPct}>{c.percent}%</Text>
            </View>
          ))}

          <Text style={styles.sectionTitle}>Fee Defaulters</Text>
          {defaulters.map((d) => (
            <Card key={d.id} style={styles.defCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.defName}>{d.name}</Text>
                <Text style={styles.defMeta}>
                  {d.class} · {d.days} days overdue
                  {d.reminded ? ' · Reminded' : ''}
                </Text>
              </View>
              <Text style={styles.defAmount}>{d.amount}</Text>
            </Card>
          ))}
          <TouchableOpacity onPress={() => setShowDefaulters(true)} activeOpacity={0.7}>
            <Text style={styles.viewAll}>View all {allFeeDefaulters.length} defaulters →</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            {QUICK_ACTIONS.map((a) => (
              <TouchableOpacity
                key={a.key}
                style={styles.actionTile}
                onPress={() => handleQuickAction(a.key)}
                activeOpacity={0.7}
              >
                <MaterialIcons name={a.icon} size={20} color={colors.primary} />
                <Text style={styles.actionText}>{a.label}</Text>
                {a.key === 'concession' && pendingConcessions.length > 0 ? (
                  <View style={styles.actionBadge}>
                    <Text style={styles.actionBadgeText}>{pendingConcessions.length}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </ScreenShell>

      {/* Download */}
      <Modal visible={showDownload} transparent animationType="fade" onRequestClose={() => setShowDownload(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowDownload(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Download Report</Text>
            <Text style={styles.sheetSub}>Export fee collection for {overview.month}</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => handleDownload(false)} disabled={downloading}>
              {downloading ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <>
                  <MaterialIcons name="picture-as-pdf" size={20} color={colors.onPrimary} />
                  <Text style={styles.primaryBtnText}>Monthly report (PDF)</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => {
                setShowDownload(false);
                setShowCustomDownload(true);
              }}
            >
              <Text style={styles.secondaryBtnText}>Custom download</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Custom download */}
      <Modal visible={showCustomDownload} transparent animationType="slide" onRequestClose={() => setShowCustomDownload(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowCustomDownload(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>Custom Download</Text>
              <TouchableOpacity onPress={() => setShowCustomDownload(false)}>
                <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            {FINANCE_REPORT_RANGES.map((r) => (
              <TouchableOpacity
                key={r.id}
                style={[styles.rangeOption, customRange === r.id && styles.rangeActive]}
                onPress={() => setCustomRange(r.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.rangeTitle}>{r.label}</Text>
                <Text style={styles.rangeSub}>
                  {r.includeDefaulters ? 'Includes defaulter list' : 'Summary & categories only'}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.primaryBtn} onPress={() => handleDownload(true)} disabled={downloading}>
              {downloading ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <>
                  <MaterialIcons name="download" size={20} color={colors.onPrimary} />
                  <Text style={styles.primaryBtnText}>Generate & download PDF</Text>
                </>
              )}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Category filter */}
      <Modal visible={showFilter} transparent animationType="fade" onRequestClose={() => setShowFilter(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowFilter(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Filter by category</Text>
            {(['All', ...feeCategories.map((c) => c.label)] as CategoryFilter[]).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.rangeOption, categoryFilter === f && styles.rangeActive]}
                onPress={() => {
                  setCategoryFilter(f);
                  setShowFilter(false);
                }}
              >
                <Text style={styles.rangeTitle}>{f === 'All' ? 'All categories' : f}</Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {/* All defaulters */}
      <Modal visible={showDefaulters} transparent animationType="slide" onRequestClose={() => setShowDefaulters(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowDefaulters(false)}>
          <Pressable style={[styles.sheet, styles.tallSheet]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>All Defaulters ({allFeeDefaulters.length})</Text>
              <TouchableOpacity onPress={() => setShowDefaulters(false)}>
                <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {allFeeDefaulters.map((d) => (
                <View key={d.id} style={styles.listRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.defName}>{d.name}</Text>
                    <Text style={styles.defMeta}>{d.class} · {d.days} days</Text>
                  </View>
                  <Text style={styles.defAmount}>{d.amount}</Text>
                </View>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Concessions */}
      <Modal visible={showConcessions} transparent animationType="slide" onRequestClose={() => setShowConcessions(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowConcessions(false)}>
          <Pressable style={[styles.sheet, styles.tallSheet]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>Concession Requests</Text>
              <TouchableOpacity onPress={() => setShowConcessions(false)}>
                <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {concessions.map((c) => (
                <Card key={c.id} style={styles.listCard}>
                  <Text style={styles.defName}>{c.student} · {c.class}</Text>
                  <Text style={styles.defMeta}>{c.reason}</Text>
                  <Text style={styles.defAmount}>{c.amount}</Text>
                  {c.status === 'pending' ? (
                    <View style={styles.decisionRow}>
                      <TouchableOpacity style={styles.rejectBtn} onPress={() => handleConcession(c.id, 'rejected')}>
                        <Text style={styles.rejectText}>Reject</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.approveBtn} onPress={() => handleConcession(c.id, 'approved')}>
                        <Text style={styles.approveText}>Approve</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text style={[styles.statusText, c.status === 'approved' && { color: colors.primary }]}>
                      {c.status === 'approved' ? 'Approved' : 'Rejected'}
                    </Text>
                  )}
                </Card>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Scholarships */}
      <Modal visible={showScholarships} transparent animationType="slide" onRequestClose={() => setShowScholarships(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowScholarships(false)}>
          <Pressable style={[styles.sheet, styles.tallSheet]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>Scholarship List</Text>
              <TouchableOpacity onPress={() => setShowScholarships(false)}>
                <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {scholarshipList.map((s) => (
                <View key={s.id} style={styles.listRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.defName}>{s.student}</Text>
                    <Text style={styles.defMeta}>{s.class} · {s.type} · {s.term}</Text>
                  </View>
                  <Text style={[styles.defAmount, { color: colors.primary }]}>{s.amount}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => shareFinanceReportAsPdf({
                ...buildReportInput('term', 'Scholarship Summary Report'),
                categories: scholarshipList.map((s) => ({
                  label: `${s.student} (${s.type})`,
                  amount: s.amount,
                  percent: 0,
                })),
                includeDefaulters: false,
              })}
            >
              <Text style={styles.primaryBtnText}>Export scholarship list (PDF)</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

    </>
  );
}

function createStyles(colors: PrincipalColorScheme) {
  return StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.gutter, gap: spacing.md, paddingBottom: 100 },
  headerRight: { flexDirection: 'row', gap: 12 },
  hero: { backgroundColor: colors.primaryContainer, borderRadius: 16, padding: spacing.md, gap: 8 },
  heroLbl: { ...textStyle('labelMd'), color: '#e0fff5' },
  heroVal: { fontSize: 28, fontWeight: '700', color: colors.onPrimary },
  heroMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  heroMetaText: { ...textStyle('chip10'), color: '#e0fff5' },
  heroPct: { ...textStyle('bodyMd'), color: colors.onPrimary, fontWeight: '700' },
  filterHint: { ...textStyle('labelMd'), color: colors.primary, fontWeight: '600' },
  sectionTitle: { ...textStyle('titleLg'), fontWeight: '600' },
  chartCard: { alignItems: 'center', paddingVertical: 20 },
  areaBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 80 },
  areaBar: { width: 24, backgroundColor: colors.primaryContainer, borderTopLeftRadius: 6, borderTopRightRadius: 6, opacity: 0.85 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  catLabel: { ...textStyle('bodyMd'), fontWeight: '600' },
  catAmount: { ...textStyle('chip10'), color: colors.onSurfaceVariant },
  catBarTrack: { width: 80, height: 8, backgroundColor: colors.surfaceVariant, borderRadius: 4, overflow: 'hidden' },
  catBarFill: { height: 8, borderRadius: 4 },
  catPct: { ...textStyle('chip10'), fontWeight: '700', width: 32, textAlign: 'right' },
  defCard: { flexDirection: 'row', alignItems: 'center' },
  defName: { ...textStyle('bodyMd'), fontWeight: '700' },
  defMeta: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  defAmount: { ...textStyle('bodyMd'), fontWeight: '700', color: colors.orange500 },
  viewAll: { ...textStyle('labelMd'), color: colors.primary, fontWeight: '700' },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  actionTile: {
    width: '48%',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
    gap: 6,
    position: 'relative',
  },
  actionText: { ...textStyle('labelMd'), fontWeight: '600' },
  actionBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBadgeText: { ...textStyle('chip10'), color: colors.onError, fontSize: 9 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.gutter,
    paddingBottom: spacing.lg,
  },
  tallSheet: { maxHeight: '80%' },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sheetTitle: { ...textStyle('titleLg'), fontWeight: '700' },
  sheetSub: { ...textStyle('labelMd'), color: colors.onSurfaceVariant, marginBottom: spacing.md },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primaryContainer,
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: spacing.sm,
  },
  primaryBtnText: { ...textStyle('bodyMd'), color: colors.onPrimary, fontWeight: '700' },
  secondaryBtn: { alignItems: 'center', paddingVertical: 14 },
  secondaryBtnText: { ...textStyle('bodyMd'), color: colors.primary, fontWeight: '600' },
  rangeOption: {
    padding: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginBottom: spacing.sm,
  },
  rangeActive: { borderColor: colors.primaryContainer, backgroundColor: `${colors.primaryContainer}18` },
  rangeTitle: { ...textStyle('bodyMd'), fontWeight: '700' },
  rangeSub: { ...textStyle('labelMd'), color: colors.onSurfaceVariant, marginTop: 2 },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  listCard: { marginBottom: spacing.sm, gap: 4 },
  decisionRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  rejectBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: colors.error },
  rejectText: { ...textStyle('labelMd'), color: colors.error, fontWeight: '700' },
  approveBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, backgroundColor: colors.primaryContainer },
  approveText: { ...textStyle('labelMd'), color: colors.onPrimary, fontWeight: '700' },
  statusText: { ...textStyle('labelMd'), color: colors.onSurfaceVariant, fontWeight: '600', marginTop: 4 },
});
}
