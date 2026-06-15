import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Switch } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { VicePrincipalHeader } from '../components/VicePrincipalHeader';
import { ScreenShell } from '../components/ScreenShell';
import {
  availableTeachers,
  initialSchedulePeriods,
  scheduleDays,
  substituteSuggestions,
  type SchedulePeriod,
} from '../data/mockData';
import { handleVpTabPress } from '../navigation/navigationHelpers';
import type { VicePrincipalStackParamList } from '../navigation/types';
import { spacing, textStyle, useThemedStyles, useVicePrincipalTheme } from '../theme';
import type { VicePrincipalColorScheme } from '../theme/colors';

function clonePeriods(): SchedulePeriod[] {
  return initialSchedulePeriods.map((p) => ({ ...p }));
}

export function TimetableSubstitutionScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<VicePrincipalStackParamList>>();
  const { colors } = useVicePrincipalTheme();
  const styles = useThemedStyles(createStyles);

  const [selectedDay, setSelectedDay] = useState('Tue');
  const [periods, setPeriods] = useState<SchedulePeriod[]>(clonePeriods);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [assigningPeriodId, setAssigningPeriodId] = useState<string | null>(null);
  const [aiSuggest, setAiSuggest] = useState(true);
  const [selectedSub, setSelectedSub] = useState(substituteSuggestions[0].id);

  const unassignedCount = useMemo(() => periods.filter((p) => p.status === 'unassigned').length, [periods]);
  const assigningPeriod = useMemo(
    () => (assigningPeriodId ? periods.find((p) => p.id === assigningPeriodId) : undefined),
    [assigningPeriodId, periods],
  );

  const visibleSuggestions = useMemo(() => {
    if (!aiSuggest || !assigningPeriod) return substituteSuggestions;
    const periodCode = assigningPeriod.period;
    const filtered = substituteSuggestions.filter((s) => s.fit.includes(periodCode));
    return filtered.length > 0 ? filtered : substituteSuggestions;
  }, [aiSuggest, assigningPeriod]);

  const openSheet = (periodId: string) => {
    setAssigningPeriodId(periodId);
    const best = substituteSuggestions.find((s) => s.selected) ?? substituteSuggestions[0];
    setSelectedSub(best.id);
    setSheetOpen(true);
  };

  const openFirstUnassigned = () => {
    const first = periods.find((p) => p.status === 'unassigned');
    if (first) openSheet(first.id);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setAssigningPeriodId(null);
  };

  const confirmAssignment = () => {
    if (!assigningPeriodId) return;
    const sub = substituteSuggestions.find((s) => s.id === selectedSub) ?? substituteSuggestions[0];
    setPeriods((prev) =>
      prev.map((p) =>
        p.id === assigningPeriodId
          ? { ...p, status: 'substitute', substitute: sub.name }
          : p,
      ),
    );
    closeSheet();
  };

  return (
    <ScreenShell
      activeTab="schedule"
      onTabPress={(t) => handleVpTabPress(navigation, t)}
      header={
        <VicePrincipalHeader
          variant="back"
          title="Timetable & Substitution"
          onBack={() => handleVpTabPress(navigation, 'home')}
        />
      }
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayRow}>
          {scheduleDays.map((d) => {
            const active = d === selectedDay;
            return (
              <TouchableOpacity
                key={d}
                style={[styles.dayChip, active && styles.dayChipActive]}
                onPress={() => setSelectedDay(d)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayText, active && styles.dayTextActive]}>{d}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {unassignedCount > 0 ? (
          <View style={styles.alertBanner}>
            <View style={styles.alertIcon}>
              <MaterialIcons name="warning" size={22} color="#f59e0b" />
            </View>
            <Text style={styles.alertText}>
              {unassignedCount} period{unassignedCount === 1 ? '' : 's'} unassigned today — substitution needed
            </Text>
            <TouchableOpacity onPress={openFirstUnassigned}>
              <Text style={styles.fixNow}>Fix Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.successBanner}>
            <MaterialIcons name="check-circle" size={22} color={colors.primary} />
            <Text style={styles.successText}>All periods covered for today</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Available for Substitution</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.teacherRow}>
          {availableTeachers.map((t) => (
            <View key={t.id} style={styles.teacherChip}>
              <Image source={{ uri: t.avatar }} style={styles.teacherAvatar} contentFit="cover" />
              <View>
                <Text style={styles.teacherName}>{t.name}</Text>
                <Text style={styles.teacherFree}>{t.free}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Today's Schedule</Text>
        {periods.map((p) => (
          <PeriodCard key={p.id} period={p} onAssign={() => openSheet(p.id)} />
        ))}
      </ScrollView>

      <Modal visible={sheetOpen} transparent animationType="slide" onRequestClose={closeSheet}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={closeSheet}>
          <TouchableOpacity activeOpacity={1} style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHead}>
              <View>
                <Text style={styles.sheetTitle}>Assign Substitute</Text>
                <Text style={styles.sheetSub}>
                  {assigningPeriod
                    ? `${assigningPeriod.period} • ${assigningPeriod.className} • ${assigningPeriod.subject}`
                    : 'Select a period'}
                </Text>
              </View>
              <TouchableOpacity onPress={closeSheet} style={styles.sheetClose}>
                <MaterialIcons name="close" size={18} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            <View style={styles.aiRow}>
              <View style={styles.aiLeft}>
                <MaterialIcons name="auto-awesome" size={20} color={colors.primary} />
                <Text style={styles.aiText}>AI-Auto Suggest Best Fit</Text>
              </View>
              <Switch
                value={aiSuggest}
                onValueChange={(v) => {
                  setAiSuggest(v);
                  const list = v && assigningPeriod
                    ? substituteSuggestions.filter((s) => s.fit.includes(assigningPeriod.period))
                    : substituteSuggestions;
                  if (list.length > 0 && !list.some((s) => s.id === selectedSub)) {
                    setSelectedSub(list[0].id);
                  }
                }}
                trackColor={{ true: colors.primaryContainer, false: colors.surfaceVariant }}
                thumbColor={colors.onPrimary}
              />
            </View>
            <Text style={styles.availableLbl}>AVAILABLE TEACHERS ({visibleSuggestions.length})</Text>
            {visibleSuggestions.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.sugCard, selectedSub === s.id && styles.sugCardActive]}
                onPress={() => setSelectedSub(s.id)}
              >
                <View style={styles.sugLeft}>
                  <Image source={{ uri: s.avatar }} style={styles.sugAvatar} contentFit="cover" />
                  <View>
                    <Text style={styles.sugName}>{s.name}</Text>
                    <Text style={[styles.sugFit, selectedSub === s.id && { color: colors.primary }]}>{s.fit}</Text>
                  </View>
                </View>
                <View style={[styles.radio, selectedSub === s.id && styles.radioActive]}>
                  {selectedSub === s.id ? <View style={styles.radioDot} /> : null}
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.confirmBtn} onPress={confirmAssignment}>
              <Text style={styles.confirmText}>Confirm Assignment</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScreenShell>
  );
}

function PeriodCard({ period, onAssign }: { period: SchedulePeriod; onAssign: () => void }) {
  const { colors } = useVicePrincipalTheme();
  const styles = useThemedStyles(createStyles);
  const unassigned = period.status === 'unassigned';

  return (
    <View style={[styles.periodCard, unassigned && styles.periodUnassigned]}>
      {unassigned ? <View style={styles.periodAccent} /> : null}
      <View style={[styles.periodSide, unassigned && styles.periodSideAlert]}>
        <Text style={[styles.periodLbl, unassigned && { color: colors.error }]}>{period.period}</Text>
        <Text style={styles.periodTime}>{period.time}</Text>
      </View>
      <View style={styles.periodBody}>
        <View style={styles.periodTop}>
          <View style={{ flex: 1 }}>
            <View style={styles.periodMeta}>
              <View style={[styles.classBadge, unassigned && { backgroundColor: colors.error }]}>
                <Text style={[styles.classBadgeText, unassigned && { color: colors.onError }]}>{period.className}</Text>
              </View>
              <Text style={styles.subjectText}>{period.subject}</Text>
            </View>
            {period.status === 'substitute' ? (
              <View>
                <Text style={styles.struckTeacher}>{period.teacher}</Text>
                <Text style={styles.subTeacher}>{period.substitute}</Text>
              </View>
            ) : period.status === 'running' && period.teacherAvatar ? (
              <View style={styles.teacherRowSmall}>
                <Image source={{ uri: period.teacherAvatar }} style={styles.tinyAvatar} contentFit="cover" />
                <Text style={styles.teacherSmall}>{period.teacher}</Text>
              </View>
            ) : (
              <Text style={[styles.teacherLine, unassigned && { color: colors.error, fontWeight: '500' }]}>{period.teacher}</Text>
            )}
            {period.room ? (
              <View style={styles.roomBadge}>
                <Text style={styles.roomText}>{period.room}</Text>
              </View>
            ) : null}
          </View>
          {period.status !== 'unassigned' ? (
            <View style={styles.periodRight}>
              <View style={[styles.statusPill, period.status === 'running' ? styles.runningPill : styles.subPill]}>
                <Text style={[styles.statusText, period.status === 'running' ? styles.runningText : styles.subText]}>
                  {period.status === 'running' ? 'Running' : 'Substitute'}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={18} color={colors.onSurfaceVariant} />
            </View>
          ) : null}
        </View>
        {unassigned ? (
          <View style={styles.assignBox}>
            <Text style={styles.noSubText}>No substitute assigned</Text>
            <TouchableOpacity style={styles.assignBtn} onPress={onAssign}>
              <Text style={styles.assignBtnText}>Assign Substitute</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function createStyles(colors: VicePrincipalColorScheme) {
  return StyleSheet.create({
    content: { padding: spacing.gutter, gap: spacing.lg, paddingBottom: 32 },
    dayRow: { gap: 12, paddingVertical: 8 },
    dayChip: {
      paddingHorizontal: 20,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      backgroundColor: colors.surfaceContainerLowest,
    },
    dayChipActive: { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer },
    dayText: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
    dayTextActive: { color: colors.onPrimary },
    alertBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: '#fff7ed',
      borderWidth: 1,
      borderColor: '#ffedd5',
      borderRadius: 16,
      padding: spacing.md,
    },
    successBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: '#ecfdf5',
      borderWidth: 1,
      borderColor: '#d1fae5',
      borderRadius: 16,
      padding: spacing.md,
    },
    successText: { ...textStyle('bodyMd'), color: '#065f46', fontWeight: '500' },
    alertIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center' },
    alertText: { flex: 1, fontSize: 13, fontWeight: '500', color: '#92400e' },
    fixNow: { fontSize: 13, fontWeight: '700', color: colors.primaryContainer },
    sectionTitle: { ...textStyle('titleLg'), color: colors.onSurface, paddingHorizontal: 4 },
    teacherRow: { gap: 16, paddingBottom: 4 },
    teacherChip: {
      width: 192,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: '#f1f5f9',
      borderRadius: 16,
      padding: 12,
    },
    teacherAvatar: { width: 40, height: 40, borderRadius: 20 },
    teacherName: { ...textStyle('labelMd'), fontWeight: '700', color: colors.onSurface },
    teacherFree: { fontSize: 11, color: colors.onSurfaceVariant },
    periodCard: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: '#f1f5f9',
      borderRadius: 16,
      overflow: 'hidden',
    },
    periodUnassigned: { backgroundColor: '#fef9f9', borderColor: colors.errorContainer },
    periodAccent: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 4, backgroundColor: colors.error },
    periodSide: {
      width: 64,
      backgroundColor: colors.surfaceContainerLow,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 8,
    },
    periodSideAlert: { backgroundColor: 'rgba(254,226,226,0.3)' },
    periodLbl: { ...textStyle('headlineMd'), fontWeight: '700', color: colors.primary },
    periodTime: { fontSize: 10, color: colors.onSurfaceVariant, textTransform: 'uppercase' },
    periodBody: { flex: 1, padding: spacing.md, gap: 12 },
    periodTop: { flexDirection: 'row', justifyContent: 'space-between' },
    periodMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    classBadge: { backgroundColor: colors.primaryFixed, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    classBadgeText: { fontSize: 10, fontWeight: '700', color: colors.onPrimaryContainer },
    subjectText: { ...textStyle('labelMd'), fontWeight: '600', color: colors.onSurface },
    struckTeacher: { ...textStyle('bodyMd'), color: colors.error, textDecorationLine: 'line-through' },
    subTeacher: { ...textStyle('bodyMd'), color: colors.primaryContainer, fontWeight: '500' },
    teacherLine: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant },
    roomBadge: { alignSelf: 'flex-start', marginTop: 4, backgroundColor: colors.surfaceVariant, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
    roomText: { fontSize: 11, color: colors.onSurfaceVariant },
    periodRight: { alignItems: 'flex-end', gap: 8 },
    statusPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
    runningPill: { backgroundColor: '#ecfdf5' },
    subPill: { backgroundColor: '#fff7ed' },
    statusText: { fontSize: 11, fontWeight: '700' },
    runningText: { color: '#065f46' },
    subText: { color: '#c2410c' },
    assignBox: {
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: colors.outlineVariant,
      borderRadius: 12,
      padding: 12,
      alignItems: 'center',
      gap: 8,
      backgroundColor: 'rgba(255,255,255,0.5)',
    },
    noSubText: { fontSize: 12, color: colors.onSurfaceVariant },
    assignBtn: { backgroundColor: colors.primaryContainer, paddingHorizontal: 24, paddingVertical: 8, borderRadius: 12 },
    assignBtnText: { ...textStyle('labelMd'), color: colors.onPrimary, fontWeight: '700' },
    teacherRowSmall: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    tinyAvatar: { width: 24, height: 24, borderRadius: 12 },
    teacherSmall: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: colors.surfaceContainerLowest, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: 32 },
    sheetHandle: { width: 48, height: 6, borderRadius: 3, backgroundColor: colors.surfaceVariant, alignSelf: 'center', marginBottom: spacing.lg },
    sheetHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
    sheetTitle: { ...textStyle('headlineMd'), color: colors.onSurface },
    sheetSub: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant },
    sheetClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
    aiRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: `${colors.primaryFixed}33`, borderRadius: 16, padding: spacing.md, marginBottom: spacing.lg },
    aiLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    aiText: { ...textStyle('labelMd'), color: colors.onPrimaryContainer },
    availableLbl: { ...textStyle('labelMd'), color: colors.onSurfaceVariant, marginBottom: spacing.md },
    sugCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.outlineVariant, marginBottom: 12 },
    sugCardActive: { borderColor: colors.primaryContainer, backgroundColor: `${colors.primaryFixed}1a` },
    sugLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    sugAvatar: { width: 32, height: 32, borderRadius: 16 },
    sugName: { ...textStyle('labelMd'), fontWeight: '700', color: colors.onSurface },
    sugFit: { fontSize: 11, color: colors.onSurfaceVariant },
    radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.outlineVariant, alignItems: 'center', justifyContent: 'center' },
    radioActive: { borderColor: colors.primaryContainer },
    radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primaryContainer },
    confirmBtn: { backgroundColor: colors.primaryContainer, paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: spacing.md },
    confirmText: { ...textStyle('headlineLgMobile'), color: colors.onPrimary },
  });
}
