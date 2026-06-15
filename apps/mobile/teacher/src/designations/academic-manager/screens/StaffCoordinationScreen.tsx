import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ManagerHeader } from '../components/ManagerHeader';
import { ScreenShell } from '../components/ScreenShell';
import { Card } from '../components/ui';
import { SUBSTITUTE_CANDIDATES, staffList } from '../data/mockData';
import type { SubstitutionItem } from '../data/mockData';
import { getPendingSubstitutionCount, useSubstitutionsStore } from '../store/substitutionsStore';
import { formatLongDate } from '@/utils/datetime';
import { colors, spacing, textStyle } from '@/designations/academic-manager/theme';

function openAssignDialog(
  item: SubstitutionItem,
  assign: (id: string, teacher: string) => void,
  markFreePeriod: (id: string) => void,
) {
  if (item.status === 'assigned' && item.teacher !== 'Free Period' && item.teacher !== 'Pending') {
    Alert.alert(`${item.grade} · ${item.subject}`, `Substitute: ${item.teacher}`);
    return;
  }

  Alert.alert(
    `Assign — ${item.grade}`,
    `${item.subject} · ${item.period}${item.absentTeacher ? `\nCovering for ${item.absentTeacher}` : ''}`,
    [
      { text: 'Cancel', style: 'cancel' },
      ...SUBSTITUTE_CANDIDATES.map((name) => ({
        text: name,
        onPress: () => {
          assign(item.id, name);
          Alert.alert('Substitute assigned', `${name} will cover ${item.subject} (${item.grade}).`);
        },
      })),
      {
        text: 'Mark as free period',
        onPress: () => {
          markFreePeriod(item.id);
          Alert.alert('Updated', 'Period marked as free — no substitute needed.');
        },
      },
    ],
  );
}

export function StaffCoordinationScreen() {
  const navigation = useNavigation();
  const [filter, setFilter] = useState('All');
  const [section, setSection] = useState<'staff' | 'substitutions'>('substitutions');
  const substitutionItems = useSubstitutionsStore((s) => s.items);
  const assign = useSubstitutionsStore((s) => s.assign);
  const markFreePeriod = useSubstitutionsStore((s) => s.markFreePeriod);
  const pendingCount = getPendingSubstitutionCount(substitutionItems);

  const filteredStaff = useMemo(() => {
    if (filter === 'All') return staffList;
    if (filter === 'Substitute') return staffList.filter((s) => s.status === 'On Leave' || s.status === 'Absent');
    return staffList.filter((s) => s.status === filter);
  }, [filter]);

  const pendingSubs = substitutionItems.filter((s) => s.status === 'pending');

  const handleFab = () => {
    const next = pendingSubs[0];
    if (!next) {
      Alert.alert('All covered', 'No pending substitutions right now.');
      return;
    }
    openAssignDialog(next, assign, markFreePeriod);
  };

  return (
    <ScreenShell scroll={false} paddingBottom={0}>
      <ManagerHeader
        title="Staff Coordination"
        onBack={() => navigation.goBack()}
        right={
          <View style={styles.headerRight}>
            <MaterialIcons name="search" size={22} color={colors.onSurfaceVariant} />
            <View style={styles.todayPill}>
              <Text style={styles.todayText}>Today</Text>
            </View>
          </View>
        }
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.dateLine}>{formatLongDate()}</Text>

        <View style={styles.sectionTabs}>
          <TouchableOpacity
            style={[styles.sectionTab, section === 'substitutions' && styles.sectionActive]}
            onPress={() => setSection('substitutions')}
          >
            <Text style={[styles.sectionText, section === 'substitutions' && styles.sectionTextActive]}>
              Substitutions{pendingCount > 0 ? ` (${pendingCount})` : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sectionTab, section === 'staff' && styles.sectionActive]}
            onPress={() => setSection('staff')}
          >
            <Text style={[styles.sectionText, section === 'staff' && styles.sectionTextActive]}>Staff</Text>
          </TouchableOpacity>
        </View>

        {section === 'substitutions' ? (
          <>
            {pendingCount > 0 ? (
              <View style={styles.alertBanner}>
                <MaterialIcons name="warning" size={20} color={colors.error} />
                <Text style={styles.alertText}>
                  {pendingCount} substitution{pendingCount === 1 ? '' : 's'} need assignment
                </Text>
              </View>
            ) : (
              <Text style={styles.allClear}>All substitutions are assigned.</Text>
            )}
            {substitutionItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                onPress={() => openAssignDialog(item, assign, markFreePeriod)}
              >
                <Card
                  style={
                    item.urgent && item.status === 'pending'
                      ? { ...styles.subCard, ...styles.subUrgent }
                      : styles.subCard
                  }
                >
                  <View style={styles.subHead}>
                    <Text style={styles.subGrade}>{item.grade}</Text>
                    <Text style={[styles.subStatus, item.status === 'pending' ? styles.subPending : styles.subDone]}>
                      {item.status === 'pending' ? (item.urgent ? 'URGENT' : 'Pending') : 'Assigned'}
                    </Text>
                  </View>
                  <Text style={styles.subSubject}>
                    {item.subject} · {item.period}
                  </Text>
                  <Text style={styles.subTeacher}>
                    {item.status === 'pending' ? `Assign: ${item.teacher}` : `Substitute: ${item.teacher}`}
                  </Text>
                  {item.absentTeacher ? <Text style={styles.subAbsent}>Covering for {item.absentTeacher}</Text> : null}
                  {item.status === 'pending' ? (
                    <Text style={styles.subAction}>Tap to assign substitute</Text>
                  ) : null}
                </Card>
              </TouchableOpacity>
            ))}
          </>
        ) : (
          <>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Today's Staff Attendance</Text>
              <View style={styles.summaryStats}>
                <View>
                  <Text style={[styles.statVal, { color: colors.primary }]}>42</Text>
                  <Text style={styles.statLbl}>Present</Text>
                </View>
                <View>
                  <Text style={[styles.statVal, { color: colors.tertiary }]}>3</Text>
                  <Text style={styles.statLbl}>On Leave</Text>
                </View>
                <View>
                  <Text style={[styles.statVal, { color: colors.error }]}>2</Text>
                  <Text style={styles.statLbl}>Absent</Text>
                </View>
                <View>
                  <Text style={styles.statVal}>{pendingCount}</Text>
                  <Text style={styles.statLbl}>Substitutes</Text>
                </View>
              </View>
              <Text style={styles.total}>Total 51 staff</Text>
            </Card>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
              {['All', 'Present', 'On Leave', 'Absent', 'Substitute'].map((f) => (
                <TouchableOpacity key={f} style={[styles.chip, filter === f && styles.chipActive]} onPress={() => setFilter(f)}>
                  <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {filteredStaff.length === 0 ? (
              <Text style={styles.allClear}>No staff in this filter.</Text>
            ) : (
              filteredStaff.map((s) => (
                <Card key={s.name} style={styles.staffCard}>
                  <View style={styles.staffHead}>
                    <View>
                      <Text style={styles.staffName}>{s.name}</Text>
                      <Text style={styles.staffRole}>{s.role}</Text>
                    </View>
                    <Text
                      style={[
                        styles.status,
                        s.status === 'Present' && { color: colors.primary },
                        s.status === 'On Leave' && { color: colors.tertiary },
                        s.status === 'Absent' && { color: colors.error },
                      ]}
                    >
                      {s.status}
                    </Text>
                  </View>
                  <Text style={styles.staffDetail}>{s.detail}</Text>
                  {s.status === 'Absent' || s.status === 'On Leave' ? (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => {
                        const pending = pendingSubs.find((p) => p.absentTeacher === s.name);
                        if (pending) openAssignDialog(pending, assign, markFreePeriod);
                        else Alert.alert(s.name, 'No open substitution slot linked to this teacher.');
                      }}
                    >
                      <Text style={styles.actionText}>Assign Substitute</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => Alert.alert(s.name, `${s.detail}\nSchedule synced with timetable.`)}
                    >
                      <Text style={styles.actionText}>View Schedule</Text>
                    </TouchableOpacity>
                  )}
                </Card>
              ))
            )}
          </>
        )}
      </ScrollView>
      <TouchableOpacity style={styles.fab} onPress={handleFab} activeOpacity={0.85}>
        <MaterialIcons name="person-add" size={24} color={colors.onPrimary} />
      </TouchableOpacity>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.gutter, gap: 12, paddingBottom: 88 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  todayPill: { backgroundColor: colors.primaryContainer, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  todayText: { ...textStyle('chip10'), color: colors.onPrimaryContainer },
  dateLine: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant },
  sectionTabs: { flexDirection: 'row', gap: 8, backgroundColor: colors.surfaceContainerLow, borderRadius: 12, padding: 4 },
  sectionTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  sectionActive: { backgroundColor: colors.surfaceContainerLowest },
  sectionText: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  sectionTextActive: { color: colors.primary, fontWeight: '700' },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.errorContainer,
    padding: 12,
    borderRadius: 12,
  },
  alertText: { ...textStyle('bodyMd'), color: colors.onErrorContainer, fontWeight: '600', flex: 1 },
  allClear: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant, fontStyle: 'italic' },
  subCard: { gap: 6 },
  subUrgent: { borderWidth: 2, borderColor: colors.error, backgroundColor: `${colors.errorContainer}33` },
  subHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subGrade: { ...textStyle('bodyMd'), fontWeight: '700' },
  subStatus: { ...textStyle('chip10'), fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  subPending: { backgroundColor: colors.errorContainer, color: colors.onErrorContainer },
  subDone: { backgroundColor: colors.secondaryContainer, color: colors.onSecondaryContainer },
  subSubject: { ...textStyle('bodyMd'), fontWeight: '600' },
  subTeacher: { ...textStyle('labelMd'), color: colors.primary },
  subAbsent: { ...textStyle('chip10'), color: colors.onSurfaceVariant },
  subAction: { ...textStyle('chip10'), color: colors.primaryContainer, fontWeight: '700', marginTop: 4 },
  summaryCard: { gap: 12 },
  summaryTitle: { ...textStyle('bodyMd'), fontWeight: '700' },
  summaryStats: { flexDirection: 'row', justifyContent: 'space-around' },
  statVal: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  statLbl: { ...textStyle('chip10'), color: colors.onSurfaceVariant, textTransform: 'uppercase', textAlign: 'center' },
  total: { ...textStyle('chip10'), color: colors.onSurfaceVariant, textAlign: 'center' },
  filters: { gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.outlineVariant },
  chipActive: { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer },
  chipText: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  chipTextActive: { color: colors.onPrimaryContainer },
  staffCard: { gap: 8 },
  staffHead: { flexDirection: 'row', justifyContent: 'space-between' },
  staffName: { ...textStyle('bodyMd'), fontWeight: '700' },
  staffRole: { ...textStyle('chip10'), color: colors.onSurfaceVariant },
  status: { ...textStyle('chip10'), fontWeight: '700' },
  staffDetail: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant },
  actionBtn: { borderWidth: 1, borderColor: colors.primary, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  actionText: { ...textStyle('chip10'), color: colors.primary, fontWeight: '700' },
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
