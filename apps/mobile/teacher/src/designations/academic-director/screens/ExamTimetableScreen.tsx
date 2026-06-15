import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { AcademicHeader } from '../components/AcademicHeader';
import { ScreenShell } from '../components/ScreenShell';
import { Card } from '../components/ui';
import { examTimetables, exams } from '../data/mockData';
import type { RootStackParamList } from '../navigation/types';
import type { AcademicColorScheme } from '../theme/colors';
import { spacing, textStyle, useAcademicTheme, useThemedStyles } from '@/designations/academic-director/theme';

export function ExamTimetableScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ExamTimetable'>>();
  const { colors } = useAcademicTheme();
  const styles = useThemedStyles(createStyles);
  const examId = route.params.examId;

  const exam = exams.find((e) => e.id === examId);
  const timetable = examTimetables[examId];
  const [activeDay, setActiveDay] = useState(0);

  const day = timetable?.days[activeDay];

  const summary = useMemo(() => {
    if (!timetable) return null;
    const totalSlots = timetable.days.reduce((sum, d) => sum + d.slots.length, 0);
    return `${timetable.days.length} exam days · ${totalSlots} sessions`;
  }, [timetable]);

  if (!timetable || !exam) {
    return (
      <ScreenShell
        header={<AcademicHeader title="Exam Timetable" onBack={() => navigation.goBack()} />}
      >
        <View style={styles.emptyWrap}>
          <MaterialIcons name="event-busy" size={40} color={colors.outline} />
          <Text style={styles.emptyTitle}>Timetable not available</Text>
          <Text style={styles.emptySub}>No exam schedule has been published for this assessment yet.</Text>
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      header={
        <AcademicHeader
          title="Exam Timetable"
          onBack={() => navigation.goBack()}
          subtitle={exam.title}
        />
      }
    >
      <View style={styles.content}>
        <Card style={styles.summaryCard}>
          <Text style={styles.examTitle}>{timetable.examTitle}</Text>
          <View style={styles.metaRow}>
            <MaterialIcons name="event" size={16} color={colors.onSurfaceVariant} />
            <Text style={styles.metaText}>{timetable.dates}</Text>
          </View>
          <View style={styles.metaRow}>
            <MaterialIcons name="location-on" size={16} color={colors.onSurfaceVariant} />
            <Text style={styles.metaText}>{timetable.venue}</Text>
          </View>
          {summary ? <Text style={styles.summaryMeta}>{summary}</Text> : null}
        </Card>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayRow}>
          {timetable.days.map((d, index) => (
            <TouchableOpacity
              key={d.dateLabel}
              style={[styles.dayChip, activeDay === index && styles.dayChipActive]}
              onPress={() => setActiveDay(index)}
            >
              <Text style={[styles.dayDate, activeDay === index && styles.dayDateActive]}>{d.dateLabel}</Text>
              <Text style={[styles.dayWeek, activeDay === index && styles.dayWeekActive]}>{d.weekday}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {day ? (
          <View style={styles.slots}>
            <Text style={styles.dayHeading}>
              {day.dateLabel} · {day.weekday}
            </Text>
            {day.slots.map((slot, index) => (
              <Card key={`${slot.time}-${slot.subject}-${index}`} style={styles.slotCard}>
                <View style={styles.slotHead}>
                  <View style={styles.timeBadge}>
                    <MaterialIcons name="schedule" size={16} color={colors.primaryContainer} />
                    <Text style={styles.timeText}>{slot.time}</Text>
                  </View>
                  <Text style={styles.duration}>{slot.duration}</Text>
                </View>
                <Text style={styles.subject}>{slot.subject}</Text>
                <View style={styles.slotMeta}>
                  <View style={styles.metaItem}>
                    <MaterialIcons name="school" size={14} color={colors.onSurfaceVariant} />
                    <Text style={styles.slotMetaText}>{slot.grades}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <MaterialIcons name="meeting-room" size={14} color={colors.onSurfaceVariant} />
                    <Text style={styles.slotMetaText}>{slot.hall}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <MaterialIcons name="person" size={14} color={colors.onSurfaceVariant} />
                    <Text style={styles.slotMetaText}>{slot.invigilator}</Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        ) : null}
      </View>
    </ScreenShell>
  );
}

function createStyles(colors: AcademicColorScheme) {
  return StyleSheet.create({
  content: { padding: spacing.gutter, gap: 16 },
  summaryCard: { gap: 8 },
  examTitle: { ...textStyle('titleLg'), fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant, flex: 1 },
  summaryMeta: { ...textStyle('chip10'), color: colors.primaryContainer, fontWeight: '700', marginTop: 4 },
  dayRow: { gap: 8, paddingVertical: 4 },
  dayChip: {
    minWidth: 72,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
  },
  dayChipActive: { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer },
  dayDate: { ...textStyle('labelMd'), fontWeight: '700', color: colors.onSurfaceVariant },
  dayDateActive: { color: colors.onPrimary },
  dayWeek: { ...textStyle('chip10'), color: colors.outline, marginTop: 2 },
  dayWeekActive: { color: colors.onPrimary },
  dayHeading: { ...textStyle('titleLg'), fontWeight: '600' },
  slots: { gap: 12 },
  slotCard: { gap: 10 },
  slotHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${colors.primaryContainer}1a`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  timeText: { ...textStyle('labelMd'), fontWeight: '700', color: colors.primaryContainer },
  duration: { ...textStyle('chip10'), color: colors.onSurfaceVariant },
  subject: { ...textStyle('headlineMd'), fontWeight: '700' },
  slotMeta: { gap: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  slotMetaText: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.gutter, gap: 8 },
  emptyTitle: { ...textStyle('titleLg'), fontWeight: '700' },
  emptySub: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant, textAlign: 'center' },
  });
}
