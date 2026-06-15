import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  RefreshControl,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { PrincipalHeader } from '../components/PrincipalHeader';
import { ScreenShell } from '../components/ScreenShell';
import { Card, ProgressBar } from '../components/ui';
import { classAttendance, chronicAbsentees, type ClassAttendanceRow } from '../data/mockData';
import {
  addDays,
  formatLongDate,
  formatWeekdayLetter,
  getWeekDays,
  isSameCalendarDay,
  isSunday,
  startOfDay,
  startOfWeekMonday,
} from '@/utils/datetime';
import { shareAttendanceReportAsPdf } from '@/utils/attendancePdf';
import { spacing, textStyle, usePrincipalTheme, useThemedStyles } from '@/designations/principal/theme';
import type { PrincipalColorScheme } from '@/designations/principal/theme/colors';

const CLASS_FILTERS = ['All Classes', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Staff'] as const;
type ClassFilter = (typeof CLASS_FILTERS)[number];
type ViewFilter = 'all' | 'alerts' | 'perfect';

const CUSTOM_RANGES = [
  { id: '7d', label: 'Last 7 days', days: 7 },
  { id: '30d', label: 'Last 30 days', days: 30 },
  { id: 'term', label: 'This term', days: 90 },
] as const;

function summaryForDate(date: Date, jitter = 0) {
  const seed = date.getDate() + date.getMonth() * 3 + jitter;
  const absent = 48 + (seed % 8);
  const late = 18 + (seed % 6);
  const present = 1180 - absent;
  const rate = ((present / (present + absent)) * 100).toFixed(1);
  return { present, absent, late, leave: seed % 3, rate: `${rate}%` };
}

function monthGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const startPad = first.getDay() === 0 ? 6 : first.getDay() - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = Array.from({ length: startPad }, () => null);
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push(new Date(year, month, d));
  }
  return cells;
}

export function AttendanceOverviewScreen() {
  const { colors } = usePrincipalTheme();
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation();
  const today = useMemo(() => startOfDay(new Date()), []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(today));
  const [classFilter, setClassFilter] = useState<ClassFilter>('All Classes');
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showCustomReport, setShowCustomReport] = useState(false);
  const [customRangeId, setCustomRangeId] = useState<(typeof CUSTOM_RANGES)[number]['id']>('30d');
  const [downloading, setDownloading] = useState(false);
  const [notifiedIds, setNotifiedIds] = useState<Set<string>>(new Set());
  const [summary, setSummary] = useState(() => summaryForDate(today));
  const [refreshing, setRefreshing] = useState(false);

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const ratePercent = parseFloat(summary.rate);

  useEffect(() => {
    setSummary(summaryForDate(selectedDate));
  }, [selectedDate]);

  const handlePullRefresh = useCallback(() => {
    if (refreshing) return;
    setRefreshing(true);
    setTimeout(() => {
      setSummary(summaryForDate(selectedDate, Math.floor(Math.random() * 5)));
      setRefreshing(false);
    }, 700);
  }, [refreshing, selectedDate]);

  const visibleRows = useMemo(() => {
    let rows: ClassAttendanceRow[] = classAttendance;
    if (classFilter !== 'All Classes') {
      rows = rows.filter((r) => r.grade === classFilter);
    }
    if (viewFilter === 'alerts') {
      rows = rows.filter((r) => r.alert);
    }
    if (viewFilter === 'perfect') {
      rows = rows.filter((r) => r.rate === 100);
    }
    return rows;
  }, [classFilter, viewFilter]);

  const calendarMonth = selectedDate.getMonth();
  const calendarYear = selectedDate.getFullYear();
  const calendarCells = useMemo(() => monthGrid(calendarYear, calendarMonth), [calendarYear, calendarMonth]);

  const viewFilterLabel =
    viewFilter === 'alerts' ? 'Alerts only' : viewFilter === 'perfect' ? '100% attendance' : 'All classes';

  const handlePrevWeek = () => setWeekStart((w) => addDays(w, -7));
  const handleNextWeek = () => setWeekStart((w) => addDays(w, 7));

  const handleDownload = async (custom = false) => {
    if (downloading) return;
    setDownloading(true);
    const range = CUSTOM_RANGES.find((r) => r.id === customRangeId);
    const title = custom ? 'Custom Attendance Report' : 'Daily Attendance Report';
    const rangeLabel = custom && range ? range.label : undefined;
    try {
      await shareAttendanceReportAsPdf({
        title,
        dateLabel: formatLongDate(selectedDate),
        rangeLabel,
        summary,
        rows: visibleRows.map((r) => ({ class: r.class, present: r.present, absent: r.absent, rate: r.rate })),
      });
      setShowDownloadModal(false);
      setShowCustomReport(false);
      if (custom) {
        Alert.alert('Report ready', `${range?.label ?? 'Custom'} attendance report exported.`);
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleNotify = (id: string, name: string) => {
    setNotifiedIds((prev) => new Set(prev).add(id));
    Alert.alert('Parent notified', `SMS and email sent to the parent of ${name}.`);
  };

  return (
    <ScreenShell
      header={
        <PrincipalHeader
          title="Attendance Overview"
          onBack={() => navigation.goBack()}
          right={
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={() => setShowFilterModal(true)} activeOpacity={0.7} hitSlop={8}>
                <MaterialIcons name="tune" size={22} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowDownloadModal(true)} activeOpacity={0.7} hitSlop={8}>
                <MaterialIcons name="download" size={22} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          }
        />
      }
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handlePullRefresh}
            tintColor={colors.primary}
            colors={[colors.primaryContainer]}
            progressBackgroundColor={colors.surfaceContainerLowest}
            title={Platform.OS === 'ios' ? 'Pull to refresh' : undefined}
            titleColor={colors.onSurfaceVariant}
          />
        }
      >
        <View style={styles.dateNav}>
          <TouchableOpacity onPress={handlePrevWeek} style={styles.weekArrow} activeOpacity={0.7}>
            <MaterialIcons name="chevron-left" size={24} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayRow}>
            {weekDays.map((day) => {
              const active = isSameCalendarDay(day, selectedDate);
              const isToday = isSameCalendarDay(day, today);
              const sunday = isSunday(day);
              return (
                <TouchableOpacity
                  key={day.toISOString()}
                  style={[styles.dayChip, active && styles.dayActive, sunday && !active && styles.daySun]}
                  onPress={() => setSelectedDate(startOfDay(day))}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dayLbl, active && styles.dayTextActive]}>{formatWeekdayLetter(day)}</Text>
                  <Text style={[styles.dayNum, active && styles.dayTextActive]}>{day.getDate()}</Text>
                  {isToday ? <View style={[styles.todayDot, active && styles.todayDotActive]} /> : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity onPress={handleNextWeek} style={styles.weekArrow} activeOpacity={0.7}>
            <MaterialIcons name="chevron-right" size={24} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowCalendar(true)} style={styles.calBtn} activeOpacity={0.7}>
            <MaterialIcons name="calendar-month" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.dateLine}>{formatLongDate(selectedDate)}</Text>
        {isSunday(selectedDate) ? (
          <Text style={styles.holidayNote}>Sunday — no student attendance recorded.</Text>
        ) : null}

        <Card style={styles.summaryCard}>
          <View style={styles.summaryGrid}>
            <SummaryItem label="Present" value={String(summary.present)} />
            <SummaryItem label="Absent" value={String(summary.absent)} color={colors.error} />
            <SummaryItem label="Late" value={String(summary.late)} color={colors.amber600} />
            <SummaryItem label="Leave" value={String(summary.leave)} />
          </View>
          <Text style={styles.rateLabel}>Attendance Rate</Text>
          <Text style={styles.rateValue}>{summary.rate}</Text>
          <ProgressBar percent={ratePercent} color={colors.primaryContainer} height={10} />
        </Card>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {CLASS_FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.chip, classFilter === f && styles.chipActive]}
              onPress={() => setClassFilter(f)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, classFilter === f && styles.chipTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {viewFilter !== 'all' ? (
          <Text style={styles.filterHint}>Showing: {viewFilterLabel}</Text>
        ) : null}

        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <View style={styles.tableHead}>
            <Text style={[styles.th, { flex: 1 }]}>Class</Text>
            <Text style={styles.th}>Present</Text>
            <Text style={styles.th}>Absent</Text>
            <Text style={styles.th}>Rate</Text>
            <Text style={styles.thAct}> </Text>
          </View>
          {visibleRows.length === 0 ? (
            <Text style={styles.emptyTable}>No classes match the current filters.</Text>
          ) : (
            visibleRows.map((row) => (
              <View key={row.class} style={[styles.tableRow, row.rate === 100 && styles.rowGreen, row.alert && styles.rowAmber]}>
                <Text style={[styles.td, { flex: 1, fontWeight: '700' }]}>{row.class}</Text>
                <Text style={styles.td}>{row.present}</Text>
                <Text style={styles.td}>{row.absent}</Text>
                <Text style={[styles.td, { fontWeight: '700', color: row.alert ? colors.amber700 : colors.primary }]}>
                  {row.rate}%
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      row.alert ? 'Low attendance alert' : `${row.class} details`,
                      row.alert
                        ? `${row.class} is at ${row.rate}% today. Notify class teacher?`
                        : `${row.present} present · ${row.absent} absent · ${row.rate}% rate`,
                    )
                  }
                  activeOpacity={0.7}
                >
                  <Text style={[styles.actionText, row.alert && { color: colors.amber700 }]}>{row.alert ? 'Alert' : 'View'}</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </Card>

        <Text style={styles.sectionTitle}>30-Day Trend</Text>
        <Card style={styles.chartPlaceholder}>
          <View style={styles.trendBars}>
            {Array.from({ length: 10 }).map((_, i) => (
              <View key={i} style={[styles.trendBar, { height: 20 + (i % 5) * 8 }]} />
            ))}
          </View>
          <Text style={styles.chartCaption}>Last 30 days · Target 85%</Text>
        </Card>

        <TouchableOpacity style={styles.customReportBtn} onPress={() => setShowCustomReport(true)} activeOpacity={0.7}>
          <MaterialIcons name="assessment" size={22} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.customReportTitle}>Custom Attendance Report</Text>
            <Text style={styles.customReportSub}>Export by date range — last 7, 30 days, or term</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={colors.onSurfaceVariant} />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Chronic Absentees</Text>
        {chronicAbsentees.map((c) => {
          const notified = notifiedIds.has(c.id);
          return (
            <Card key={c.id} style={styles.chronicCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.chronicName}>{c.name}</Text>
                <Text style={styles.chronicMeta}>
                  {c.class} · {c.days} days
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.notifyBtn, notified && styles.notifyBtnDone]}
                onPress={() => !notified && handleNotify(c.id, c.name)}
                activeOpacity={notified ? 1 : 0.7}
                disabled={notified}
              >
                <MaterialIcons
                  name={notified ? 'check-circle' : 'notifications-active'}
                  size={16}
                  color={notified ? colors.onSurfaceVariant : colors.onPrimary}
                />
                <Text style={[styles.notifyText, notified && styles.notifyTextDone]}>{notified ? 'Notified' : 'Notify'}</Text>
              </TouchableOpacity>
            </Card>
          );
        })}
      </ScrollView>

      {/* View filter modal */}
      <Modal visible={showFilterModal} transparent animationType="fade" onRequestClose={() => setShowFilterModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowFilterModal(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Filter View</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            {(
              [
                { key: 'all' as const, label: 'All classes', sub: 'Show every class row' },
                { key: 'alerts' as const, label: 'Alerts only', sub: 'Classes below attendance threshold' },
                { key: 'perfect' as const, label: '100% attendance', sub: 'Perfect attendance today' },
              ] as const
            ).map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.filterOption, viewFilter === opt.key && styles.filterOptionActive]}
                onPress={() => {
                  setViewFilter(opt.key);
                  setShowFilterModal(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.filterOptionTitle}>{opt.label}</Text>
                <Text style={styles.filterOptionSub}>{opt.sub}</Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Calendar picker */}
      <Modal visible={showCalendar} transparent animationType="slide" onRequestClose={() => setShowCalendar(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowCalendar(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>
                {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={() => setShowCalendar(false)}>
                <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            <View style={styles.calWeekHead}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <Text key={`${d}-${i}`} style={styles.calWeekLbl}>
                  {d}
                </Text>
              ))}
            </View>
            <View style={styles.calGrid}>
              {calendarCells.map((day, i) => {
                if (!day) return <View key={`empty-${i}`} style={styles.calCell} />;
                const active = isSameCalendarDay(day, selectedDate);
                const isToday = isSameCalendarDay(day, today);
                return (
                  <TouchableOpacity
                    key={day.toISOString()}
                    style={[styles.calCell, active && styles.calCellActive, isToday && !active && styles.calCellToday]}
                    onPress={() => {
                      setSelectedDate(startOfDay(day));
                      setWeekStart(startOfWeekMonday(day));
                      setShowCalendar(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.calCellText, active && styles.calCellTextActive]}>{day.getDate()}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.calNav}>
              <TouchableOpacity
                onPress={() => setSelectedDate((d) => startOfDay(new Date(d.getFullYear(), d.getMonth() - 1, 1)))}
                style={styles.calNavBtn}
              >
                <MaterialIcons name="chevron-left" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSelectedDate(today)} style={styles.todayBtn}>
                <Text style={styles.todayBtnText}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSelectedDate((d) => startOfDay(new Date(d.getFullYear(), d.getMonth() + 1, 1)))}
                style={styles.calNavBtn}
              >
                <MaterialIcons name="chevron-right" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Download modal */}
      <Modal visible={showDownloadModal} transparent animationType="fade" onRequestClose={() => setShowDownloadModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowDownloadModal(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Download Report</Text>
            <Text style={styles.modalSub}>Export attendance for {formatLongDate(selectedDate)}</Text>
            <TouchableOpacity style={styles.modalAction} onPress={() => handleDownload(false)} disabled={downloading}>
              {downloading ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <>
                  <MaterialIcons name="picture-as-pdf" size={20} color={colors.onPrimary} />
                  <Text style={styles.modalActionText}>Daily report (PDF)</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalSecondary}
              onPress={() => {
                setShowDownloadModal(false);
                setShowCustomReport(true);
              }}
            >
              <Text style={styles.modalSecondaryText}>Custom date range report</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Custom report modal */}
      <Modal visible={showCustomReport} transparent animationType="slide" onRequestClose={() => setShowCustomReport(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowCustomReport(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Custom Attendance Report</Text>
              <TouchableOpacity onPress={() => setShowCustomReport(false)}>
                <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>Choose a range ending on {formatLongDate(selectedDate)}</Text>
            {CUSTOM_RANGES.map((r) => (
              <TouchableOpacity
                key={r.id}
                style={[styles.filterOption, customRangeId === r.id && styles.filterOptionActive]}
                onPress={() => setCustomRangeId(r.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.filterOptionTitle}>{r.label}</Text>
                <Text style={styles.filterOptionSub}>{r.days} days of attendance data</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalAction} onPress={() => handleDownload(true)} disabled={downloading}>
              {downloading ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <>
                  <MaterialIcons name="download" size={20} color={colors.onPrimary} />
                  <Text style={styles.modalActionText}>Generate & download PDF</Text>
                </>
              )}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenShell>
  );
}

function SummaryItem({ label, value, color }: { label: string; value: string; color?: string }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryLbl}>{label}</Text>
      <Text style={[styles.summaryVal, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

function createStyles(colors: PrincipalColorScheme) {
  return StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.gutter, gap: spacing.md, paddingBottom: 32 },
  headerRight: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  dateNav: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  weekArrow: { padding: 4 },
  dayRow: { gap: spacing.sm, paddingHorizontal: 2 },
  dayChip: {
    width: 44,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  dayActive: { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer },
  daySun: { opacity: 0.55 },
  dayLbl: { ...textStyle('chip10'), color: colors.onSurfaceVariant },
  dayNum: { ...textStyle('labelMd'), fontWeight: '700', color: colors.onSurface },
  dayTextActive: { color: colors.onPrimary },
  todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary, marginTop: 2 },
  todayDotActive: { backgroundColor: colors.onPrimary },
  calBtn: { padding: 6, marginLeft: 2 },
  dateLine: { ...textStyle('bodyMd'), fontWeight: '600', color: colors.onSurface },
  holidayNote: { ...textStyle('labelMd'), color: colors.onSurfaceVariant, fontStyle: 'italic' },
  summaryCard: { gap: 8 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  summaryItem: { width: '22%', minWidth: 70 },
  summaryLbl: { ...textStyle('chip10'), color: colors.onSurfaceVariant },
  summaryVal: { ...textStyle('headlineMd'), fontWeight: '700' },
  rateLabel: { ...textStyle('labelMd'), color: colors.onSurfaceVariant, marginTop: 8 },
  rateValue: { ...textStyle('titleLg'), color: colors.primaryContainer, fontWeight: '700' },
  chipRow: { gap: spacing.sm },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.outlineVariant },
  chipActive: { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer },
  chipText: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  chipTextActive: { color: colors.onPrimary, fontWeight: '700' },
  filterHint: { ...textStyle('labelMd'), color: colors.primary, fontWeight: '600' },
  tableHead: { flexDirection: 'row', padding: 12, backgroundColor: colors.green50 },
  th: { ...textStyle('chip10'), fontWeight: '700', width: 52, textAlign: 'center' },
  thAct: { width: 44 },
  tableRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1, borderTopColor: colors.outlineVariant },
  rowGreen: { backgroundColor: colors.green50 },
  rowAmber: { backgroundColor: colors.amber50 },
  td: { ...textStyle('labelMd'), width: 52, textAlign: 'center' },
  actionText: { ...textStyle('chip10'), color: colors.primary, fontWeight: '700' },
  emptyTable: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant, padding: 16, textAlign: 'center' },
  sectionTitle: { ...textStyle('titleLg'), fontWeight: '600' },
  chartPlaceholder: { alignItems: 'center', gap: 8 },
  trendBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 80 },
  trendBar: { width: 16, backgroundColor: colors.primaryContainer, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  chartCaption: { ...textStyle('chip10'), color: colors.onSurfaceVariant },
  customReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  customReportTitle: { ...textStyle('bodyMd'), fontWeight: '700' },
  customReportSub: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  chronicCard: { flexDirection: 'row', alignItems: 'center' },
  chronicName: { ...textStyle('bodyMd'), fontWeight: '700' },
  chronicMeta: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  notifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.primaryContainer,
  },
  notifyBtnDone: { backgroundColor: colors.surfaceContainerHigh },
  notifyText: { ...textStyle('labelMd'), color: colors.onPrimary, fontWeight: '700' },
  notifyTextDone: { color: colors.onSurfaceVariant },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.gutter,
    paddingBottom: spacing.lg,
  },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { ...textStyle('titleLg'), fontWeight: '700' },
  modalSub: { ...textStyle('labelMd'), color: colors.onSurfaceVariant, marginBottom: spacing.md },
  modalAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primaryContainer,
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: spacing.sm,
  },
  modalActionText: { ...textStyle('bodyMd'), color: colors.onPrimary, fontWeight: '700' },
  modalSecondary: { alignItems: 'center', paddingVertical: 14, marginTop: 4 },
  modalSecondaryText: { ...textStyle('bodyMd'), color: colors.primary, fontWeight: '600' },
  filterOption: {
    padding: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginBottom: spacing.sm,
  },
  filterOptionActive: { borderColor: colors.primaryContainer, backgroundColor: `${colors.primaryContainer}18` },
  filterOptionTitle: { ...textStyle('bodyMd'), fontWeight: '700' },
  filterOptionSub: { ...textStyle('labelMd'), color: colors.onSurfaceVariant, marginTop: 2 },
  calWeekHead: { flexDirection: 'row', marginBottom: 8 },
  calWeekLbl: { flex: 1, textAlign: 'center', ...textStyle('chip10'), color: colors.onSurfaceVariant, fontWeight: '700' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  calCellActive: { backgroundColor: colors.primaryContainer, borderRadius: 999 },
  calCellToday: { borderWidth: 1, borderColor: colors.primary, borderRadius: 999 },
  calCellText: { ...textStyle('bodyMd'), fontWeight: '600' },
  calCellTextActive: { color: colors.onPrimary },
  calNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
  calNavBtn: { padding: 8 },
  todayBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.surfaceContainerHigh },
  todayBtnText: { ...textStyle('labelMd'), fontWeight: '700', color: colors.primary },
});
}
