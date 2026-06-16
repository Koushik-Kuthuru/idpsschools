import { useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAcademicCalendar } from '@/hooks/useApi';
import { ScreenHeader, LoadingScreen, ErrorScreen } from '@/components/ui/ScreenHeader';
import { cardShadow } from '@/constants/shadows';
import { TAB_SCREEN_SCROLL_PADDING } from '@/constants/layout';
import type { AcademicCalendarEvent, AcademicCalendarEventType } from '@/types';
import {
  CALENDAR_FILTERS,
  addMonths,
  buildMonthCells,
  dateKey,
  eventTypeMeta,
  eventsByDateMap,
  eventsForDate,
  filterCalendarEvents,
  formatMonthLabel,
  formatSelectedDate,
  isSameCalendarDay,
} from '@/utils/academicCalendar';

const WEEK_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

function EventCard({ event, theme }: { event: AcademicCalendarEvent; theme: ReturnType<typeof useTheme> }) {
  const meta = eventTypeMeta(event.type);

  return (
    <View style={[styles.eventCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={[styles.eventTypePill, { backgroundColor: meta.bg }]}>
        <Text style={[styles.eventTypeText, { color: meta.color }]}>{meta.label}</Text>
      </View>
      <Text style={[styles.eventTitle, { color: theme.colors.text }]}>{event.title}</Text>
      {event.description ? (
        <Text style={[styles.eventDescription, { color: theme.colors.textSecondary }]}>{event.description}</Text>
      ) : null}
      <View style={styles.eventMetaRow}>
        {event.time ? (
          <View style={styles.eventMetaItem}>
            <Ionicons name="time-outline" size={14} color={theme.colors.textMuted} />
            <Text style={[styles.eventMetaText, { color: theme.colors.textSecondary }]}>{event.time}</Text>
          </View>
        ) : null}
        {event.location ? (
          <View style={styles.eventMetaItem}>
            <Ionicons name="location-outline" size={14} color={theme.colors.textMuted} />
            <Text style={[styles.eventMetaText, { color: theme.colors.textSecondary }]}>{event.location}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default function AcademicCalendarScreen() {
  const theme = useTheme();
  const { data, isLoading, error, refetch, isRefetching } = useAcademicCalendar();
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [filter, setFilter] = useState<'all' | AcademicCalendarEventType>('all');

  const events = data ?? [];
  const filteredEvents = useMemo(() => filterCalendarEvents(events, filter), [events, filter]);
  const eventsMap = useMemo(() => eventsByDateMap(filteredEvents), [filteredEvents]);
  const monthCells = useMemo(() => buildMonthCells(currentMonth), [currentMonth]);
  const selectedEvents = useMemo(
    () => eventsForDate(filteredEvents, selectedDate),
    [filteredEvents, selectedDate],
  );
  const upcomingEvents = useMemo(
    () =>
      filteredEvents
        .filter((event) => event.date >= dateKey(new Date()))
        .slice(0, 4),
    [filteredEvents],
  );

  if (isLoading) return <LoadingScreen />;
  if (error && !data) return <ErrorScreen message="Failed to load academic calendar" onRetry={() => refetch()} />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <ScreenHeader title="Academic calendar" fallbackRoute="/(tabs)" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: TAB_SCREEN_SCROLL_PADDING }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.primary} />}
      >
        <View style={[styles.heroCard, cardShadow]}>
          <Text style={styles.heroEyebrow}>SCHOOL CALENDAR</Text>
          <Text style={styles.heroTitle}>{filteredEvents.length} scheduled items</Text>
          <Text style={styles.heroSub}>Holidays, exams, events and academic milestones</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {CALENDAR_FILTERS.map((item) => {
            const active = filter === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => setFilter(item.key)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? theme.colors.primary : theme.colors.card,
                    borderColor: active ? theme.colors.primary : theme.colors.border,
                  },
                ]}
              >
                <Text style={{ color: active ? '#fff' : theme.colors.textSecondary, fontWeight: '700', fontSize: 12 }}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={[styles.calendarCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={() => setCurrentMonth((month) => addMonths(month, -1))} style={styles.navBtn}>
              <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
            </TouchableOpacity>
            <View style={styles.monthCopy}>
              <Text style={[styles.monthLabel, { color: theme.colors.text }]}>{formatMonthLabel(currentMonth)}</Text>
              <TouchableOpacity onPress={() => { const today = new Date(); setCurrentMonth(today); setSelectedDate(today); }}>
                <Text style={[styles.todayLink, { color: theme.colors.primary }]}>Today</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setCurrentMonth((month) => addMonths(month, 1))} style={styles.navBtn}>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekHeaderRow}>
            {WEEK_HEADERS.map((label, index) => (
              <Text key={`${label}-${index}`} style={[styles.weekHeader, { color: theme.colors.textMuted }]}>
                {label}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {monthCells.map((cellDate, index) => {
              const inMonth = cellDate.getMonth() === currentMonth.getMonth();
              const selected = isSameCalendarDay(cellDate, selectedDate);
              const today = isSameCalendarDay(cellDate, new Date());
              const dayEvents = eventsMap.get(dateKey(cellDate)) ?? [];

              return (
                <TouchableOpacity
                  key={`${cellDate.toISOString()}-${index}`}
                  onPress={() => {
                    setSelectedDate(cellDate);
                    if (!inMonth) setCurrentMonth(new Date(cellDate.getFullYear(), cellDate.getMonth(), 1));
                  }}
                  style={[
                    styles.dayCell,
                    selected && { backgroundColor: theme.colors.primary },
                    !selected && today && { backgroundColor: `${theme.colors.primary}14` },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      {
                        color: selected ? '#fff' : inMonth ? theme.colors.text : theme.colors.textMuted,
                        opacity: inMonth ? 1 : 0.45,
                      },
                    ]}
                  >
                    {cellDate.getDate()}
                  </Text>
                  {dayEvents.length > 0 ? (
                    <View style={styles.dotRow}>
                      {dayEvents.slice(0, 3).map((event) => {
                        const meta = eventTypeMeta(event.type);
                        return (
                          <View
                            key={event.id}
                            style={[styles.eventDot, { backgroundColor: selected ? '#fff' : meta.color }]}
                          />
                        );
                      })}
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{formatSelectedDate(selectedDate)}</Text>
        {selectedEvents.length ? (
          selectedEvents.map((event) => <EventCard key={event.id} event={event} theme={theme} />)
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Ionicons name="calendar-outline" size={28} color={theme.colors.textMuted} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No events on this day</Text>
          </View>
        )}

        {upcomingEvents.length ? (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 8 }]}>Coming up</Text>
            {upcomingEvents.map((event) => (
              <EventCard key={`upcoming-${event.id}`} event={event} theme={theme} />
            ))}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 4 },
  heroCard: {
    backgroundColor: '#144835',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  heroEyebrow: { color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 6 },
  heroSub: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4 },
  filterRow: { gap: 8, paddingBottom: 12 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  calendarCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthCopy: { alignItems: 'center' },
  monthLabel: { fontSize: 16, fontWeight: '800' },
  todayLink: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  weekHeaderRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
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
    borderRadius: 12,
    paddingVertical: 4,
  },
  dayNumber: {
    fontSize: 13,
    fontWeight: '700',
  },
  dotRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 4,
  },
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  eventCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  eventTypePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 8,
  },
  eventTypeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  eventDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  eventMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
  },
  eventMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventMetaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
