import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { PrincipalHeader } from '../components/PrincipalHeader';
import { ScreenShell } from '../components/ScreenShell';
import { Card } from '../components/ui';
import { timetableClasses, timetableConflicts } from '../data/mockData';
import { spacing, textStyle, usePrincipalTheme, useThemedStyles } from '@/designations/principal/theme';
import type { PrincipalColorScheme } from '@/designations/principal/theme/colors';

const VIEWS = ['Class View', 'Teacher View', 'Room View'] as const;
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PERIODS = ['P1', 'P2', 'P3', 'Lunch', 'P4'];

const SAMPLE_GRID: Record<string, Record<string, { subject: string; teacher: string; room: string; conflict?: boolean }>> = {
  Mon: { P1: { subject: 'Math', teacher: 'AR', room: 'R204' }, P2: { subject: 'Science', teacher: 'KS', room: 'Lab1' }, P3: { subject: 'English', teacher: 'MP', room: 'R102' }, P4: { subject: 'Social', teacher: 'DP', room: 'R205' } },
  Tue: { P1: { subject: 'Hindi', teacher: 'SM', room: 'R301' }, P2: { subject: 'PE', teacher: 'JN', room: 'Ground' }, P3: { subject: 'Math', teacher: 'AR', room: 'R204', conflict: true }, P4: { subject: 'Free', teacher: '—', room: '—' } },
  Wed: { P1: { subject: 'Science', teacher: 'KS', room: 'Lab1' }, P2: { subject: 'Math', teacher: 'AR', room: 'R204' }, P3: { subject: 'English', teacher: 'MP', room: 'R102' }, P4: { subject: 'Computer', teacher: 'DK', room: 'Lab2' } },
  Thu: { P1: { subject: 'Social', teacher: 'DP', room: 'R205' }, P2: { subject: 'Hindi', teacher: 'SM', room: 'R301' }, P3: { subject: 'Science', teacher: 'KS', room: 'Lab1' }, P4: { subject: 'Math', teacher: 'AR', room: 'R204' } },
  Fri: { P1: { subject: 'English', teacher: 'MP', room: 'R102' }, P2: { subject: 'PE', teacher: 'JN', room: 'Ground' }, P3: { subject: 'Art', teacher: 'LS', room: 'R110' }, P4: { subject: 'Library', teacher: '—', room: 'Lib' } },
  Sat: { P1: { subject: 'Remedial', teacher: 'AR', room: 'R204' }, P2: { subject: 'Club', teacher: '—', room: 'Hall' }, P3: { subject: '—', teacher: '—', room: '—' }, P4: { subject: '—', teacher: '—', room: '—' } },
};

function cellColors(palette: PrincipalColorScheme): Record<string, string> {
  return {
    Math: '#eff6ff',
    Science: '#f0fdf9',
    English: '#fdf4ff',
    Hindi: '#fffbeb',
    Social: '#fff0f0',
    PE: '#f0fdf9',
    Free: palette.surfaceContainerLow,
    Computer: '#eff6ff',
    Art: '#fdf4ff',
    Remedial: '#fffbeb',
    Club: '#f0fdf9',
    Library: palette.surfaceContainerLow,
    '—': palette.surfaceContainerLow,
  };
}

export function TimetableManagementScreen() {
  const { colors } = usePrincipalTheme();
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation();
  const [view, setView] = useState<(typeof VIEWS)[number]>('Class View');
  const [selectedClass, setSelectedClass] = useState<(typeof timetableClasses)[number]>('Grade 10A');

  return (
    <ScreenShell
      header={
        <PrincipalHeader
          title="Timetable Management"
          onBack={() => navigation.goBack()}
          right={
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <MaterialIcons name="edit" size={22} color={colors.onSurfaceVariant} />
              <MaterialIcons name="download" size={22} color={colors.onSurfaceVariant} />
            </View>
          }
        />
      }
    >
      <View style={styles.content}>
        <View style={styles.viewToggle}>
          {VIEWS.map((v) => (
            <TouchableOpacity key={v} style={[styles.viewChip, view === v && styles.viewActive]} onPress={() => setView(v)}>
              <Text style={[styles.viewText, view === v && styles.viewTextActive]}>{v}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.classRow}>
          {timetableClasses.map((c) => (
            <TouchableOpacity key={c} style={[styles.classChip, selectedClass === c && styles.classActive]} onPress={() => setSelectedClass(c)}>
              <Text style={[styles.classText, selectedClass === c && styles.classTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            <View style={styles.gridHead}>
              <View style={styles.cornerCell} />
              {DAYS.map((d) => (
                <View key={d} style={styles.headCell}><Text style={styles.headText}>{d}</Text></View>
              ))}
            </View>
            {PERIODS.map((p) => (
              <View key={p} style={styles.gridRow}>
                <View style={styles.periodCell}>
                  <Text style={styles.periodText}>{p === 'Lunch' ? 'LUNCH' : p}</Text>
                </View>
                {p === 'Lunch' ? (
                  <View style={[styles.lunchCell, { width: DAYS.length * 88 }]}>
                    <Text style={styles.lunchText}>LUNCH</Text>
                  </View>
                ) : (
                  DAYS.map((d) => {
                    const cell = SAMPLE_GRID[d]?.[p];
                    if (!cell) return <View key={d} style={styles.emptyCell} />;
                    const palette = cellColors(colors);
                    const bg = cell.conflict ? '#fff0f0' : (palette[cell.subject] ?? colors.surfaceContainerLow);
                    return (
                      <View key={d} style={[styles.slotCell, { backgroundColor: bg }, cell.conflict && styles.conflictCell]}>
                        {cell.conflict ? <MaterialIcons name="warning" size={14} color={colors.dangerText} style={styles.conflictIcon} /> : null}
                        <Text style={styles.slotSubject}>{cell.subject}</Text>
                        <Text style={styles.slotMeta}>{cell.teacher}/{cell.room}</Text>
                      </View>
                    );
                  })
                )}
              </View>
            ))}
          </View>
        </ScrollView>

        <Card style={styles.conflictBanner}>
          <MaterialIcons name="warning" size={20} color={colors.dangerText} />
          <View style={{ flex: 1 }}>
            {timetableConflicts.map((c) => (
              <Text key={c} style={styles.conflictLine}>{c}</Text>
            ))}
          </View>
          <TouchableOpacity style={styles.resolveBtn} onPress={() => Alert.alert('Resolve', 'Opening conflict resolver.')}>
            <Text style={styles.resolveText}>Resolve Conflicts</Text>
          </TouchableOpacity>
        </Card>
      </View>
    </ScreenShell>
  );
}

const CELL_W = 88;

function createStyles(colors: PrincipalColorScheme) {
  return StyleSheet.create({
  content: { padding: spacing.gutter, gap: spacing.md, paddingBottom: 32 },
  viewToggle: { flexDirection: 'row', backgroundColor: colors.surfaceContainerLow, borderRadius: 12, padding: 4 },
  viewChip: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  viewActive: { backgroundColor: colors.surfaceContainerLowest },
  viewText: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  viewTextActive: { color: colors.primary, fontWeight: '700' },
  classRow: { gap: spacing.sm },
  classChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.outlineVariant },
  classActive: { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer },
  classText: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  classTextActive: { color: colors.onPrimary, fontWeight: '700' },
  gridHead: { flexDirection: 'row' },
  cornerCell: { width: 48, height: 36 },
  headCell: { width: CELL_W, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.green50 },
  headText: { ...textStyle('chip10'), fontWeight: '700' },
  gridRow: { flexDirection: 'row', alignItems: 'center' },
  periodCell: { width: 48, height: 64, alignItems: 'center', justifyContent: 'center' },
  periodText: { ...textStyle('chip10'), fontWeight: '700', color: colors.onSurfaceVariant },
  slotCell: { width: CELL_W, height: 64, borderWidth: 1, borderColor: colors.outlineVariant, padding: 4, justifyContent: 'center' },
  conflictCell: { borderColor: colors.dangerText, borderWidth: 2 },
  conflictIcon: { position: 'absolute', top: 2, right: 2 },
  emptyCell: { width: CELL_W, height: 64 },
  lunchCell: { height: 36, backgroundColor: '#fff7ed', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.outlineVariant },
  lunchText: { ...textStyle('chip10'), fontWeight: '700', color: colors.orange500 },
  slotSubject: { ...textStyle('chip10'), fontWeight: '700' },
  slotMeta: { ...textStyle('chip10'), color: colors.onSurfaceVariant, fontSize: 8 },
  conflictBanner: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: '#fff0f0', borderColor: colors.dangerText },
  conflictLine: { ...textStyle('labelMd'), color: colors.onSurface },
  resolveBtn: { backgroundColor: colors.dangerText, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  resolveText: { ...textStyle('chip10'), color: colors.onPrimary, fontWeight: '700' },
});
}
