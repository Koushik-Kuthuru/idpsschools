import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Pressable,
  Alert,
  Share,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AcademicHeader } from '../components/AcademicHeader';
import { ScreenShell } from '../components/ScreenShell';
import { Card } from '../components/ui';
import {
  timetableByClass,
  timetableBySubject,
  timetableByTeacher,
  timetableConflict,
  timetableSubstitutions,
  type TimetableClassEntry,
  type TimetablePeriod,
} from '../data/mockData';
import { usePriorityActionsStore } from '../store/priorityActionsStore';
import type { AcademicColorScheme } from '../theme/colors';
import { spacing, textStyle, useAcademicTheme, useThemedStyles } from '@/designations/academic-director/theme';

type ViewMode = 'By Class' | 'By Teacher' | 'By Subject';

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatHeaderDate(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
}

function buildWeekDays(weekStart: Date, selectedDate: Date) {
  return Array.from({ length: 6 }, (_, i) => {
    const date = addDays(weekStart, i);
    const isSelected =
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear();
    return {
      key: date.toISOString(),
      day: WEEKDAY_SHORT[date.getDay()],
      date: String(date.getDate()).padStart(2, '0'),
      fullDate: date,
      active: isSelected,
    };
  });
}

function normalizePeriods(periods: TimetablePeriod[], resolved: boolean): TimetablePeriod[] {
  if (!resolved) return periods;
  return periods.map((p) => (p.conflict ? { ...p, conflict: false } : p));
}

function PeriodGrid({
  periods,
  styles,
  colors,
}: {
  periods: TimetablePeriod[];
  styles: ReturnType<typeof createStyles>;
  colors: AcademicColorScheme;
}) {
  return (
    <View style={styles.periodGrid}>
      {periods.map((p) => (
        <View
          key={p.label}
          style={[
            styles.periodCell,
            p.sub && styles.periodSub,
            p.conflict && styles.periodConflict,
            p.free && styles.periodFree,
          ]}
        >
          <Text style={[styles.periodLabel, p.sub && styles.periodLabelSub, p.conflict && styles.periodLabelConflict, p.free && styles.periodLabelFree]}>
            {p.label}
          </Text>
          <Text style={[styles.periodSubject, p.sub && styles.periodSubjectSub, p.conflict && styles.periodSubjectConflict, p.free && styles.periodSubjectFree]}>
            {p.subject}
          </Text>
          {p.conflict ? <MaterialIcons name="error" size={14} color={colors.red500} style={styles.conflictIcon} /> : null}
        </View>
      ))}
    </View>
  );
}

export function TimetableOverviewScreen() {
  const navigation = useNavigation();
  const dayScrollRef = useRef<ScrollView>(null);
  const { colors } = useAcademicTheme();
  const styles = useThemedStyles(createStyles);

  const statusChips = useMemo(
    () => [
      { label: 'Classes Running: 48/52', icon: 'check-circle' as const, bg: colors.green50, text: '#065f46' },
      { label: 'Free Periods: 6', icon: 'event-busy' as const, bg: '#fffbeb', text: '#92400e' },
      { label: 'Substitutions: 4', icon: 'swap-horiz' as const, bg: colors.blue50, text: '#1e40af' },
      { label: 'Conflicts: 1', icon: 'warning' as const, bg: colors.red50, text: '#991b1b' },
    ],
    [colors],
  );

  const [view, setView] = useState<ViewMode>('By Class');
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(2025, 5, 10)));
  const [selectedDate, setSelectedDate] = useState(() => new Date(2025, 5, 10));
  const [expandedId, setExpandedId] = useState('10b');
  const [classes, setClasses] = useState(timetableByClass);
  const [conflictResolved, setConflictResolved] = useState(false);
  const [showResolve, setShowResolve] = useState(false);
  const [showEditMenu, setShowEditMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const weekDays = useMemo(() => buildWeekDays(weekStart, selectedDate), [weekStart, selectedDate]);

  const hasConflict = !conflictResolved && classes.some((c) => c.periods.some((p) => p.conflict));

  const shiftWeek = (direction: -1 | 1) => {
    const nextStart = addDays(weekStart, direction * 7);
    setWeekStart(nextStart);
    setSelectedDate(addDays(selectedDate, direction * 7));
  };

  const selectDay = (date: Date, index: number) => {
    setSelectedDate(date);
    dayScrollRef.current?.scrollTo({ x: Math.max(0, index * 60 - 40), animated: true });
  };

  const completeTimetablePriority = usePriorityActionsStore((s) => s.completeByKind);

  const handleResolve = (action: string) => {
    setShowResolve(false);
    setClasses((prev) =>
      prev.map((cls) => {
        if (cls.id !== timetableConflict.classId) return cls;
        return {
          ...cls,
          meta: '8/8 periods',
          periods: cls.periods.map((p) =>
            p.conflict
              ? { ...p, subject: 'Mathematics', conflict: false }
              : p,
          ),
        };
      }),
    );
    setConflictResolved(true);
    completeTimetablePriority('timetable-conflict');
    Alert.alert('Conflict Resolved', `${action} applied for Grade 10B Period 4.`);
  };

  const handleEditAction = (action: string) => {
    setShowEditMenu(false);
    Alert.alert('Edit Timetable', `${action} mode is now available for ${formatHeaderDate(selectedDate)}.`);
  };

  const handleMoreAction = async (action: string) => {
    setShowMoreMenu(false);
    if (action === 'Share Timetable') {
      await Share.share({
        message: `IDPS Timetable — ${formatHeaderDate(selectedDate)}\n48/52 classes running · 1 conflict · 4 substitutions`,
      });
      return;
    }
    Alert.alert(action, `Timetable action queued for ${formatHeaderDate(selectedDate)}.`);
  };

  const renderClassCard = (cls: TimetableClassEntry) => {
    const isExpanded = expandedId === cls.id;
    return (
      <Card key={cls.id} style={styles.classCard}>
        <TouchableOpacity style={[styles.classHead, isExpanded && styles.classHeadExpanded]} onPress={() => setExpandedId(isExpanded ? '' : cls.id)}>
          <View>
            <Text style={styles.className}>{cls.name}</Text>
            <Text style={styles.classMeta}>{cls.meta}</Text>
          </View>
          <View style={styles.classRight}>
            {cls.dots ? (
              <View style={styles.dotsRow}>
                {cls.dots.map((c, i) => (
                  <View key={i} style={[styles.dot, { backgroundColor: c }]} />
                ))}
              </View>
            ) : null}
            <MaterialIcons name={isExpanded ? 'expand-less' : 'expand-more'} size={22} color={isExpanded ? colors.primaryContainer : colors.onSurfaceVariant} />
          </View>
        </TouchableOpacity>
        {isExpanded ? <PeriodGrid periods={cls.periods} styles={styles} colors={colors} /> : null}
      </Card>
    );
  };

  return (
    <ScreenShell
      scroll={false}
      paddingBottom={0}
      header={
        <AcademicHeader
          title="Timetable Overview"
          onBack={() => navigation.goBack()}
          right={
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={() => setShowEditMenu(true)} accessibilityLabel="Edit timetable">
                <Text style={styles.editBtn}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowMoreMenu(true)} accessibilityLabel="More options">
                <MaterialIcons name="more-vert" size={22} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          }
        />
      }
    >
      <ScrollView style={styles.pageScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.dateNav}>
          <View style={styles.dateRow}>
            <TouchableOpacity onPress={() => shiftWeek(-1)} accessibilityLabel="Previous week">
              <MaterialIcons name="chevron-left" size={28} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
            <Text style={styles.dateText}>{formatHeaderDate(selectedDate)}</Text>
            <TouchableOpacity onPress={() => shiftWeek(1)} accessibilityLabel="Next week">
              <MaterialIcons name="chevron-right" size={28} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
          <ScrollView
            ref={dayScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daysRow}
          >
            {weekDays.map((d, index) => (
              <TouchableOpacity
                key={d.key}
                style={[styles.dayChip, d.active && styles.dayActive]}
                onPress={() => selectDay(d.fullDate, index)}
              >
                <Text style={[styles.dayLabel, d.active && styles.dayLabelActive]}>{d.day}</Text>
                <Text style={[styles.dayDate, d.active && styles.dayDateActive]}>{d.date}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusRow}>
          {statusChips.map((s) => (
            <View key={s.label} style={[styles.statusChip, { backgroundColor: s.bg }]}>
              <MaterialIcons name={s.icon} size={16} color={s.text} />
              <Text style={[styles.statusText, { color: s.text }]}>{s.label}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.toggle}>
          {(['By Class', 'By Teacher', 'By Subject'] as ViewMode[]).map((v) => (
            <TouchableOpacity
              key={v}
              style={[styles.toggleBtn, view === v && styles.toggleActive]}
              onPress={() => {
                setView(v);
                setExpandedId(v === 'By Class' ? '10b' : v === 'By Teacher' ? 'sharma' : 'science');
              }}
            >
              <Text style={[styles.toggleText, view === v && styles.toggleTextActive]}>{v}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.content}>
          {hasConflict ? (
            <View style={styles.conflictAlert}>
              <View style={styles.conflictTop}>
                <MaterialIcons name="report" size={22} color={colors.red500} />
                <View style={styles.conflictBody}>
                  <Text style={styles.conflictTitle}>{timetableConflict.title}</Text>
                  <Text style={styles.conflictSub}>{timetableConflict.detail}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.resolveBtn} onPress={() => setShowResolve(true)}>
                <Text style={styles.resolveText}>Resolve Now</Text>
              </TouchableOpacity>
            </View>
          ) : conflictResolved ? (
            <View style={styles.resolvedBanner}>
              <MaterialIcons name="check-circle" size={20} color={colors.primaryContainer} />
              <Text style={styles.resolvedText}>Conflict resolved for Grade 10B Period 4</Text>
            </View>
          ) : null}

          {view === 'By Class' && classes.map(renderClassCard)}

          {view === 'By Teacher' &&
            timetableByTeacher.map((teacher) => {
              const isExpanded = expandedId === teacher.id;
              return (
                <Card key={teacher.id} style={styles.classCard}>
                  <TouchableOpacity style={[styles.classHead, isExpanded && styles.classHeadExpanded]} onPress={() => setExpandedId(isExpanded ? '' : teacher.id)}>
                    <View>
                      <Text style={styles.className}>{teacher.name}</Text>
                      <Text style={styles.classMeta}>{teacher.role} · {teacher.meta}</Text>
                    </View>
                    <MaterialIcons name={isExpanded ? 'expand-less' : 'expand-more'} size={22} color={isExpanded ? colors.primaryContainer : colors.onSurfaceVariant} />
                  </TouchableOpacity>
                  {isExpanded ? <PeriodGrid periods={normalizePeriods(teacher.periods, conflictResolved)} styles={styles} colors={colors} /> : null}
                </Card>
              );
            })}

          {view === 'By Subject' &&
            timetableBySubject.map((subject) => {
              const isExpanded = expandedId === subject.id;
              return (
                <Card key={subject.id} style={styles.classCard}>
                  <TouchableOpacity style={[styles.classHead, isExpanded && styles.classHeadExpanded]} onPress={() => setExpandedId(isExpanded ? '' : subject.id)}>
                    <View>
                      <Text style={styles.className}>{subject.name}</Text>
                      <Text style={styles.classMeta}>HOD: {subject.hod} · {subject.meta}</Text>
                    </View>
                    <MaterialIcons name={isExpanded ? 'expand-less' : 'expand-more'} size={22} color={isExpanded ? colors.primaryContainer : colors.onSurfaceVariant} />
                  </TouchableOpacity>
                  {isExpanded ? (
                    <View style={styles.periodGrid}>
                      {subject.periods.map((slot) => (
                        <View key={`${slot.label}-${slot.className}`} style={[styles.periodCell, slot.sub && styles.periodSub]}>
                          <Text style={[styles.periodLabel, slot.sub && styles.periodLabelSub]}>{slot.label}</Text>
                          <Text style={styles.periodSubject}>{slot.className}</Text>
                          <Text style={styles.periodTeacher}>{slot.teacher}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </Card>
              );
            })}

          <Card style={styles.subCard}>
            <View style={styles.subHead}>
              <Text style={styles.subTitle}>Substitutions Today ({timetableSubstitutions.length})</Text>
              <Text style={styles.subLink}>View All</Text>
            </View>
            {timetableSubstitutions.slice(0, 2).map((sub) => (
              <View key={sub.detail} style={styles.subRow}>
                <View style={styles.subBody}>
                  <Text style={styles.subNames}>{sub.from} → {sub.to}</Text>
                  <Text style={styles.subDetail}>{sub.detail}</Text>
                </View>
                <MaterialIcons name="info-outline" size={18} color={colors.outline} />
              </View>
            ))}
          </Card>
        </View>
      </ScrollView>

      {/* Edit menu — modify timetable slots */}
      <Modal visible={showEditMenu} transparent animationType="fade" onRequestClose={() => setShowEditMenu(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setShowEditMenu(false)}>
          <Pressable style={styles.menuSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.menuTitle}>Edit Timetable</Text>
            <Text style={styles.menuHint}>Adjust periods, rooms, or teacher assignments for the selected day.</Text>
            {[
              { label: 'Modify Periods', icon: 'schedule' as const },
              { label: 'Swap Rooms', icon: 'meeting-room' as const },
              { label: 'Reassign Teacher', icon: 'person-search' as const },
            ].map((item) => (
              <TouchableOpacity key={item.label} style={styles.menuRow} onPress={() => handleEditAction(item.label)}>
                <MaterialIcons name={item.icon} size={20} color={colors.primaryContainer} />
                <Text style={styles.menuRowText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {/* More menu — export & utilities */}
      <Modal visible={showMoreMenu} transparent animationType="fade" onRequestClose={() => setShowMoreMenu(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setShowMoreMenu(false)}>
          <Pressable style={[styles.menuSheet, styles.menuSheetTop]} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.menuTitle}>Timetable Options</Text>
            <Text style={styles.menuHint}>Export, share, or review timetable operations.</Text>
            {[
              { label: 'Export PDF', icon: 'picture-as-pdf' as const },
              { label: 'Share Timetable', icon: 'share' as const },
              { label: 'Substitution Log', icon: 'swap-horiz' as const },
              { label: 'Refresh Data', icon: 'refresh' as const },
            ].map((item) => (
              <TouchableOpacity key={item.label} style={styles.menuRow} onPress={() => handleMoreAction(item.label)}>
                <MaterialIcons name={item.icon} size={20} color={colors.primaryContainer} />
                <Text style={styles.menuRowText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Resolve conflict */}
      <Modal visible={showResolve} transparent animationType="fade" onRequestClose={() => setShowResolve(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setShowResolve(false)}>
          <Pressable style={styles.menuSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.menuTitle}>Resolve Conflict</Text>
            <Text style={styles.menuHint}>{timetableConflict.detail}</Text>
            {[
              'Assign substitute for Science',
              'Move Mathematics to Period 6',
              'Split class into two rooms',
            ].map((option) => (
              <TouchableOpacity key={option} style={styles.menuRow} onPress={() => handleResolve(option)}>
                <MaterialIcons name="build" size={20} color={colors.red500} />
                <Text style={styles.menuRowText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenShell>
  );
}

function createStyles(colors: AcademicColorScheme) {
  return StyleSheet.create({
  pageScroll: { flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  editBtn: { ...textStyle('bodyMd'), color: colors.primaryContainer, fontWeight: '600' },
  dateNav: { borderBottomWidth: 1, borderBottomColor: colors.outlineVariant, backgroundColor: colors.surface },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.gutter, paddingVertical: 12 },
  dateText: { ...textStyle('titleLg'), fontWeight: '600', flex: 1, textAlign: 'center' },
  daysRow: { paddingHorizontal: spacing.gutter, paddingBottom: spacing.gutter, gap: 8 },
  dayChip: { minWidth: 52, alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 999, backgroundColor: colors.surfaceContainerLow },
  dayActive: { backgroundColor: colors.primaryContainer },
  dayLabel: { ...textStyle('chip10'), color: colors.onSurfaceVariant, textTransform: 'uppercase' },
  dayLabelActive: { color: colors.onPrimary },
  dayDate: { fontSize: 18, fontWeight: '600', color: colors.onSurfaceVariant },
  dayDateActive: { color: colors.onPrimary },
  statusRow: { gap: 8, padding: spacing.gutter },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 },
  statusText: { ...textStyle('labelMd') },
  toggle: { flexDirection: 'row', backgroundColor: colors.surfaceContainer, borderRadius: 12, padding: 4, marginHorizontal: spacing.gutter, marginBottom: spacing.gutter },
  toggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  toggleActive: { backgroundColor: colors.surface, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  toggleText: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  toggleTextActive: { color: colors.primaryContainer, fontWeight: '600' },
  content: { padding: spacing.gutter, gap: 12 },
  conflictAlert: { backgroundColor: colors.red50, borderWidth: 1, borderColor: '#fca5a5', borderRadius: 12, padding: 16, gap: 12 },
  conflictTop: { flexDirection: 'row', gap: 12 },
  conflictBody: { flex: 1 },
  conflictTitle: { ...textStyle('bodyLg'), fontWeight: '600', color: '#991b1b' },
  conflictSub: { ...textStyle('bodyMd'), color: '#b91c1c', marginTop: 4 },
  resolveBtn: { backgroundColor: colors.red500, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  resolveText: { ...textStyle('bodyMd'), color: colors.onPrimary, fontWeight: '600' },
  resolvedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${colors.primaryContainer}18`,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: `${colors.primaryContainer}33`,
  },
  resolvedText: { ...textStyle('bodyMd'), color: colors.primaryContainer, fontWeight: '600' },
  classCard: { padding: 0, overflow: 'hidden' },
  classHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  classHeadExpanded: { borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },
  className: { ...textStyle('titleLg'), fontWeight: '600' },
  classMeta: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant },
  classRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dotsRow: { flexDirection: 'row', gap: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  periodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 16, paddingTop: 12, backgroundColor: colors.surfaceContainerLowest },
  periodCell: { width: '47%', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.outlineVariant, backgroundColor: colors.surface, position: 'relative' },
  periodSub: { backgroundColor: colors.blue50, borderColor: '#bfdbfe' },
  periodConflict: { backgroundColor: colors.red50, borderColor: '#fca5a5' },
  periodFree: { backgroundColor: '#fffbeb', borderColor: '#fcd34d' },
  periodLabel: { ...textStyle('chip10'), color: colors.onSurfaceVariant, textTransform: 'uppercase', marginBottom: 4 },
  periodLabelSub: { color: colors.blue600 },
  periodLabelConflict: { color: colors.red500 },
  periodLabelFree: { color: '#b45309' },
  periodSubject: { ...textStyle('bodyMd'), fontWeight: '600' },
  periodSubjectSub: { color: '#1e3a8a' },
  periodSubjectConflict: { color: '#991b1b' },
  periodSubjectFree: { color: '#92400e', fontStyle: 'italic' },
  periodTeacher: { ...textStyle('chip10'), color: colors.onSurfaceVariant, marginTop: 2 },
  conflictIcon: { position: 'absolute', top: 8, right: 8 },
  subCard: { gap: 12 },
  subHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subTitle: { ...textStyle('titleLg'), fontWeight: '600' },
  subLink: { ...textStyle('bodyMd'), color: colors.primaryContainer, fontWeight: '600' },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subBody: { flex: 1 },
  subNames: { ...textStyle('bodyMd'), fontWeight: '500', color: colors.onSurfaceVariant },
  subDetail: { ...textStyle('chip10'), color: colors.outline, marginTop: 2 },
  menuBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end', padding: spacing.gutter },
  menuSheet: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, padding: 20, gap: 4, marginBottom: 24 },
  menuSheetTop: { marginBottom: 120 },
  menuTitle: { ...textStyle('titleLg'), fontWeight: '700', marginBottom: 4 },
  menuHint: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant, marginBottom: 12 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.slate100 },
  menuRowText: { ...textStyle('bodyMd'), fontWeight: '600' },
  });
}
