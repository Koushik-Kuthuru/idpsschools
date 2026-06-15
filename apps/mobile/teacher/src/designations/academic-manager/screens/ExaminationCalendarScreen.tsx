import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ManagerHeader } from '../components/ManagerHeader';
import { ScreenShell } from '../components/ScreenShell';
import { Card } from '../components/ui';
import { upcomingExams } from '../data/mockData';
import { handleManagerTabPress } from '../navigation/navigationHelpers';
import type { ManagerStackParamList } from '../navigation/types';
import { formatLongDate, formatMonthYear, getWeekDays, isSameCalendarDay, isSunday, startOfDay, startOfWeekMonday } from '@/utils/datetime';
import { colors, spacing, textStyle } from '@/designations/academic-manager/theme';

const EXAM_TABS = ['All', 'Unit Tests', 'Mid-Term', 'Practical', 'Annual'];

export function ExaminationCalendarScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ManagerStackParamList>>();
  const [tab, setTab] = useState('All');
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));

  const monthDate = useMemo(() => {
    const base = new Date();
    return new Date(base.getFullYear(), base.getMonth() + monthOffset, 1);
  }, [monthOffset]);

  const weekDays = useMemo(() => getWeekDays(startOfWeekMonday(selectedDate)), [selectedDate]);

  const filteredExams = useMemo(() => {
    if (tab === 'All') return upcomingExams;
    if (tab === 'Unit Tests') return upcomingExams.filter((e) => e.title.includes('Unit Test'));
    if (tab === 'Mid-Term') return upcomingExams.filter((e) => e.title.includes('Mid-Term'));
    if (tab === 'Practical') return upcomingExams.filter((e) => e.title.includes('Practical'));
    return upcomingExams.filter((e) => e.title.includes('Annual'));
  }, [tab]);

  return (
    <ScreenShell
      activeTab="calendar"
      onTabPress={(t) => handleManagerTabPress(navigation, t)}
      header={
        <ManagerHeader
          title="Exam Calendar"
          right={
            <View style={styles.headerRight}>
              <MaterialIcons name="add" size={22} color={colors.primary} />
              <MaterialIcons name="filter-list" size={22} color={colors.onSurfaceVariant} />
            </View>
          }
        />
      }
    >
      <View style={styles.content}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {EXAM_TABS.map((t) => (
            <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={() => setMonthOffset((m) => m - 1)} activeOpacity={0.7}>
            <MaterialIcons name="chevron-left" size={22} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
          <Text style={styles.monthText}>{formatMonthYear(monthDate)}</Text>
          <TouchableOpacity onPress={() => setMonthOffset((m) => m + 1)} activeOpacity={0.7}>
            <MaterialIcons name="chevron-right" size={22} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
        <View style={styles.miniCal}>
          {weekDays.map((day) => {
            const active = isSameCalendarDay(day, selectedDate);
            const inMonth = day.getMonth() === monthDate.getMonth();
            const dayIsSunday = isSunday(day);
            return (
              <TouchableOpacity
                key={day.toISOString()}
                style={[styles.calDay, active && styles.calToday, dayIsSunday && styles.calSunday]}
                onPress={() => setSelectedDate(startOfDay(day))}
                activeOpacity={0.7}
              >
                <Text style={[styles.calNum, active && styles.calTodayText, !inMonth && styles.calMuted, dayIsSunday && !active && styles.calSundayText]}>
                  {day.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.selectedLine}>{formatLongDate(selectedDate)}</Text>
        {isSunday(selectedDate) ? (
          <Text style={styles.sundayNote}>No classes on Sunday — school holiday.</Text>
        ) : null}
        <Text style={styles.sectionTitle}>Upcoming Exams ({filteredExams.length})</Text>
        {filteredExams.map((e) => (
          <Card key={e.title} style={styles.examCard}>
            <Text style={styles.examTitle}>{e.title}</Text>
            <Text style={styles.examGrades}>{e.grades}</Text>
            <Text style={styles.examDates}>{e.dates}</Text>
            {e.subjects ? <Text style={styles.examSubjects}>{e.subjects}</Text> : null}
            <Text style={styles.examStatus}>{e.status}</Text>
          </Card>
        ))}
        <TouchableOpacity style={styles.bentoAction}>
          <MaterialIcons name="grid-view" size={22} color={colors.primary} />
          <Text style={styles.bentoText}>Generate Seating Plan</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.fab}>
        <MaterialIcons name="post-add" size={26} color={colors.onPrimary} />
      </TouchableOpacity>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.gutter, gap: 16, paddingBottom: 88 },
  headerRight: { flexDirection: 'row', gap: 12 },
  tabs: { gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.outlineVariant },
  tabActive: { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer },
  tabText: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  tabTextActive: { color: colors.onPrimaryContainer },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monthText: { ...textStyle('titleLg'), fontWeight: '600' },
  miniCal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLow,
    padding: 12,
    borderRadius: 12,
  },
  calDay: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18 },
  calToday: { backgroundColor: colors.primaryContainer },
  calNum: { ...textStyle('bodyMd'), fontWeight: '600' },
  calTodayText: { color: colors.onPrimary },
  calSunday: { backgroundColor: colors.surfaceContainerHigh },
  calSundayText: { color: colors.onSurfaceVariant },
  calMuted: { opacity: 0.45 },
  sundayNote: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant, fontStyle: 'italic' },
  selectedLine: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  sectionTitle: { ...textStyle('titleLg') },
  examCard: { gap: 4 },
  examTitle: { ...textStyle('bodyMd'), fontWeight: '700' },
  examGrades: { ...textStyle('chip10'), color: colors.primary },
  examDates: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant },
  examSubjects: { ...textStyle('chip10'), color: colors.onSurfaceVariant },
  examStatus: { ...textStyle('chip10'), color: colors.onSurfaceVariant, marginTop: 4 },
  bentoAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.outlineVariant,
  },
  bentoText: { ...textStyle('bodyMd'), fontWeight: '600', color: colors.primary },
  fab: {
    position: 'absolute',
    right: spacing.gutter,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
