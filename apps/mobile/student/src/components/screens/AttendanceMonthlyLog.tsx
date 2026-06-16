import { useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { AttendanceRatioBar } from '@/components/charts/AttendanceCharts';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { cardShadow } from '@/constants/shadows';
import type { AttendanceRecord } from '@/types';
import {
  ATTENDANCE_STATUS,
  countAttendanceRecords,
  defaultMonthKey,
  filterRecordsByMonth,
  formatAttendanceDate,
  formatMonthLabel,
  getAvailableMonths,
} from '@/utils/attendanceUi';

interface AttendanceMonthlyLogProps {
  records: AttendanceRecord[];
  eyebrow: string;
  heroExtra?: string;
  preferredMonth?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function AttendanceMonthlyLog({
  records,
  eyebrow,
  heroExtra,
  preferredMonth,
  refreshing = false,
  onRefresh,
}: AttendanceMonthlyLogProps) {
  const theme = useTheme();
  const [monthModal, setMonthModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');

  const availableMonths = useMemo(() => getAvailableMonths(records), [records]);
  const activeMonth = selectedMonth || defaultMonthKey(records, preferredMonth);
  const monthRecords = useMemo(
    () => (activeMonth ? filterRecordsByMonth(records, activeMonth) : []),
    [records, activeMonth],
  );

  const counts = countAttendanceRecords(monthRecords);
  const monthLabel = activeMonth ? formatMonthLabel(activeMonth) : 'Select month';

  const stats = [
    { label: 'Present', value: counts.present, color: theme.colors.primary, icon: 'checkmark-circle' as const },
    { label: 'Absent', value: counts.absent, color: theme.colors.red500, icon: 'close-circle' as const },
    { label: 'Late', value: counts.late, color: theme.colors.amber500, icon: 'alarm-outline' as const },
    { label: 'Leave', value: counts.leave, color: theme.colors.slate500, icon: 'calendar-outline' as const },
  ];

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
          ) : undefined
        }
      >
        <View style={[styles.heroCard, cardShadow]}>
          <Text style={styles.heroEyebrow}>{eyebrow}</Text>
          {heroExtra ? <Text style={styles.heroExtra}>{heroExtra}</Text> : null}
          <TouchableOpacity style={styles.monthPicker} onPress={() => setMonthModal(true)} activeOpacity={0.85}>
            <Text style={styles.heroTitle}>{monthLabel}</Text>
            <View style={styles.monthPickerIcon}>
              <Ionicons name="chevron-down" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.heroSub}>{monthRecords.length} class days logged</Text>
        </View>

        <SectionHeader title="Month breakdown" />
        <View style={[styles.breakdownCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <AttendanceRatioBar present={counts.present} absent={counts.absent} late={counts.late} leave={counts.leave} />
        </View>

        <View style={styles.statsRow}>
          {stats.map((s) => (
            <View
              key={s.label}
              style={[styles.statCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            >
              <View style={[styles.statIcon, { backgroundColor: `${s.color}14` }]}>
                <Ionicons name={s.icon} size={14} color={s.color} />
              </View>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textMuted }]} numberOfLines={1}>
                {s.label}
              </Text>
            </View>
          ))}
        </View>

        <SectionHeader title="Daily records" />
        {monthRecords.length === 0 ? (
          <View style={[styles.emptyCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Ionicons name="calendar-outline" size={28} color={theme.colors.textMuted} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No records for this month</Text>
          </View>
        ) : (
          monthRecords.map((record) => {
            const config = ATTENDANCE_STATUS[record.status];
            const formatted = formatAttendanceDate(record.date);
            return (
              <View
                key={`${record.date}-${record.subject ?? 'overall'}`}
                style={[styles.recordCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
              >
                <View style={[styles.accentBar, { backgroundColor: config.color }]} />
                <View style={[styles.dateBox, { backgroundColor: `${config.color}12` }]}>
                  <Text style={[styles.dateDay, { color: theme.colors.text }]}>{formatted.day}</Text>
                  <Text style={[styles.dateMonth, { color: theme.colors.textMuted }]}>{formatted.month}</Text>
                </View>
                <View style={styles.recordBody}>
                  <Text style={[styles.weekday, { color: theme.colors.text }]}>{formatted.weekday}</Text>
                  <View style={styles.statusRow}>
                    <Ionicons name={config.icon} size={16} color={config.color} />
                    <Text style={[styles.statusLabel, { color: config.color }]}>{config.label}</Text>
                  </View>
                </View>
                <View style={[styles.statusChip, { backgroundColor: `${config.color}18` }]}>
                  <Text style={[styles.statusChipText, { color: config.color }]}>{config.label}</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal visible={monthModal} transparent animationType="fade" onRequestClose={() => setMonthModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setMonthModal(false)}>
          <View style={[styles.modalSheet, cardShadow, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Select month</Text>
            {availableMonths.map((monthKey) => (
              <TouchableOpacity
                key={monthKey}
                style={[styles.monthOption, activeMonth === monthKey && { backgroundColor: theme.colors.primaryLight }]}
                onPress={() => {
                  setSelectedMonth(monthKey);
                  setMonthModal(false);
                }}
              >
                <Text style={{ color: activeMonth === monthKey ? theme.colors.primary : theme.colors.text, fontWeight: '600' }}>
                  {formatMonthLabel(monthKey)}
                </Text>
                {activeMonth === monthKey ? <Ionicons name="checkmark" size={20} color={theme.colors.primary} /> : null}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  heroCard: {
    backgroundColor: '#144835',
    borderRadius: 16,
    padding: 20,
    marginBottom: 8,
    marginTop: 4,
  },
  heroEyebrow: { color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  heroExtra: { color: '#a2c144', fontSize: 18, fontWeight: '800', marginTop: 6 },
  monthPicker: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginTop: 8, gap: 8 },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  monthPickerIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSub: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '500', marginTop: 8 },
  breakdownCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
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
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 2, textAlign: 'center' },
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
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
    gap: 12,
  },
  accentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  dateBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  dateDay: { fontSize: 18, fontWeight: '800' },
  dateMonth: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5, marginTop: 1 },
  recordBody: { flex: 1 },
  weekday: { fontSize: 15, fontWeight: '700' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  statusLabel: { fontSize: 13, fontWeight: '600' },
  statusChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  statusChipText: { fontSize: 10, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  monthOption: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 10, borderRadius: 10 },
});
