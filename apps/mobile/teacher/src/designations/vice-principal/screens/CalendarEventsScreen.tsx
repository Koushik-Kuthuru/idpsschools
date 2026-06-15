import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { VicePrincipalHeader } from '../components/VicePrincipalHeader';
import { ScreenShell } from '../components/ScreenShell';
import { calendarGridDays, todayTimelineEvents } from '../data/mockData';
import { handleVpTabPress } from '../navigation/navigationHelpers';
import type { VicePrincipalStackParamList } from '../navigation/types';
import { spacing, textStyle, useThemedStyles, useVicePrincipalTheme } from '../theme';
import type { VicePrincipalColorScheme } from '../theme/colors';

const VIEW_MODES = ['Month', 'Week', 'Day'] as const;
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function CalendarEventsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<VicePrincipalStackParamList>>();
  const { colors } = useVicePrincipalTheme();
  const styles = useThemedStyles(createStyles);
  const [viewMode, setViewMode] = useState(0);

  return (
    <ScreenShell
      activeTab="events"
      onTabPress={(t) => handleVpTabPress(navigation, t)}
      header={
        <VicePrincipalHeader
          variant="back"
          title="Calendar & Events"
          onBack={() => handleVpTabPress(navigation, 'home')}
          actionIcon="event"
          onAction={() => {}}
        />
      }
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.calendarCard}>
          <View style={styles.monthRow}>
            <Text style={styles.month}>June 2025</Text>
            <View style={styles.monthNav}>
              <TouchableOpacity><MaterialIcons name="chevron-left" size={22} color={colors.onSurfaceVariant} /></TouchableOpacity>
              <TouchableOpacity><MaterialIcons name="chevron-right" size={22} color={colors.onSurfaceVariant} /></TouchableOpacity>
            </View>
          </View>
          <View style={styles.grid}>
            {DAY_LABELS.map((d, i) => (
              <Text key={`lbl-${i}`} style={styles.dayLbl}>{d}</Text>
            ))}
            {calendarGridDays.map((cell, i) => (
              <View key={i} style={styles.dayCell}>
                {cell.today ? (
                  <View style={styles.todayCircle}>
                    <Text style={styles.todayText}>{cell.day}</Text>
                  </View>
                ) : (
                  <Text style={[styles.dayNum, cell.muted && styles.dayMuted]}>{cell.day}</Text>
                )}
                {cell.dots ? (
                  <View style={styles.dotRow}>
                    {cell.dots.map((c, j) => (
                      <View key={j} style={[styles.dot, { backgroundColor: c }]} />
                    ))}
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.viewToggle}>
          {VIEW_MODES.map((m, i) => (
            <TouchableOpacity
              key={m}
              style={[styles.viewBtn, viewMode === i && styles.viewBtnActive]}
              onPress={() => setViewMode(i)}
            >
              <Text style={[styles.viewText, viewMode === i && styles.viewTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.timelineHead}>
          <Text style={styles.timelineTitle}>Today · Tuesday, 10 June</Text>
          <View style={styles.eventCount}><Text style={styles.eventCountText}>4 Events</Text></View>
        </View>

        <View style={styles.timeline}>
          {todayTimelineEvents.map((e) => (
            <View key={e.id} style={styles.eventRow}>
              <Text style={styles.eventTime}>{e.time}</Text>
              <View style={[styles.eventCard, { backgroundColor: e.bg, borderColor: e.border }]}>
                <Text style={[styles.eventTitle, { color: e.titleColor }]}>{e.title}</Text>
                <View style={styles.eventLoc}>
                  <MaterialIcons name="location-on" size={16} color={e.metaColor} />
                  <Text style={[styles.eventLocText, { color: e.metaColor }]}>{e.location}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenShell>
  );
}

function createStyles(colors: VicePrincipalColorScheme) {
  return StyleSheet.create({
    content: { padding: spacing.md, gap: spacing.lg, paddingBottom: 32 },
    calendarCard: {
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: `${colors.outlineVariant}4d`,
      padding: spacing.md,
    },
    monthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    month: { ...textStyle('titleLg'), color: colors.onSurface },
    monthNav: { flexDirection: 'row', gap: 4 },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    dayLbl: { width: '14.28%', textAlign: 'center', ...textStyle('labelMd'), color: colors.onSurfaceVariant, marginBottom: 8 },
    dayCell: { width: '14.28%', alignItems: 'center', paddingVertical: 8, minHeight: 44 },
    dayNum: { ...textStyle('bodyMd'), color: colors.onSurface },
    dayMuted: { opacity: 0.4 },
    todayCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    todayText: { ...textStyle('bodyMd'), color: colors.onPrimary, fontWeight: '700' },
    dotRow: { flexDirection: 'row', gap: 2, marginTop: 4 },
    dot: { width: 4, height: 4, borderRadius: 2 },
    viewToggle: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceContainerHigh,
      borderRadius: 999,
      padding: 4,
    },
    viewBtn: { flex: 1, paddingVertical: 8, borderRadius: 999, alignItems: 'center' },
    viewBtnActive: { backgroundColor: colors.surfaceContainerLowest },
    viewText: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
    viewTextActive: { color: colors.primary, fontWeight: '600' },
    timelineHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    timelineTitle: { ...textStyle('titleLg'), color: colors.onSurface },
    eventCount: { backgroundColor: `${colors.primary}1a`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
    eventCountText: { ...textStyle('labelMd'), color: colors.primary, fontWeight: '600' },
    timeline: { gap: spacing.lg, paddingLeft: spacing.md },
    eventRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
    eventTime: { width: 56, ...textStyle('labelMd'), color: colors.onSurfaceVariant, paddingTop: 4 },
    eventCard: { flex: 1, borderWidth: 1, borderRadius: 12, padding: spacing.md },
    eventTitle: { ...textStyle('bodyLg'), fontWeight: '600', marginBottom: 4 },
    eventLoc: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    eventLocText: { ...textStyle('bodyMd') },
  });
}
