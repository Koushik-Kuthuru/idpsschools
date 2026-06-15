import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ManagerHeader } from '../components/ManagerHeader';
import { ScreenShell } from '../components/ScreenShell';
import { Card } from '../components/ui';
import {
  SUBSTITUTE_CANDIDATES,
  initialCalendarEvents,
  kpiCards,
  type ManagerCalendarEvent,
  type ManagerPriorityTask,
} from '../data/mockData';
import { getManagerUnreadCount, useManagerNotificationsStore } from '../store/managerNotificationsStore';
import { useManagerPriorityTasksStore } from '../store/priorityTasksStore';
import type { SubstitutionItem } from '../data/mockData';
import { getPendingSubstitutionCount, useSubstitutionsStore } from '../store/substitutionsStore';
import { handleManagerTabPress } from '../navigation/navigationHelpers';
import type { ManagerStackParamList } from '../navigation/types';
import { SCHOOL_NAME } from '@/constants/school';
import { useAuthStore } from '@/store';
import {
  eventDateFromOffset,
  formatEventSchedule,
  formatLongDate,
  formatTime12h,
  formatWeekdayLetter,
  getWeekDays,
  isSameCalendarDay,
  isSunday,
  startOfDay,
  startOfWeekMonday,
} from '@/utils/datetime';
import { getGreeting } from '@/utils/greeting';
import { colors, spacing, textStyle } from '@/designations/academic-manager/theme';

const QUICK = [
  { icon: 'schedule' as const, label: 'Timetable', route: 'Timetable' as const },
  { icon: 'swap-horiz' as const, label: 'Substitution', route: 'StaffCoordination' as const },
  { icon: 'campaign' as const, label: 'Circular', route: 'ParentCommunications' as const },
  { icon: 'analytics' as const, label: 'Reports', route: 'ReportsAnalytics' as const },
];

function eventsForDate(events: ManagerCalendarEvent[], date: Date): ManagerCalendarEvent[] {
  return events.filter((event) => isSameCalendarDay(eventDateFromOffset(event.dayOffset), date));
}

export function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ManagerStackParamList>>();
  const user = useAuthStore((s) => s.user);
  const notificationItems = useManagerNotificationsStore((s) => s.items);
  const priorityItems = useManagerPriorityTasksStore((s) => s.items);
  const completePriority = useManagerPriorityTasksStore((s) => s.complete);
  const substitutionItems = useSubstitutionsStore((s) => s.items);
  const assignSubstitute = useSubstitutionsStore((s) => s.assign);
  const markFreePeriod = useSubstitutionsStore((s) => s.markFreePeriod);
  const unreadCount = getManagerUnreadCount(notificationItems);
  const pendingSubs = getPendingSubstitutionCount(substitutionItems);
  const [dateLine, setDateLine] = useState(() => `${formatLongDate()} · ${formatTime12h()} · Academic Administration`);
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));

  const weekDays = useMemo(() => getWeekDays(startOfWeekMonday()), [dateLine]);
  const selectedEvents = useMemo(() => eventsForDate(initialCalendarEvents, selectedDate), [selectedDate]);
  const today = useMemo(() => startOfDay(new Date()), [dateLine]);

  const displayName = user?.name?.split(' ')[0] ?? 'Aarav';
  const greetingLine = `${getGreeting()}, ${displayName} 👋`;

  const kpiWithTasks = useMemo(
    () =>
      kpiCards.map((card) =>
        card.label === 'Awaiting Action'
          ? {
              ...card,
              value: String(priorityItems.length),
              sub: priorityItems.length === 1 ? '1 urgent' : `${priorityItems.length} pending`,
              subTone: priorityItems.length > 0 ? ('error' as const) : undefined,
            }
          : card,
      ),
    [priorityItems.length],
  );

  useEffect(() => {
    const timer = setInterval(
      () => setDateLine(`${formatLongDate()} · ${formatTime12h()} · Academic Administration`),
      30_000,
    );
    return () => clearInterval(timer);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setDateLine(`${formatLongDate()} · ${formatTime12h()} · Academic Administration`);
      setSelectedDate(startOfDay(new Date()));
    }, []),
  );

  const handlePriorityTask = (task: ManagerPriorityTask) => {
    switch (task.kind) {
      case 'substitution':
        Alert.alert('Assign substitute', 'Open Staff Coordination to finalise the Grade 9B Physics substitution?', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: task.actionLabel,
            onPress: () => {
              completePriority(task.id);
              navigation.navigate('StaffCoordination');
            },
          },
        ]);
        break;
      case 'calendar-upload':
        Alert.alert('Upload calendar', 'Open Exam Calendar to upload the revised Term 2 schedule?', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: task.actionLabel,
            onPress: () => {
              completePriority(task.id);
              handleManagerTabPress(navigation, 'calendar');
              Alert.alert('Calendar opened', 'Upload the revised academic calendar from the exam calendar screen.');
            },
          },
        ]);
        break;
      case 'timetable-clash':
        Alert.alert('Timetable clash', 'Review Grade 11 Science scheduling conflicts in Timetable Management?', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: task.actionLabel,
            onPress: () => {
              completePriority(task.id);
              handleManagerTabPress(navigation, 'timetable');
            },
          },
        ]);
        break;
      default:
        break;
    }
  };

  const handleSubstitution = (item: SubstitutionItem) => {
    if (item.status === 'assigned' && item.teacher !== 'Pending' && item.teacher !== 'Free Period') {
      Alert.alert(`${item.grade} · ${item.subject}`, `Substitute: ${item.teacher}`);
      return;
    }
    Alert.alert(
      `Assign — ${item.grade}`,
      `${item.subject} · ${item.period}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Staff', onPress: () => navigation.navigate('StaffCoordination') },
        ...SUBSTITUTE_CANDIDATES.slice(0, 3).map((name) => ({
          text: name,
          onPress: () => {
            assignSubstitute(item.id, name);
            Alert.alert('Assigned', `${name} assigned for ${item.grade} ${item.subject}.`);
          },
        })),
        {
          text: 'Free period',
          onPress: () => {
            markFreePeriod(item.id);
            Alert.alert('Updated', 'Marked as free period.');
          },
        },
      ],
    );
  };

  const handleCalendarEvent = (event: ManagerCalendarEvent) => {
    const when = formatEventSchedule(event.hour, event.minute, event.location);
    Alert.alert(event.title, when, [
      { text: 'Close', style: 'cancel' },
      {
        text: 'Open Calendar',
        onPress: () => handleManagerTabPress(navigation, 'calendar'),
      },
    ]);
  };

  return (
    <ScreenShell
      activeTab="home"
      onTabPress={(t) => handleManagerTabPress(navigation, t)}
      header={
        <ManagerHeader
          title=""
          identity={{
            orgTitle: 'Academic Manager',
            orgSubtitle: SCHOOL_NAME,
            notificationCount: unreadCount > 0 ? unreadCount : undefined,
            onNotifications: () => navigation.navigate('NotificationsAlerts'),
          }}
        />
      }
    >
      <View style={styles.content}>
        <Text style={styles.greeting}>{greetingLine}</Text>
        <Text style={styles.greetingSub}>{dateLine}</Text>

        <View style={styles.snapshot}>
          <View style={styles.snapCol}>
            <Text style={styles.snapLabel}>Today's Classes</Text>
            <Text style={styles.snapValue}>
              142 <Text style={styles.snapMuted}>/ 148</Text>
            </Text>
            <Text style={styles.snapChip}>
              {pendingSubs > 0 ? `${pendingSubs} substitution${pendingSubs === 1 ? '' : 's'} pending` : 'All substitutions covered'}
            </Text>
          </View>
          <View style={[styles.snapCol, styles.snapBorder]}>
            <Text style={styles.snapLabel}>Teacher Attendance</Text>
            <Text style={styles.snapValue}>94%</Text>
            <Text style={styles.snapSub}>6 absent today</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kpiRow}>
          {kpiWithTasks.map((k) => (
            <View key={k.label} style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>{k.label}</Text>
              <Text style={styles.kpiValue}>{k.value}</Text>
              <Text
                style={[
                  styles.kpiSub,
                  k.subTone === 'error' && { color: colors.error },
                  k.subTone === 'primary' && { color: colors.primary },
                ]}
              >
                {k.sub}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.quickGrid}>
          {QUICK.map((q) => (
            <TouchableOpacity
              key={q.label}
              style={styles.quickItem}
              onPress={() =>
                q.route === 'Timetable'
                  ? handleManagerTabPress(navigation, 'timetable')
                  : navigation.navigate(q.route)
              }
              activeOpacity={0.7}
            >
              <View style={styles.quickIcon}>
                <MaterialIcons name={q.icon} size={22} color={colors.primary} />
              </View>
              <Text style={styles.quickLabel}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHead}>
          <Text style={textStyle('titleLg')}>Priority Tasks</Text>
          <TouchableOpacity onPress={() => handleManagerTabPress(navigation, 'tasks')} activeOpacity={0.7}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        {priorityItems.length === 0 ? (
          <Text style={styles.emptyTasks}>All priority tasks are complete.</Text>
        ) : (
          priorityItems.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={styles.taskRow}
              onPress={() => handlePriorityTask(t)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.taskDot,
                  t.tone === 'error' && { backgroundColor: colors.error },
                  t.tone === 'tertiary' && { backgroundColor: colors.tertiary },
                  t.tone === 'primary' && { backgroundColor: colors.primaryContainer },
                ]}
              />
              <Text style={styles.taskText}>{t.title}</Text>
              <Text style={styles.taskAction}>{t.actionLabel}</Text>
              <MaterialIcons name="chevron-right" size={18} color={colors.outline} />
            </TouchableOpacity>
          ))
        )}

        <Card style={styles.attendanceCard}>
          <Text style={styles.cardTitle}>Faculty Attendance Overview</Text>
          <View style={styles.attendanceStats}>
            <View style={styles.stat}>
              <Text style={[styles.statVal, { color: colors.primary }]}>87</Text>
              <Text style={styles.statLbl}>Present</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statVal, { color: colors.error }]}>6</Text>
              <Text style={styles.statLbl}>Absent</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statVal, { color: colors.tertiary }]}>5</Text>
              <Text style={styles.statLbl}>On Leave</Text>
            </View>
          </View>
          <View style={styles.stackedBar}>
            <View style={[styles.barSeg, { flex: 88.7, backgroundColor: colors.primary }]} />
            <View style={[styles.barSeg, { flex: 6.1, backgroundColor: colors.error }]} />
            <View style={[styles.barSeg, { flex: 5.2, backgroundColor: colors.tertiary }]} />
          </View>
          <View style={styles.deptGrid}>
            {[
              ['Primary', '24/24'],
              ['Middle', '22/24'],
              ['Senior', '28/32'],
              ['Non-Acad', '13/18'],
            ].map(([l, v]) => (
              <View key={l} style={styles.deptRow}>
                <Text style={styles.deptLbl}>{l}</Text>
                <Text style={styles.deptVal}>{v}</Text>
              </View>
            ))}
          </View>
        </Card>

        <View style={styles.sectionHead}>
          <Text style={textStyle('titleLg')}>Substitution Tracker</Text>
          <TouchableOpacity onPress={() => navigation.navigate('StaffCoordination')} activeOpacity={0.7}>
            <Text style={styles.viewAll}>Manage</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subRow}>
          {substitutionItems.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[styles.subCard, s.urgent && s.status === 'pending' && styles.subUrgent]}
              onPress={() => handleSubstitution(s)}
              activeOpacity={0.7}
            >
              <View style={styles.subHead}>
                <Text
                  style={[
                    styles.subGrade,
                    s.urgent && s.status === 'pending' && { backgroundColor: colors.error, color: colors.onError },
                  ]}
                >
                  {s.grade}
                </Text>
                <Text style={[styles.subPeriod, s.urgent && s.status === 'pending' && { color: colors.error, fontWeight: '700' }]}>
                  {s.status === 'pending' && s.urgent ? 'URGENT' : s.period}
                </Text>
              </View>
              <Text style={styles.subSubject}>{s.subject}</Text>
              <Text
                style={[
                  styles.subTeacher,
                  s.status === 'pending' && { color: colors.error },
                  s.status === 'assigned' && { color: colors.primary },
                ]}
              >
                {s.status === 'pending' ? `Tap to assign · ${s.teacher}` : s.teacher}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sectionHead}>
          <Text style={textStyle('titleLg')}>Academic Calendar</Text>
          <TouchableOpacity onPress={() => handleManagerTabPress(navigation, 'calendar')} activeOpacity={0.7}>
            <Text style={styles.viewAll}>Full Calendar</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.weekStrip}>
          {weekDays.map((day) => {
            const active = isSameCalendarDay(day, selectedDate);
            const isToday = isSameCalendarDay(day, today);
            const dayIsSunday = isSunday(day);
            const dayEvents = dayIsSunday ? [] : eventsForDate(initialCalendarEvents, day);
            return (
              <TouchableOpacity
                key={day.toISOString()}
                style={[styles.dayChip, active && styles.dayActive, dayIsSunday && !active && styles.daySun]}
                onPress={() => setSelectedDate(startOfDay(day))}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayLbl, active && styles.dayLblActive]}>{formatWeekdayLetter(day)}</Text>
                <Text style={[styles.dayNum, active && styles.dayLblActive]}>{day.getDate()}</Text>
                {dayEvents.length > 0 ? <View style={[styles.dayDot, active && styles.dayDotActive]} /> : null}
              </TouchableOpacity>
            );
          })}
        </View>
        {isSunday(selectedDate) ? (
          <Text style={styles.noEvents}>No classes on Sunday — school holiday.</Text>
        ) : selectedEvents.length === 0 ? (
          <Text style={styles.noEvents}>No events scheduled for this day.</Text>
        ) : (
          selectedEvents.map((e) => (
            <TouchableOpacity
              key={e.id}
              style={styles.eventRow}
              onPress={() => handleCalendarEvent(e)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.eventBar,
                  e.tone === 'primary' && { backgroundColor: colors.primary },
                  e.tone === 'tertiary' && { backgroundColor: colors.tertiary },
                  e.tone === 'error' && { backgroundColor: colors.error },
                ]}
              />
              <View style={styles.eventBody}>
                <Text style={[styles.eventTitle, e.tone === 'error' && { color: colors.error }]}>{e.title}</Text>
                <Text style={styles.eventTime}>{formatEventSchedule(e.hour, e.minute, e.location)}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={18} color={colors.outline} />
            </TouchableOpacity>
          ))
        )}
      </View>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => handleManagerTabPress(navigation, 'calendar')}
        activeOpacity={0.85}
      >
        <MaterialIcons name="add" size={28} color={colors.onPrimary} />
      </TouchableOpacity>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.gutter, gap: 16, paddingBottom: 88 },
  greeting: { fontSize: 18, fontWeight: '600' },
  greetingSub: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant },
  snapshot: { backgroundColor: colors.primaryContainer, borderRadius: 12, padding: 16, flexDirection: 'row' },
  snapCol: { flex: 1 },
  snapBorder: { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.2)', paddingLeft: 16 },
  snapLabel: { ...textStyle('chip10'), color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: 1 },
  snapValue: { fontSize: 24, fontWeight: '700', color: colors.onPrimary, marginTop: 4 },
  snapMuted: { fontSize: 14, opacity: 0.8 },
  snapChip: {
    ...textStyle('chip10'),
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginTop: 4,
    color: colors.onPrimary,
  },
  snapSub: { ...textStyle('chip10'), color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  kpiRow: { gap: 12, marginHorizontal: -spacing.gutter, paddingHorizontal: spacing.gutter },
  kpiCard: {
    minWidth: 140,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  kpiLabel: { fontSize: 11, color: colors.onSurfaceVariant },
  kpiValue: { fontSize: 20, fontWeight: '700', marginTop: 4 },
  kpiSub: { fontSize: 12, color: colors.onSurfaceVariant, marginTop: 4 },
  quickGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  quickItem: { alignItems: 'center', gap: 4, width: '23%' },
  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { ...textStyle('chip10'), color: colors.onSurfaceVariant },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewAll: { ...textStyle('bodyMd'), color: colors.primary, fontWeight: '500' },
  emptyTasks: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant, fontStyle: 'italic' },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  taskDot: { width: 8, height: 8, borderRadius: 4 },
  taskText: { ...textStyle('bodyMd'), flex: 1, fontWeight: '500' },
  taskAction: { ...textStyle('chip10'), color: colors.primaryContainer, fontWeight: '700' },
  attendanceCard: { gap: 12 },
  cardTitle: { ...textStyle('bodyMd'), fontWeight: '700' },
  attendanceStats: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '700' },
  statLbl: { ...textStyle('chip10'), color: colors.onSurfaceVariant, textTransform: 'uppercase' },
  stackedBar: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden' },
  barSeg: { height: '100%' },
  deptGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  deptRow: {
    width: '47%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    paddingBottom: 4,
  },
  deptLbl: { fontSize: 11, color: colors.onSurfaceVariant },
  deptVal: { fontSize: 11, fontWeight: '700' },
  subRow: { gap: 12 },
  subCard: {
    minWidth: 200,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  subUrgent: { borderWidth: 2, borderStyle: 'dashed', borderColor: colors.error, backgroundColor: `${colors.errorContainer}33` },
  subHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  subGrade: {
    ...textStyle('chip10'),
    backgroundColor: colors.secondaryContainer,
    color: colors.onSecondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  subPeriod: { ...textStyle('chip10'), color: colors.onSurfaceVariant },
  subSubject: { ...textStyle('bodyMd'), fontWeight: '600' },
  subTeacher: { ...textStyle('chip10'), color: colors.primary, marginTop: 4 },
  weekStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLow,
    padding: 8,
    borderRadius: 12,
  },
  dayChip: { alignItems: 'center', padding: 8, borderRadius: 8, minWidth: 40, gap: 2 },
  dayActive: { backgroundColor: colors.primaryContainer },
  daySun: { opacity: 0.65 },
  dayLbl: { ...textStyle('chip10'), fontWeight: '700', textTransform: 'uppercase' },
  dayNum: { fontSize: 14, fontWeight: '700' },
  dayLblActive: { color: colors.onPrimary },
  dayDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.primary, marginTop: 2 },
  dayDotActive: { backgroundColor: colors.onPrimary },
  noEvents: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant, fontStyle: 'italic' },
  eventRow: { flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'center' },
  eventBar: { width: 4, alignSelf: 'stretch', borderRadius: 2 },
  eventBody: { flex: 1 },
  eventTitle: { ...textStyle('bodyMd'), fontWeight: '700' },
  eventTime: { ...textStyle('chip10'), color: colors.onSurfaceVariant },
  fab: {
    position: 'absolute',
    right: spacing.gutter,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
