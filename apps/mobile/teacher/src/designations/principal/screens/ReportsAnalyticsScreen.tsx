import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenShell } from '../components/ScreenShell';
import { Card } from '../components/ui';
import {
  categoryReportCatalog,
  feeCategories,
  financeOverview,
  gradePerformance,
  initialResultsStatus,
  quickDownloads,
  reportCategories,
  scheduledReports as initialScheduled,
  type QuickDownloadReport,
  type ReportCategory,
  type ReportCategoryId,
  type ScheduledReport,
} from '../data/mockData';
import { handlePrincipalTabPress } from '../navigation/navigationHelpers';
import type { PrincipalColorScheme } from '@/designations/principal/theme/colors';
import type { PrincipalStackParamList } from '../navigation/types';
import { SCHOOL_NAME } from '@/constants/school';
import { buildReportFilename, shareSchoolReportAsPdf, type SchoolReportInput } from '@/utils/reportsPdf';
import { formatMonthYear } from '@/utils/datetime';
import { spacing, textStyle, usePrincipalTheme, useThemedStyles } from '@/designations/principal/theme';

type FilterKey = 'all' | ReportCategoryId;

function buildQuickDownloadPayload(report: QuickDownloadReport): SchoolReportInput {
  if (report.id === 'qd1') {
    return {
      title: report.title,
      periodLabel: report.date,
      summary: report.summary,
      metrics: [
        { label: 'Attendance Rate', value: '94.8%' },
        { label: 'Present', value: '1,174' },
        { label: 'Absent', value: '52' },
        { label: 'On Leave', value: '22' },
      ],
      tables: [
        {
          heading: 'Class-wise Attendance',
          columns: ['Class', 'Present', 'Absent', 'Rate'],
          rows: [
            ['G6A', '38', '2', '95%'],
            ['G7A', '40', '0', '100%'],
            ['G9C', '30', '10', '75%'],
            ['Staff', '87', '5', '95%'],
          ],
        },
      ],
    };
  }
  if (report.id === 'qd2') {
    return {
      title: report.title,
      periodLabel: report.date,
      summary: report.summary,
      metrics: [
        { label: 'School Average', value: '82.4%' },
        { label: 'Pass Rate', value: '94.2%' },
        { label: 'Grades Covered', value: String(gradePerformance.length) },
      ],
      tables: [
        {
          heading: 'Grade Performance',
          columns: ['Grade', 'Average', 'Pass Rate', 'Trend'],
          rows: gradePerformance.map((g) => [g.grade, g.avg, g.pass, g.trend === 'up' ? '↑' : g.trend === 'down' ? '↓' : '→']),
        },
        {
          heading: 'Results Upload Status',
          columns: ['Grade', 'Progress', 'Status'],
          rows: initialResultsStatus.map((r) => [r.grade, `${r.percent}%`, r.label]),
        },
      ],
    };
  }
  return {
    title: report.title,
    periodLabel: report.date,
    summary: report.summary,
    metrics: [
      { label: 'Collected', value: financeOverview.total },
      { label: 'Target', value: financeOverview.target },
      { label: 'Progress', value: `${financeOverview.progress}%` },
      { label: 'Balance', value: financeOverview.balance },
    ],
    tables: [
      {
        heading: 'Collection by Category',
        columns: ['Category', 'Amount', 'Share'],
        rows: feeCategories.map((c) => [c.label, c.amount, `${c.percent}%`]),
      },
    ],
  };
}

function buildCategoryPayload(category: ReportCategory, itemTitle: string): SchoolReportInput {
  const catalog = categoryReportCatalog[category.id].find((c) => c.title === itemTitle);
  return {
    title: itemTitle,
    periodLabel: formatMonthYear(),
    summary: catalog?.description ?? `${category.label} intelligence report`,
    metrics: [
      { label: 'Category', value: category.label },
      { label: 'Reports', value: String(category.count) },
      { label: 'Academic Year', value: '2025–26' },
    ],
    tables: [
      {
        heading: 'Report Contents',
        columns: ['Section', 'Detail'],
        rows: [
          ['Prepared for', 'Principal Office'],
          ['School', SCHOOL_NAME],
          ['Generated', new Date().toLocaleDateString('en-IN')],
        ],
      },
    ],
  };
}

function buildScheduledPayload(report: ScheduledReport): SchoolReportInput {
  return {
    title: report.title,
    periodLabel: formatMonthYear(),
    summary: `Scheduled ${report.frequency.toLowerCase()} report — ${report.schedule}`,
    metrics: [
      { label: 'Frequency', value: report.frequency },
      { label: 'Next Run', value: report.nextRun },
      { label: 'Status', value: report.enabled ? 'Active' : 'Paused' },
    ],
    tables: [
      {
        heading: 'Delivery Summary',
        columns: ['Field', 'Value'],
        rows: [
          ['Recipient', 'Principal & Admin Office'],
          ['Format', 'PDF'],
          ['Category', report.category],
        ],
      },
    ],
  };
}

export function ReportsAnalyticsScreen() {
  const { colors } = usePrincipalTheme();
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<NativeStackNavigationProp<PrincipalStackParamList>>();
  const [scheduled, setScheduled] = useState(initialScheduled);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [categoryModal, setCategoryModal] = useState<ReportCategory | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const filteredDownloads = useMemo(() => {
    if (filter === 'all') return quickDownloads;
    return quickDownloads.filter((d) => d.category === filter);
  }, [filter]);

  const intelligenceRows = useMemo(() => {
    const rows: ReportCategory[][] = [];
    for (let i = 0; i < reportCategories.length; i += 2) {
      rows.push(reportCategories.slice(i, i + 2));
    }
    return rows;
  }, []);

  const runDownload = async (id: string, payload: SchoolReportInput, period?: string) => {
    if (downloadingId) return;
    setDownloadingId(id);
    const filename = buildReportFilename(payload.title, period ?? payload.periodLabel);
    try {
      await shareSchoolReportAsPdf(payload, filename);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleQuickDownload = (report: QuickDownloadReport) => {
    runDownload(report.id, buildQuickDownloadPayload(report), report.date);
  };

  const handleCategoryReport = (category: ReportCategory, itemTitle: string) => {
    const payload = buildCategoryPayload(category, itemTitle);
    runDownload(`${category.id}-${itemTitle}`, payload);
  };

  const handleScheduledToggle = (id: string, enabled: boolean) => {
    setScheduled((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return { ...item, enabled };
      }),
    );
    const item = scheduled.find((s) => s.id === id);
    if (!item) return;
    Alert.alert(
      enabled ? 'Schedule enabled' : 'Schedule paused',
      enabled
        ? `"${item.title}" will run ${item.schedule.toLowerCase()}.`
        : `"${item.title}" will not run until re-enabled.`,
    );
  };

  const handleRunScheduledNow = (report: ScheduledReport) => {
    if (!report.enabled) {
      Alert.alert('Schedule paused', 'Enable this schedule first, then run the report.');
      return;
    }
    runDownload(report.id, buildScheduledPayload(report));
  };

  const handleShareHub = async () => {
    await runDownload('hub-snapshot', {
      title: 'Intelligence Hub Snapshot',
      periodLabel: formatMonthYear(),
      summary: `Cross-category report index for ${SCHOOL_NAME}.`,
      metrics: reportCategories.map((c) => ({ label: c.label, value: `${c.count} reports` })),
      tables: [
        {
          heading: 'Available Quick Downloads',
          columns: ['Report', 'Period'],
          rows: quickDownloads.map((d) => [d.title, d.date]),
        },
      ],
    });
  };

  const filterLabel = filter === 'all' ? 'All' : reportCategories.find((c) => c.id === filter)?.label ?? 'All';

  return (
    <>
      <ScreenShell
        scroll={false}
        paddingBottom={0}
        activeTab="reports"
        onTabPress={(t) => handlePrincipalTabPress(navigation, t)}
        header={
          <View style={styles.topBar}>
            <View style={styles.topLeft}>
              <MaterialIcons name="analytics" size={22} color={colors.primaryContainer} />
              <Text style={styles.topTitle}>Reports & Analytics</Text>
            </View>
            <View style={styles.topRight}>
              <TouchableOpacity onPress={() => setFilterOpen(true)} activeOpacity={0.7} hitSlop={8}>
                <MaterialIcons name="filter-list" size={22} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShareHub} activeOpacity={0.7} hitSlop={8} disabled={!!downloadingId}>
                <MaterialIcons name="share" size={22} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          </View>
        }
      >
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hubCard}>
            <View style={styles.hubHead}>
              <View>
                <Text style={styles.hubTitle}>Intelligence Hub</Text>
                <Text style={styles.hubSub}>Academic Year 2025–26 · {formatMonthYear()}</Text>
              </View>
              <View style={styles.hubBadge}>
                <MaterialIcons name="insights" size={18} color={colors.onPrimary} />
              </View>
            </View>
            <Text style={styles.hubHint}>Browse reports by category. Tap a tile to view and download.</Text>
          </View>

          <View style={styles.intelligenceGrid}>
            {intelligenceRows.map((row, rowIndex) => (
              <View key={`row-${rowIndex}`} style={styles.intelligenceRow}>
                {row.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.intelCard}
                    activeOpacity={0.7}
                    onPress={() => setCategoryModal(c)}
                  >
                    <View style={[styles.intelIcon, { backgroundColor: `${c.color}22` }]}>
                      <MaterialIcons name={c.icon} size={24} color={c.color} />
                    </View>
                    <Text style={styles.intelLabel}>{c.label}</Text>
                    <Text style={styles.intelCount}>{c.count} reports</Text>
                    <Text style={styles.intelDesc} numberOfLines={2}>{c.description}</Text>
                  </TouchableOpacity>
                ))}
                {row.length === 1 ? <View style={styles.intelSpacer} /> : null}
              </View>
            ))}
          </View>

          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Quick Downloads</Text>
            {filter !== 'all' ? (
              <TouchableOpacity onPress={() => setFilter('all')}>
                <Text style={styles.filterChip}>{filterLabel} ×</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {filteredDownloads.map((d) => (
            <TouchableOpacity key={d.id} activeOpacity={0.7} onPress={() => handleQuickDownload(d)}>
              <Card style={styles.downloadCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.downloadTitle}>{d.title}</Text>
                  <Text style={styles.downloadMeta}>{d.format} · {d.date}</Text>
                  <Text style={styles.downloadSummary} numberOfLines={2}>{d.summary}</Text>
                  <Text style={styles.filenamePreview}>{buildReportFilename(d.title, d.date)}</Text>
                </View>
                {downloadingId === d.id ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <MaterialIcons name="download" size={22} color={colors.primary} />
                )}
              </Card>
            </TouchableOpacity>
          ))}

          <Text style={styles.sectionTitle}>Scheduled Reports</Text>
          {scheduled.map((s) => (
            <Card key={s.id} style={styles.schedCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.schedTitle}>{s.title}</Text>
                <Text style={styles.schedMeta}>{s.schedule}</Text>
                <Text style={styles.schedNext}>Next: {s.nextRun}</Text>
              </View>
              <View style={styles.schedActions}>
                <TouchableOpacity
                  style={[styles.runBtn, (!s.enabled || !!downloadingId) && styles.runBtnDisabled]}
                  onPress={() => handleRunScheduledNow(s)}
                  activeOpacity={0.7}
                  disabled={!!downloadingId}
                >
                  {downloadingId === s.id ? (
                    <ActivityIndicator size="small" color={colors.onPrimary} />
                  ) : (
                    <Text style={styles.runBtnText}>Run now</Text>
                  )}
                </TouchableOpacity>
                <Switch
                  value={s.enabled}
                  onValueChange={(v) => handleScheduledToggle(s.id, v)}
                  trackColor={{ true: colors.primaryContainer, false: colors.outlineVariant }}
                />
              </View>
            </Card>
          ))}
        </ScrollView>
      </ScreenShell>

      {/* Category catalog */}
      <Modal visible={!!categoryModal} transparent animationType="slide" onRequestClose={() => setCategoryModal(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setCategoryModal(null)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            {categoryModal ? (
              <>
                <View style={styles.modalHead}>
                  <Text style={styles.modalTitle}>{categoryModal.label} Reports</Text>
                  <TouchableOpacity onPress={() => setCategoryModal(null)}>
                    <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalSub}>{categoryModal.description}</Text>
                {categoryReportCatalog[categoryModal.id].map((item) => (
                  <TouchableOpacity
                    key={item.title}
                    style={styles.catalogRow}
                    onPress={() => {
                      handleCategoryReport(categoryModal, item.title);
                      setCategoryModal(null);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.catalogTitle}>{item.title}</Text>
                      <Text style={styles.catalogDesc}>{item.description}</Text>
                    </View>
                    <MaterialIcons name="download" size={20} color={colors.primary} />
                  </TouchableOpacity>
                ))}
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Filter */}
      <Modal visible={filterOpen} transparent animationType="fade" onRequestClose={() => setFilterOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setFilterOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Filter Quick Downloads</Text>
            {(['all', ...reportCategories.map((c) => c.id)] as FilterKey[]).map((key) => (
              <TouchableOpacity
                key={key}
                style={[styles.filterOption, filter === key && styles.filterOptionActive]}
                onPress={() => {
                  setFilter(key);
                  setFilterOpen(false);
                }}
              >
                <Text style={styles.filterOptionText}>
                  {key === 'all' ? 'All categories' : reportCategories.find((c) => c.id === key)?.label}
                </Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function createStyles(colors: PrincipalColorScheme) {
  return StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.gutter,
    minHeight: spacing.headerHeight,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    backgroundColor: colors.surface,
  },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  topTitle: { ...textStyle('headlineMd'), fontWeight: '700' },
  topRight: { flexDirection: 'row', gap: 12 },
  scroll: { flex: 1 },
  content: { padding: spacing.gutter, gap: spacing.md, paddingBottom: 32 },
  hubCard: {
    backgroundColor: colors.primaryContainer,
    borderRadius: 16,
    padding: spacing.md,
    gap: 8,
  },
  hubHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  hubTitle: { ...textStyle('headlineMd'), fontWeight: '700', color: colors.onPrimary },
  hubSub: { ...textStyle('labelMd'), color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  hubBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubHint: { ...textStyle('labelMd'), color: 'rgba(255,255,255,0.9)' },
  intelligenceGrid: { gap: spacing.sm },
  intelligenceRow: { flexDirection: 'row', gap: spacing.sm },
  intelCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
    gap: 6,
    minHeight: 148,
  },
  intelSpacer: { flex: 1 },
  intelIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  intelLabel: { ...textStyle('bodyMd'), fontWeight: '700' },
  intelCount: { ...textStyle('chip10'), color: colors.primary, fontWeight: '700' },
  intelDesc: { ...textStyle('chip10'), color: colors.onSurfaceVariant, lineHeight: 14 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  sectionTitle: { ...textStyle('titleLg'), fontWeight: '600' },
  filterChip: { ...textStyle('labelMd'), color: colors.primary, fontWeight: '700' },
  downloadCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  downloadTitle: { ...textStyle('bodyMd'), fontWeight: '600' },
  downloadMeta: { ...textStyle('chip10'), color: colors.onSurfaceVariant },
  downloadSummary: { ...textStyle('labelMd'), color: colors.onSurfaceVariant, marginTop: 4 },
  filenamePreview: { ...textStyle('chip10'), color: colors.primary, marginTop: 4, fontWeight: '600' },
  schedCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  schedTitle: { ...textStyle('bodyMd'), fontWeight: '600' },
  schedMeta: { ...textStyle('chip10'), color: colors.onSurfaceVariant },
  schedNext: { ...textStyle('chip10'), color: colors.primary, fontWeight: '600', marginTop: 2 },
  schedActions: { alignItems: 'flex-end', gap: 8 },
  runBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.primaryContainer,
  },
  runBtnDisabled: { opacity: 0.45 },
  runBtnText: { ...textStyle('chip10'), color: colors.onPrimary, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.gutter,
    paddingBottom: spacing.lg,
    maxHeight: '80%',
  },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { ...textStyle('titleLg'), fontWeight: '700', flex: 1 },
  modalSub: { ...textStyle('labelMd'), color: colors.onSurfaceVariant, marginBottom: spacing.md },
  catalogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  catalogTitle: { ...textStyle('bodyMd'), fontWeight: '600' },
  catalogDesc: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  filterOption: {
    padding: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginBottom: spacing.sm,
  },
  filterOptionActive: { borderColor: colors.primaryContainer, backgroundColor: `${colors.primaryContainer}18` },
  filterOptionText: { ...textStyle('bodyMd'), fontWeight: '600' },
});
}
