import { useState, useMemo, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useTimetable } from '@/hooks/useApi';
import { LoadingScreen, ErrorScreen } from '@/components/ui/ScreenHeader';
import { formatTimetableDayLabel, formatTimetableWeekLabel, formatTimetableWeekRange } from '@/utils/timetable';

type ViewMode = 'week' | 'day' | 'month';

export default function TimetableScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data, isLoading, error, refetch } = useTimetable();
  const [selectedDay, setSelectedDay] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('day');

  const todayIndex = useMemo(() => data?.findIndex((d) => d.isToday) ?? 0, [data]);

  useEffect(() => {
    if (data && todayIndex >= 0) setSelectedDay(todayIndex);
  }, [data, todayIndex]);

  if (isLoading) return <LoadingScreen />;
  if (error || !data) return <ErrorScreen message="Failed to load timetable" onRetry={() => refetch()} />;

  const day = data[selectedDay] ?? data[todayIndex];
  const weekLabel = formatTimetableWeekLabel(data);
  const weekRange = formatTimetableWeekRange(data);
  const dayLabel = formatTimetableDayLabel(day);
  const monthYearLabel = day.fullDate
    ? new Date(day.fullDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: `${theme.colors.primary}1a` }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>TIMETABLE</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.replace('/(tabs)')}>
          <MaterialIcons name="close" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.weekLabel, { color: theme.colors.primary }]}>{weekLabel}</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayRow}>
        {data.map((d, i) => {
          const active = selectedDay === i;
          const isToday = d.isToday;
          return (
            <TouchableOpacity key={d.day} style={styles.dayItem} onPress={() => setSelectedDay(i)}>
              <Text style={{ color: isToday ? theme.colors.primary : theme.colors.textMuted, fontSize: 10, fontWeight: '700' }}>
                {isToday ? 'Today' : d.shortDay ?? d.day.slice(0, 3)}
              </Text>
              <View
                style={[
                  styles.dayCircle,
                  active && isToday && { backgroundColor: theme.colors.primary },
                  active && !isToday && { borderWidth: 2, borderColor: theme.colors.primary },
                ]}
              >
                <Text style={{ color: active && isToday ? '#fff' : theme.colors.text, fontWeight: '700' }}>{d.date ?? i + 1}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={[styles.viewSwitcher, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.viewTabs, { backgroundColor: `${theme.colors.primary}08` }]}>
          {(['week', 'day', 'month'] as ViewMode[]).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[styles.viewTab, viewMode === mode && { backgroundColor: theme.colors.card }]}
              onPress={() => setViewMode(mode)}
            >
              <Text style={{ color: viewMode === mode ? theme.colors.text : theme.colors.textMuted, fontWeight: viewMode === mode ? '700' : '500', fontSize: 12 }}>
                {mode === 'week' ? 'Week View' : mode === 'day' ? 'Day View' : 'Month View'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.dayHeader}>
          <MaterialIcons name="calendar-today" size={16} color={theme.colors.primary} />
          <Text style={{ color: theme.colors.textSecondary, fontSize: 13, fontWeight: '700' }}>
            {viewMode === 'week'
              ? `WEEK OVERVIEW — ${weekRange}`
              : viewMode === 'month'
                ? `${monthYearLabel.toUpperCase()} (MONTH VIEW)`
                : dayLabel.toUpperCase()}
          </Text>
        </View>

        {(viewMode === 'week' ? data.flatMap((d) => d.slots.map((s) => ({ ...s, dayLabel: d.day }))) : day.slots).map((slot) => (
          <View key={`${slot.id}-${'dayLabel' in slot ? slot.dayLabel : ''}`} style={styles.periodRow}>
            <View style={styles.timeCol}>
              <Text style={{ color: slot.isLive ? theme.colors.primary : theme.colors.textMuted, fontSize: 11, fontWeight: '700' }}>
                {slot.startTime}
              </Text>
              <View style={[styles.timeLine, { backgroundColor: slot.isLive ? `${theme.colors.primary}4d` : theme.colors.border }]} />
            </View>
            {slot.isBreak ? (
              <View style={[styles.breakCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <MaterialIcons name="restaurant" size={20} color={theme.colors.textMuted} />
                <Text style={{ color: theme.colors.textSecondary, fontWeight: '600' }}>{slot.subject}</Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>{slot.startTime} – {slot.endTime}</Text>
              </View>
            ) : (
              <View
                style={[
                  styles.slotCard,
                  {
                    backgroundColor: slot.isLive ? `${theme.colors.primary}0d` : theme.colors.card,
                    borderColor: slot.isLive ? theme.colors.primary : theme.colors.border,
                    borderWidth: slot.isLive ? 2 : 1,
                  },
                ]}
              >
                {slot.isLive && (
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE CLASS!</Text>
                  </View>
                )}
                <Text style={[styles.subject, { color: slot.isLive ? theme.colors.primary : theme.colors.text }]}>{slot.subject}</Text>
                <View style={styles.metaRow}>
                  <MaterialIcons name="meeting-room" size={14} color={theme.colors.textMuted} />
                  <Text style={styles.metaText}>Room {slot.room}</Text>
                  <Text style={styles.metaDot}>•</Text>
                  <MaterialIcons name="person" size={14} color={theme.colors.textMuted} />
                  <Text style={styles.metaText}>{slot.teacher}</Text>
                </View>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, height: 56, borderBottomWidth: 1 },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  headerTitle: { fontSize: 18, fontWeight: '700', letterSpacing: 0.5 },
  weekLabel: { textAlign: 'center', fontSize: 11, fontWeight: '700', letterSpacing: 2, paddingVertical: 8 },
  dayRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 16 },
  dayItem: { alignItems: 'center', minWidth: 48 },
  dayCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  viewSwitcher: { paddingHorizontal: 16, paddingBottom: 8 },
  viewTabs: { flexDirection: 'row', padding: 4, borderRadius: 12 },
  viewTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  scroll: { padding: 16, paddingBottom: 100 },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  periodRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  timeCol: { width: 48, alignItems: 'center' },
  timeLine: { width: 1, flex: 1, minHeight: 40, marginTop: 8 },
  slotCard: { flex: 1, padding: 16, borderRadius: 12, position: 'relative' },
  breakCard: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center', gap: 4 },
  liveBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#ef4444', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderBottomLeftRadius: 8 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  subject: { fontSize: 18, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  metaText: { color: '#64748b', fontSize: 12 },
  metaDot: { color: '#64748b', marginHorizontal: 4 },
});
