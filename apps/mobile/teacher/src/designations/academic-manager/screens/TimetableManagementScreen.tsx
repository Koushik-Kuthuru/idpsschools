import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal, Pressable, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ManagerHeader } from '../components/ManagerHeader';
import { ScreenShell } from '../components/ScreenShell';
import {
  GRADE_FILTERS,
  TIMETABLE_SECTIONS,
  timetableSlots,
  type TimetableSlot,
} from '../data/mockData';
import { handleManagerTabPress } from '../navigation/navigationHelpers';
import type { ManagerStackParamList } from '../navigation/types';
import { addDays, formatLongDate, isSunday } from '@/utils/datetime';
import { colors, spacing, textStyle } from '@/designations/academic-manager/theme';

type ViewFilter = 'all' | 'conflicts' | 'substitutions';

export function TimetableManagementScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ManagerStackParamList>>();
  const [gradeFilter, setGradeFilter] = useState<(typeof GRADE_FILTERS)[number]>('All Classes');
  const [section, setSection] = useState<(typeof TIMETABLE_SECTIONS)[number]>('A');
  const [dayOffset, setDayOffset] = useState(0);
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [extraSlots, setExtraSlots] = useState<TimetableSlot[]>([]);
  const selectedDate = addDays(new Date(), dayOffset);
  const sundaySelected = isSunday(selectedDate);

  const allSlots = useMemo(() => [...timetableSlots, ...extraSlots], [extraSlots]);

  const visibleSlots = useMemo(() => {
    let slots = allSlots.filter((slot) => slot.section === section);
    if (gradeFilter !== 'All Classes') {
      slots = slots.filter((slot) => slot.gradeLabel === gradeFilter);
    }
    if (viewFilter === 'conflicts') {
      slots = slots.filter((slot) => slot.hasConflict);
    }
    if (viewFilter === 'substitutions') {
      slots = slots.filter((slot) => slot.sub);
    }
    return slots;
  }, [allSlots, gradeFilter, section, viewFilter]);

  const conflictCount = useMemo(
    () => allSlots.filter((s) => s.section === section && s.hasConflict && (gradeFilter === 'All Classes' || s.gradeLabel === gradeFilter)).length,
    [allSlots, gradeFilter, section],
  );

  const handleAddSlot = (type: 'period' | 'break' | 'substitute') => {
    if (sundaySelected) {
      Alert.alert('Sunday holiday', 'No classes can be scheduled on Sunday.');
      setShowAddModal(false);
      return;
    }
    const grade = gradeFilter === 'All Classes' ? 'Grade 2' : gradeFilter;
    const id = `extra-${Date.now()}`;
    const base = {
      id,
      gradeLabel: grade,
      section,
      room: type === 'break' ? '' : 'Room TBD',
      teacher: type === 'substitute' ? 'Substitute TBD' : type === 'break' ? '' : 'TBD',
      sub: type === 'substitute',
      isBreak: type === 'break',
    };
    const slot: TimetableSlot =
      type === 'break'
        ? { ...base, label: 'Break · 12:40–13:00', subject: 'Break' }
        : {
            ...base,
            label: 'P6 · 13:00–13:45',
            subject: type === 'substitute' ? 'Substitute Class' : 'New Period',
          };
    setExtraSlots((prev) => [...prev, slot]);
    setShowAddModal(false);
    Alert.alert('Slot added', `${slot.label} added to ${grade} Section ${section}.`);
  };

  const handleEdit = () => {
    Alert.alert('Edit timetable', 'Select a period card to update teacher or room.', [{ text: 'OK' }]);
  };

  const handlePeriodPress = (slot: TimetableSlot) => {
    if (slot.isBreak) return;
    Alert.alert(
      slot.subject,
      `${slot.teacher || 'Unassigned'} · ${slot.room}\n${slot.gradeLabel} Section ${slot.section}`,
      [
        { text: 'Close', style: 'cancel' },
        ...(slot.hasConflict
          ? [{ text: 'Resolve clash', onPress: () => Alert.alert('Clash resolved', 'Room reassigned for this period.') }]
          : []),
        { text: 'Assign substitute', onPress: () => navigation.navigate('StaffCoordination') },
      ],
    );
  };

  const filterLabel =
    viewFilter === 'conflicts' ? 'Conflicts' : viewFilter === 'substitutions' ? 'Substitutions' : 'All periods';

  return (
    <ScreenShell
      scroll={false}
      paddingBottom={0}
      activeTab="timetable"
      onTabPress={(t) => handleManagerTabPress(navigation, t)}
      header={
        <ManagerHeader
          title="Timetable"
          right={
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={handleEdit} activeOpacity={0.7}>
                <Text style={styles.editBtn}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowFilterModal(true)} activeOpacity={0.7}>
                <MaterialIcons
                  name="filter-list"
                  size={22}
                  color={viewFilter !== 'all' ? colors.primaryContainer : colors.onSurfaceVariant}
                />
              </TouchableOpacity>
            </View>
          }
        />
      }
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {conflictCount > 0 ? (
          <TouchableOpacity
            style={styles.conflictBanner}
            onPress={() => setViewFilter('conflicts')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="warning" size={20} color={colors.error} />
            <Text style={styles.conflictText}>
              {conflictCount} scheduling conflict{conflictCount === 1 ? '' : 's'} detected
            </Text>
          </TouchableOpacity>
        ) : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.classChips}>
          {GRADE_FILTERS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, gradeFilter === c && styles.chipActive]}
              onPress={() => setGradeFilter(c)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, gradeFilter === c && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sectionTabs}>
          {TIMETABLE_SECTIONS.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.sectionTab, section === s && styles.sectionActive]}
              onPress={() => setSection(s)}
              activeOpacity={0.7}
            >
              <Text style={[styles.sectionText, section === s && styles.sectionTextActive]}>Section {s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.filterHint}>
          {sundaySelected
            ? 'Sunday — no classes scheduled'
            : `${gradeFilter} · Section ${section} · ${filterLabel} · ${visibleSlots.length} slot${visibleSlots.length === 1 ? '' : 's'}`}
        </Text>

        <View style={styles.dateNav}>
          <TouchableOpacity onPress={() => setDayOffset((d) => d - 1)} activeOpacity={0.7}>
            <MaterialIcons name="chevron-left" size={22} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
          <Text style={styles.dateText}>{formatLongDate(selectedDate)}</Text>
          <TouchableOpacity onPress={() => setDayOffset((d) => d + 1)} activeOpacity={0.7}>
            <MaterialIcons name="chevron-right" size={22} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        {sundaySelected ? (
          <View style={styles.sundayBanner}>
            <MaterialIcons name="event-busy" size={22} color={colors.onSurfaceVariant} />
            <Text style={styles.sundayText}>No classes on Sunday — school holiday.</Text>
          </View>
        ) : visibleSlots.length === 0 ? (
          <Text style={styles.empty}>No periods for this class filter.</Text>
        ) : (
          visibleSlots.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.periodCard,
                p.isBreak && styles.breakCard,
                p.sub && styles.subCard,
                p.hasConflict && styles.conflictCard,
              ]}
              onPress={() => handlePeriodPress(p)}
              activeOpacity={p.isBreak ? 1 : 0.7}
            >
              <Text style={styles.periodLabel}>{p.label}</Text>
              <Text style={styles.periodSubject}>{p.subject}</Text>
              {!p.isBreak ? (
                <>
                  <Text style={styles.periodMeta}>
                    {p.teacher || 'Unassigned'} · {p.room}
                  </Text>
                  <Text style={styles.confirmedBadge}>
                    {p.gradeLabel} · Section {p.section}
                    {p.hasConflict ? ' · CLASH' : p.sub ? ' · SUB' : ''}
                  </Text>
                </>
              ) : null}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          if (sundaySelected) {
            Alert.alert('Sunday holiday', 'No classes can be scheduled on Sunday.');
            return;
          }
          setShowAddModal(true);
        }}
        activeOpacity={0.85}
      >
        <MaterialIcons name="add" size={28} color={colors.onPrimary} />
      </TouchableOpacity>

      <Modal visible={showFilterModal} transparent animationType="fade" onRequestClose={() => setShowFilterModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowFilterModal(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Filter periods</Text>
            {(['all', 'conflicts', 'substitutions'] as ViewFilter[]).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.modalRow, viewFilter === f && styles.modalRowActive]}
                onPress={() => {
                  setViewFilter(f);
                  setShowFilterModal(false);
                }}
              >
                <Text style={styles.modalRowText}>
                  {f === 'all' ? 'All periods' : f === 'conflicts' ? 'Conflicts only' : 'Substitutions only'}
                </Text>
                {viewFilter === f ? <MaterialIcons name="check" size={18} color={colors.primaryContainer} /> : null}
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowAddModal(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Add to timetable</Text>
            <Text style={styles.modalSub}>
              {gradeFilter === 'All Classes' ? 'Grade 2' : gradeFilter} · Section {section}
            </Text>
            {[
              { key: 'period' as const, label: 'Add teaching period', icon: 'menu-book' as const },
              { key: 'substitute' as const, label: 'Add substitute slot', icon: 'swap-horiz' as const },
              { key: 'break' as const, label: 'Add break', icon: 'free-breakfast' as const },
            ].map((opt) => (
              <TouchableOpacity key={opt.key} style={styles.modalRow} onPress={() => handleAddSlot(opt.key)}>
                <MaterialIcons name={opt.icon} size={20} color={colors.primaryContainer} />
                <Text style={styles.modalRowText}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.gutter, gap: 12, paddingBottom: 88 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  editBtn: { ...textStyle('bodyMd'), color: colors.primary, fontWeight: '600', fontSize: 12 },
  conflictBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.errorContainer, padding: 12, borderRadius: 8 },
  conflictText: { ...textStyle('bodyMd'), color: colors.onErrorContainer, fontWeight: '600', flex: 1 },
  classChips: { gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.outlineVariant },
  chipActive: { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer },
  chipText: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  chipTextActive: { color: colors.onPrimaryContainer },
  sectionTabs: { flexDirection: 'row', gap: 8 },
  sectionTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, backgroundColor: colors.surfaceContainerLow },
  sectionActive: { backgroundColor: colors.primaryContainer },
  sectionText: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  sectionTextActive: { color: colors.onPrimaryContainer, fontWeight: '600' },
  filterHint: { ...textStyle('chip10'), color: colors.onSurfaceVariant },
  dateNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  dateText: { ...textStyle('titleLg'), fontWeight: '600' },
  empty: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant, fontStyle: 'italic', textAlign: 'center', paddingVertical: 24 },
  sundayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  sundayText: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant, flex: 1, fontWeight: '600' },
  periodCard: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLowest, gap: 4 },
  breakCard: { backgroundColor: colors.surfaceContainerLow, borderStyle: 'dashed' },
  subCard: { backgroundColor: colors.blue50, borderColor: '#bfdbfe' },
  conflictCard: { borderColor: colors.error, borderWidth: 2 },
  periodLabel: { ...textStyle('chip10'), color: colors.onSurfaceVariant, textTransform: 'uppercase' },
  periodSubject: { ...textStyle('bodyMd'), fontWeight: '600' },
  periodMeta: { ...textStyle('chip10'), color: colors.onSurfaceVariant },
  confirmedBadge: { ...textStyle('chip10'), color: colors.primary, fontWeight: '700' },
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
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: spacing.gutter },
  modalCard: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, padding: spacing.gutter, gap: 8 },
  modalTitle: { ...textStyle('titleLg'), fontWeight: '700', marginBottom: 4 },
  modalSub: { ...textStyle('labelMd'), color: colors.onSurfaceVariant, marginBottom: 8 },
  modalRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.outlineVariant },
  modalRowActive: { borderColor: colors.primaryContainer, backgroundColor: `${colors.primaryContainer}14` },
  modalRowText: { ...textStyle('bodyMd'), flex: 1 },
});
