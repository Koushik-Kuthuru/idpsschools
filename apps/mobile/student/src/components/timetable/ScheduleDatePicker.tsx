import { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cardShadow } from '@/constants/shadows';
import { dateToTimetableDayKey } from '@/utils/timetable';

const WEEK_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

type PickerMode = 'calendar' | 'monthYear';

interface ScheduleDatePickerProps {
  visible: boolean;
  value: Date;
  minDate: Date;
  maxDate: Date;
  enabledDayKeys: Set<string>;
  onClose: () => void;
  onConfirm: (date: Date) => void;
}

function clampDate(date: Date, minDate: Date, maxDate: Date): Date {
  const time = date.getTime();
  if (time < minDate.getTime()) return new Date(minDate);
  if (time > maxDate.getTime()) return new Date(maxDate);
  return new Date(date);
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function buildCalendarCells(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array.from({ length: firstDay }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
  return cells;
}

export function ScheduleDatePicker({
  visible,
  value,
  minDate,
  maxDate,
  enabledDayKeys,
  onClose,
  onConfirm,
}: ScheduleDatePickerProps) {
  const [draftDate, setDraftDate] = useState(value);
  const [viewYear, setViewYear] = useState(value.getFullYear());
  const [viewMonth, setViewMonth] = useState(value.getMonth());
  const [mode, setMode] = useState<PickerMode>('calendar');

  useEffect(() => {
    if (!visible) return;
    const next = clampDate(value, minDate, maxDate);
    setDraftDate(next);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
    setMode('calendar');
  }, [visible, value, minDate, maxDate]);

  const calendarCells = useMemo(() => buildCalendarCells(viewYear, viewMonth), [viewYear, viewMonth]);
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const selectedLabel = draftDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const minYear = minDate.getFullYear();
  const maxYear = maxDate.getFullYear();

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    if (next < new Date(minDate.getFullYear(), minDate.getMonth(), 1)) return;
    if (next > new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)) return;
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const selectCalendarDay = (day: number) => {
    const next = new Date(viewYear, viewMonth, day);
    const key = dateToTimetableDayKey(next);
    if (!enabledDayKeys.has(key)) return;
    setDraftDate(next);
  };

  const selectMonth = (monthIndex: number) => {
    setViewMonth(monthIndex);

    const firstEnabledDay = Array.from({ length: new Date(viewYear, monthIndex + 1, 0).getDate() }, (_, index) => index + 1).find(
      (day) => enabledDayKeys.has(dateToTimetableDayKey(new Date(viewYear, monthIndex, day))),
    );

    if (firstEnabledDay != null) {
      setDraftDate(new Date(viewYear, monthIndex, firstEnabledDay));
    }

    setMode('calendar');
  };

  const handleConfirm = () => {
    const key = dateToTimetableDayKey(draftDate);
    if (!enabledDayKeys.has(key)) return;
    onConfirm(draftDate);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.dialog, cardShadow]} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.caption}>Select date</Text>
          <View style={styles.selectedRow}>
            <Text style={styles.selectedDate}>{selectedLabel}</Text>
            <Ionicons name="create-outline" size={18} color="#64748b" />
          </View>

          {mode === 'calendar' ? (
            <>
              <View style={styles.navRow}>
                <TouchableOpacity style={styles.monthLabelBtn} onPress={() => setMode('monthYear')} activeOpacity={0.85}>
                  <Text style={styles.monthLabel}>{monthLabel}</Text>
                  <Ionicons name="chevron-down" size={16} color="#0f172a" />
                </TouchableOpacity>
                <View style={styles.navActions}>
                  <TouchableOpacity style={styles.navBtn} onPress={() => shiftMonth(-1)} accessibilityLabel="Previous month">
                    <Ionicons name="chevron-back" size={18} color="#0f172a" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.navBtn} onPress={() => shiftMonth(1)} accessibilityLabel="Next month">
                    <Ionicons name="chevron-forward" size={18} color="#0f172a" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.weekHeader}>
                {WEEK_HEADERS.map((label, index) => (
                  <Text key={`${label}-${index}`} style={styles.weekHeaderText}>
                    {label}
                  </Text>
                ))}
              </View>

              <View style={styles.calendarGrid}>
                {calendarCells.map((day, index) => {
                  if (day == null) return <View key={`empty-${index}`} style={styles.dayCell} />;

                  const cellDate = new Date(viewYear, viewMonth, day);
                  const key = dateToTimetableDayKey(cellDate);
                  const enabled = enabledDayKeys.has(key);
                  const selected = isSameDay(cellDate, draftDate);

                  return (
                    <TouchableOpacity
                      key={key}
                      style={styles.dayCell}
                      disabled={!enabled}
                      onPress={() => selectCalendarDay(day)}
                      activeOpacity={0.85}
                    >
                      <View style={[styles.dayBadge, selected && styles.dayBadgeSelected, !enabled && styles.dayBadgeDisabled]}>
                        <Text
                          style={[
                            styles.dayText,
                            selected && styles.dayTextSelected,
                            !enabled && styles.dayTextDisabled,
                          ]}
                        >
                          {day}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          ) : (
            <ScrollView style={styles.monthYearScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.yearRow}>
                <TouchableOpacity
                  style={styles.navBtn}
                  disabled={viewYear <= minYear}
                  onPress={() => setViewYear((year) => Math.max(minYear, year - 1))}
                >
                  <Ionicons name="chevron-back" size={18} color={viewYear <= minYear ? '#cbd5e1' : '#0f172a'} />
                </TouchableOpacity>
                <Text style={styles.yearLabel}>{viewYear}</Text>
                <TouchableOpacity
                  style={styles.navBtn}
                  disabled={viewYear >= maxYear}
                  onPress={() => setViewYear((year) => Math.min(maxYear, year + 1))}
                >
                  <Ionicons name="chevron-forward" size={18} color={viewYear >= maxYear ? '#cbd5e1' : '#0f172a'} />
                </TouchableOpacity>
              </View>

              <View style={styles.monthGrid}>
                {MONTHS.map((month, index) => {
                  const monthStart = new Date(viewYear, index, 1);
                  const monthEnd = new Date(viewYear, index + 1, 0);
                  const disabled = monthEnd < minDate || monthStart > maxDate;
                  const active = viewMonth === index && draftDate.getFullYear() === viewYear;

                  return (
                    <TouchableOpacity
                      key={month}
                      style={[styles.monthChip, active && styles.monthChipActive, disabled && styles.monthChipDisabled]}
                      disabled={disabled}
                      onPress={() => selectMonth(index)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.monthChipText, active && styles.monthChipTextActive, disabled && styles.monthChipTextDisabled]}>
                        {month.slice(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          )}

          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.footerBtn}>
              <Text style={styles.footerBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirm}
              style={styles.footerBtn}
              disabled={!enabledDayKeys.has(dateToTimetableDayKey(draftDate))}
            >
              <Text style={[styles.footerBtnText, styles.footerBtnPrimary]}>OK</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  caption: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 18,
  },
  selectedDate: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthLabelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dayBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBadgeSelected: {
    backgroundColor: '#144835',
  },
  dayBadgeDisabled: {
    opacity: 0.35,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  dayTextSelected: {
    color: '#fff',
  },
  dayTextDisabled: {
    color: '#94a3b8',
  },
  monthYearScroll: {
    maxHeight: 280,
    marginBottom: 8,
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  yearLabel: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    minWidth: 72,
    textAlign: 'center',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  monthChip: {
    width: '30%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  monthChipActive: {
    backgroundColor: '#144835',
  },
  monthChipDisabled: {
    opacity: 0.35,
  },
  monthChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  monthChipTextActive: {
    color: '#fff',
  },
  monthChipTextDisabled: {
    color: '#94a3b8',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  footerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  footerBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  footerBtnPrimary: {
    color: '#144835',
  },
});
