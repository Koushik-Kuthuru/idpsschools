import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl, PanResponder } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useTimetable } from '@/hooks/useApi';
import { ErrorScreen } from '@/components/ui/ScreenHeader';
import { TimetableSkeleton } from '@/components/ui/Skeleton';
import { ScheduleDatePicker } from '@/components/timetable/ScheduleDatePicker';
import { cardShadow } from '@/constants/shadows';
import { appNavigate } from '@/utils/navigation';
import { getCourseIdFromSubject } from '@/utils/courses';
import {
  clampScheduleCenter,
  findTimetableDayIndex,
  formatScheduleMonthYear,
  formatScheduleTimeRange,
  getAcademicYearBounds,
  getScheduleWindow,
  getSlotCategory,
  getSlotTabMeta,
  getTimetableDayDate,
  getTimetableDayKey,
  isScheduleSlotComplete,
} from '@/utils/timetable';
import type { TimetableDay, TimetableSlot } from '@/types';

const HEADER_GRADIENT = ['#144835', '#1a5a40', '#0d2e22'] as const;
const VISIBLE_DAYS = 5;

function padDate(value: number): string {
  return String(value).padStart(2, '0');
}

export default function TimetableScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading, error, refetch, isRefetching } = useTimetable();
  const [centerIndex, setCenterIndex] = useState(0);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const hasInitializedCenter = useRef(false);

  const days = data ?? [];
  const todayIndex = useMemo(() => days.findIndex((d) => d.isToday), [days]);
  const academicBounds = useMemo(() => getAcademicYearBounds(), []);
  const enabledDayKeys = useMemo(() => {
    const keys = new Set<string>();
    days.forEach((day) => {
      const key = getTimetableDayKey(day);
      if (key) keys.add(key);
    });
    return keys;
  }, [days]);

  useEffect(() => {
    if (days.length === 0) {
      hasInitializedCenter.current = false;
      return;
    }
    if (hasInitializedCenter.current) return;

    if (todayIndex >= 0) {
      setCenterIndex(todayIndex);
    } else {
      setCenterIndex(0);
    }
    hasInitializedCenter.current = true;
  }, [days, todayIndex]);

  const shiftCenter = useCallback(
    (delta: number) => {
      setCenterIndex((current) => clampScheduleCenter(current + delta, days.length));
    },
    [days.length],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 16 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx <= -40) shiftCenter(1);
          else if (gesture.dx >= 40) shiftCenter(-1);
        },
      }),
    [shiftCenter],
  );

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  if (isLoading) return <TimetableSkeleton />;
  if (error && !data) return <ErrorScreen message="Failed to load timetable" onRetry={() => refetch()} />;

  if (days.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
        <ScheduleHeader insetsTop={insets.top} monthLabel="" onBack={handleBack} />
        <View style={styles.emptyWrap}>
          <ScheduleEmptyState isToday={false} />
        </View>
      </SafeAreaView>
    );
  }

  const safeCenter = clampScheduleCenter(centerIndex, days.length);
  const { items: windowDays } = getScheduleWindow(days, safeCenter, VISIBLE_DAYS);
  const selectedDayData = days[safeCenter] ?? days[todayIndex >= 0 ? todayIndex : 0];
  const monthLabel = formatScheduleMonthYear(selectedDayData);
  const scheduleSlots = selectedDayData.slots;
  const selectedDate = getTimetableDayDate(selectedDayData) ?? new Date();

  const handleDateConfirm = (date: Date) => {
    const nextIndex = findTimetableDayIndex(days, date);
    setCenterIndex(nextIndex);
    setDatePickerVisible(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: '#eef2f6' }]}>
      <View style={styles.headerShell}>
        <LinearGradient
          colors={[...HEADER_GRADIENT]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        />
        <ScheduleHeader
          insetsTop={insets.top}
          monthLabel={monthLabel}
          onBack={handleBack}
          onMonthPress={() => setDatePickerVisible(true)}
        />
        <View style={styles.dayStripWrap} {...panResponder.panHandlers}>
          <View style={styles.dayStripRow}>
            {windowDays.map(({ day, globalIndex, isCenter }) => {
              const dayName = day.shortDay ?? day.day.slice(0, 3);
              const dayNumber = day.date != null ? padDate(day.date) : padDate(globalIndex + 1);

              return (
                <TouchableOpacity
                  key={day.fullDate ?? `${day.day}-${globalIndex}`}
                  style={[styles.dayItem, isCenter && styles.dayItemActive]}
                  onPress={() => setCenterIndex(globalIndex)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isCenter }}
                  accessibilityLabel={`${dayName} ${dayNumber}`}
                >
                  <Text style={[styles.dayName, isCenter ? styles.dayNameActive : styles.dayNameIdle]}>{dayName}</Text>
                  <Text style={[styles.dayNumber, isCenter ? styles.dayNumberActive : styles.dayNumberIdle]}>{dayNumber}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentScrollInner}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.primary} />}
      >
        {scheduleSlots.length === 0 ? (
          <ScheduleEmptyState isToday={selectedDayData.isToday ?? false} />
        ) : (
          scheduleSlots.map((slot) => (
            <ScheduleSlotCard key={slot.id} slot={slot} day={selectedDayData} />
          ))
        )}
      </ScrollView>

      <ScheduleDatePicker
        visible={datePickerVisible}
        value={selectedDate}
        minDate={academicBounds.start}
        maxDate={academicBounds.end}
        enabledDayKeys={enabledDayKeys}
        onClose={() => setDatePickerVisible(false)}
        onConfirm={handleDateConfirm}
      />
    </View>
  );
}

function ScheduleHeader({
  insetsTop,
  monthLabel,
  onBack,
  onMonthPress,
}: {
  insetsTop: number;
  monthLabel: string;
  onBack: () => void;
  onMonthPress?: () => void;
}) {
  return (
    <View style={[styles.header, { paddingTop: insetsTop + 4 }]}>
      <TouchableOpacity onPress={onBack} style={styles.headerBtn} accessibilityRole="button" accessibilityLabel="Go back">
        <Ionicons name="arrow-back" size={22} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Class timetable</Text>
      {monthLabel ? (
        <TouchableOpacity
          style={styles.headerMonth}
          onPress={onMonthPress}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`Change date, ${monthLabel}`}
        >
          <Ionicons name="calendar-outline" size={16} color="#fff" />
          <Text style={styles.headerMonthText}>{monthLabel}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.headerMonth} />
      )}
    </View>
  );
}

function ScheduleEmptyState({ isToday }: { isToday: boolean }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIllustration}>
        <View style={styles.emptyBoxBack} />
        <View style={styles.emptyBoxFront}>
          <View style={styles.emptyBoxDots}>
            <View style={styles.emptyDot} />
            <View style={styles.emptyDot} />
            <View style={styles.emptyDot} />
          </View>
        </View>
      </View>
      <Text style={styles.emptyTitle}>{isToday ? 'No class scheduled today' : 'No classes scheduled'}</Text>
      <Text style={styles.emptySub}>Enjoy your break. Change the date to check upcoming classes.</Text>
    </View>
  );
}

function ScheduleSlotCard({ slot, day }: { slot: TimetableSlot; day: TimetableDay }) {
  const category = getSlotCategory(slot);
  const { color: tabColor, label: tabLabel } = getSlotTabMeta(category);
  const isBreak = category === 'break';
  const isComplete = !isBreak && isScheduleSlotComplete(slot, day);

  const handlePress = () => {
    if (isBreak) return;
    const courseId = getCourseIdFromSubject(slot.subject, slot.courseId);
    appNavigate({ pathname: '/timetable/[courseId]', params: { courseId, subject: slot.subject } });
  };

  const card = (
    <View style={[styles.slotCard, isBreak && styles.slotCardBreak, cardShadow]}>
      <View style={styles.slotMain}>
        <Text style={[styles.slotSubject, isBreak && styles.slotSubjectBreak]} numberOfLines={2}>
          {slot.subject.toUpperCase()}
        </Text>
        <Text style={styles.slotTime}>{formatScheduleTimeRange(slot.startTime, slot.endTime)}</Text>
      </View>
      <View style={styles.slotStatus}>
        {isBreak ? (
          <View style={[styles.statusIcon, styles.statusIconBreak]}>
            <Ionicons name="cafe-outline" size={18} color="#64748b" />
          </View>
        ) : isComplete ? (
          <View style={styles.statusIcon}>
            <Ionicons name="checkmark" size={18} color="#16a34a" />
          </View>
        ) : (
          <View style={[styles.statusIcon, styles.statusIconPending]} />
        )}
      </View>
      <View style={[styles.sideTab, { backgroundColor: tabColor }]}>
        <Text style={styles.sideTabText}>{tabLabel}</Text>
      </View>
    </View>
  );

  if (isBreak) return card;

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={handlePress} accessibilityRole="button" accessibilityLabel={`Open ${slot.subject}`}>
      {card}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'visible' },
  headerShell: {
    position: 'relative',
    overflow: 'visible',
    zIndex: 2,
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 4,
  },
  headerMonth: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  headerMonthText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  dayStripWrap: {
    height: 64,
    paddingHorizontal: 8,
    overflow: 'visible',
  },
  dayStripRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 4,
    height: 64,
    overflow: 'visible',
  },
  dayItem: {
    flex: 1,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  dayItemActive: {
    backgroundColor: '#fff',
    height: 78,
    paddingTop: 12,
    paddingBottom: 18,
    marginBottom: -14,
    borderRadius: 20,
    zIndex: 3,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  dayNameIdle: { color: 'rgba(255,255,255,0.85)' },
  dayNameActive: { color: '#64748b' },
  dayNumber: {
    fontSize: 16,
    fontWeight: '800',
  },
  dayNumberIdle: { color: '#fff' },
  dayNumberActive: { color: '#0f172a' },
  contentScroll: { flex: 1, zIndex: 1 },
  contentScrollInner: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
    flexGrow: 1,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 48,
    paddingHorizontal: 24,
  },
  emptyIllustration: {
    width: 120,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  emptyBoxBack: {
    position: 'absolute',
    width: 88,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#c4b5fd',
    transform: [{ rotate: '-8deg' }, { translateY: -8 }],
  },
  emptyBoxFront: {
    width: 92,
    height: 68,
    borderRadius: 16,
    backgroundColor: '#144835',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '4deg' }],
  },
  emptyBoxDots: {
    flexDirection: 'row',
    gap: 6,
  },
  emptyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    lineHeight: 21,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 280,
  },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
    minHeight: 78,
  },
  slotCardBreak: {
    backgroundColor: '#f8fafc',
  },
  slotMain: {
    flex: 1,
    paddingVertical: 16,
    paddingLeft: 16,
    paddingRight: 8,
    justifyContent: 'center',
  },
  slotSubject: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  slotSubjectBreak: {
    color: '#475569',
  },
  slotTime: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
    marginTop: 8,
  },
  slotStatus: {
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  statusIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIconBreak: {
    backgroundColor: '#e2e8f0',
  },
  statusIconPending: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  sideTab: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  sideTabText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    transform: [{ rotate: '90deg' }],
    width: 56,
    textAlign: 'center',
  },
});
