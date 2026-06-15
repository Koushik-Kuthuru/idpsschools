import React, { useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Pressable, TextInput } from 'react-native';
import type { TextInput as TextInputType } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenShell } from '../components/ScreenShell';
import { Card } from '../components/ui';
import {
  staffDepartments,
  staffFilters,
  staffMembers,
  staffSummary,
  teachingDepartments,
  type StaffDepartment,
  type StaffMember,
} from '../data/mockData';
import { handlePrincipalTabPress } from '../navigation/navigationHelpers';
import type { PrincipalColorScheme } from '@/designations/principal/theme/colors';
import type { PrincipalStackParamList } from '../navigation/types';
import { spacing, textStyle, usePrincipalTheme, useThemedStyles } from '@/designations/principal/theme';

const DETAIL_TABS = ['Profile', 'Schedule', 'Attendance', 'Appraisal', 'Documents'] as const;

function statusColor(status: StaffMember['status'], palette: PrincipalColorScheme) {
  if (status === 'present') return palette.primary;
  if (status === 'absent') return palette.error;
  return palette.tertiary;
}

function matchesCategory(member: StaffMember, filter: (typeof staffFilters)[number]): boolean {
  if (filter === 'All') return true;
  if (filter === 'On Probation') return !!member.onProbation;
  return member.category === filter;
}

function matchesSearch(member: StaffMember, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    member.name,
    member.role,
    member.department,
    member.empId,
    member.email,
    member.qualification,
    member.category,
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}

export function StaffManagementScreen() {
  const { colors } = usePrincipalTheme();
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<NativeStackNavigationProp<PrincipalStackParamList>>();
  const [filter, setFilter] = useState<(typeof staffFilters)[number]>('Teaching');
  const [department, setDepartment] = useState<StaffDepartment | null>(null);
  const [deptPickerOpen, setDeptPickerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [detail, setDetail] = useState<StaffMember | null>(null);
  const [detailTab, setDetailTab] = useState<(typeof DETAIL_TABS)[number]>('Profile');
  const searchRef = useRef<TextInputType>(null);
  const isSearching = query.trim().length > 0;

  const departmentOptions = useMemo((): StaffDepartment[] => {
    if (filter === 'Teaching' || filter === 'On Probation') {
      return [...teachingDepartments];
    }
    if (filter === 'All') {
      return staffDepartments.filter((d) => d !== 'All Departments');
    }
    if (filter === 'Non-Teaching' || filter === 'Admin') {
      return ['Administration', 'Accounts'];
    }
    if (filter === 'Support') {
      return ['Support'];
    }
    return staffDepartments.filter((d) => d !== 'All Departments');
  }, [filter]);

  const visible = useMemo(() => {
    return staffMembers.filter((s) => {
      if (!matchesCategory(s, filter)) return false;
      if (department && s.department !== department) return false;
      return matchesSearch(s, query);
    });
  }, [department, filter, isSearching, query]);

  const pickerDepartments = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return departmentOptions;
    return departmentOptions.filter((d) => d.toLowerCase().includes(q));
  }, [departmentOptions, query]);

  const handleCategoryChange = (next: (typeof staffFilters)[number]) => {
    setFilter(next);
    setDepartment(null);
    setQuery('');
  };

  const handleDepartmentSelect = (dept: StaffDepartment) => {
    setDepartment(dept);
    setDeptPickerOpen(false);
  };

  return (
    <>
      <ScreenShell
        scroll={false}
        paddingBottom={0}
        activeTab="staff"
        onTabPress={(t) => handlePrincipalTabPress(navigation, t)}
        header={
          <View style={styles.topBar}>
            <View style={styles.topLeft}>
              <Text style={styles.topTitle}>Staff Directory</Text>
            </View>
            <TouchableOpacity
              style={styles.topRight}
              onPress={() => searchRef.current?.focus()}
              activeOpacity={0.7}
              hitSlop={8}
            >
              <MaterialIcons name="search" size={22} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
        }
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.summaryRow}>
            {[
              { l: 'Total', v: staffSummary.total },
              { l: 'Present', v: staffSummary.present },
              { l: 'On Leave', v: staffSummary.onLeave },
            ].map((s) => (
              <View key={s.l} style={styles.summaryCard}>
                <Text style={styles.summaryVal}>{s.v}</Text>
                <Text style={styles.summaryLbl}>{s.l}</Text>
              </View>
            ))}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {staffFilters.map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.chip, filter === f && styles.chipActive]}
                onPress={() => handleCategoryChange(f)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.searchWrap}>
            <MaterialIcons name="search" size={20} color={colors.onSurfaceVariant} />
            <TextInput
              ref={searchRef}
              style={styles.searchInput}
              placeholder="Search by name, role, department, or ID..."
              placeholderTextColor={colors.outline}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {query ? (
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
                <MaterialIcons name="close" size={18} color={colors.outline} />
              </TouchableOpacity>
            ) : null}
          </View>

          <Text style={styles.deptLabel}>Department</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setDeptPickerOpen(true)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="domain" size={20} color={colors.primary} />
            <Text style={[styles.dropdownText, !department && styles.dropdownPlaceholder]}>
              {department ?? (isSearching ? 'All departments' : 'Select a department')}
            </Text>
            <MaterialIcons name="keyboard-arrow-down" size={22} color={colors.onSurfaceVariant} />
          </TouchableOpacity>

          {!department && !isSearching ? (
            <View style={styles.pickDeptHint}>
              <MaterialIcons name="arrow-upward" size={20} color={colors.onSurfaceVariant} />
              <Text style={styles.empty}>Select a department or search by name to find teachers.</Text>
            </View>
          ) : (
            <>
              <Text style={styles.resultLine}>
                {visible.length} result{visible.length === 1 ? '' : 's'}
                {department ? ` in ${department}` : isSearching ? ' across departments' : ''}
              </Text>
              {visible.length === 0 ? (
                <Text style={styles.empty}>
                  {isSearching
                    ? `No staff found for "${query.trim()}".`
                    : `No teachers in ${department}.`}
                </Text>
              ) : (
                visible.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    activeOpacity={0.7}
                    onPress={() => {
                      setDetail(s);
                      setDetailTab('Profile');
                    }}
                  >
                    <Card style={styles.staffCard}>
                      <View style={styles.staffRow}>
                        <View style={styles.avatar}>
                          <Text style={styles.avatarText}>
                            {s.name
                              .split(' ')
                              .map((w) => w[0])
                              .join('')
                              .slice(0, 2)}
                          </Text>
                          <View style={[styles.statusDot, { backgroundColor: statusColor(s.status, colors) }]} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.staffName}>{s.name}</Text>
                          <Text style={styles.staffRole}>{s.role}</Text>
                          <Text style={styles.staffCat}>
                            {s.department}
                            {s.onProbation ? ' · Probation' : ''}
                          </Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={22} color={colors.onSurfaceVariant} />
                      </View>
                    </Card>
                  </TouchableOpacity>
                ))
              )}
            </>
          )}
        </ScrollView>

        <TouchableOpacity style={styles.fab} activeOpacity={0.85}>
          <MaterialIcons name="person-add" size={26} color={colors.onPrimary} />
        </TouchableOpacity>
      </ScreenShell>

      <Modal visible={deptPickerOpen} transparent animationType="fade" onRequestClose={() => setDeptPickerOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setDeptPickerOpen(false)}>
          <Pressable style={styles.pickerSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.pickerHead}>
              <Text style={styles.pickerTitle}>Select Department</Text>
              <TouchableOpacity onPress={() => setDeptPickerOpen(false)}>
                <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <TouchableOpacity
                style={[styles.pickerItem, !department && styles.pickerItemActive]}
                onPress={() => {
                  setDepartment(null);
                  setDeptPickerOpen(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.pickerItemText, !department && styles.pickerItemTextActive]}>All departments</Text>
                <Text style={styles.pickerCount}>
                  {staffMembers.filter((s) => matchesCategory(s, filter)).length}
                </Text>
              </TouchableOpacity>
              {pickerDepartments.map((d) => {
                const count = staffMembers.filter(
                  (s) => matchesCategory(s, filter) && s.department === d,
                ).length;
                const active = department === d;
                return (
                  <TouchableOpacity
                    key={d}
                    style={[styles.pickerItem, active && styles.pickerItemActive]}
                    onPress={() => handleDepartmentSelect(d)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pickerItemText, active && styles.pickerItemTextActive]}>{d}</Text>
                    <Text style={styles.pickerCount}>{count}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={!!detail} transparent animationType="slide" onRequestClose={() => setDetail(null)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setDetail(null)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            {detail ? (
              <>
                <View style={styles.sheetHandle} />
                <TouchableOpacity style={styles.sheetClose} onPress={() => setDetail(null)}>
                  <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
                </TouchableOpacity>
                <View style={styles.sheetHead}>
                  <View style={styles.sheetAvatar}>
                    <Text style={styles.sheetAvatarText}>
                      {detail.name
                        .split(' ')
                        .map((w) => w[0])
                        .join('')
                        .slice(0, 2)}
                    </Text>
                  </View>
                  <Text style={styles.sheetName}>{detail.name}</Text>
                  <Text style={styles.sheetEmp}>EMP {detail.empId}</Text>
                  <Text style={styles.sheetRole}>{detail.role}</Text>
                  <Text style={styles.sheetDept}>{detail.department} Department</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.detailTabs}>
                  {DETAIL_TABS.map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.detailTab, detailTab === t && styles.detailTabActive]}
                      onPress={() => setDetailTab(t)}
                    >
                      <Text style={[styles.detailTabText, detailTab === t && styles.detailTabTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Text style={styles.field}>Department: {detail.department}</Text>
                <Text style={styles.field}>Join: {detail.joined}</Text>
                <Text style={styles.field}>Qualification: {detail.qualification}</Text>
                <Text style={styles.field}>{detail.email}</Text>
                <Text style={styles.field}>{detail.phone}</Text>
                <View style={styles.quickActions}>
                  {['Message', 'Leave', 'Task'].map((a) => (
                    <TouchableOpacity key={a} style={styles.quickBtn}>
                      <Text style={styles.quickBtnText}>{a}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.rating}>★ {detail.rating} Appraisal</Text>
                <TouchableOpacity style={styles.appraisalBtn}>
                  <Text style={styles.appraisalBtnText}>Start New Appraisal</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function createStyles(colors: PrincipalColorScheme) {
  return StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.gutter,
    minHeight: spacing.headerHeight,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    backgroundColor: colors.surface,
  },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  topTitle: { ...textStyle('headlineMd'), fontWeight: '700' },
  topRight: { flexDirection: 'row', gap: spacing.sm },
  scroll: { flex: 1 },
  content: { padding: spacing.gutter, gap: spacing.md, paddingBottom: 100 },
  summaryRow: { flexDirection: 'row', gap: spacing.sm },
  summaryCard: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
  },
  summaryVal: { fontSize: 20, fontWeight: '700' },
  summaryLbl: { ...textStyle('chip10'), color: colors.onSurfaceVariant },
  chipRow: { gap: spacing.sm },
  deptLabel: { ...textStyle('chip10'), color: colors.onSurfaceVariant, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  dropdownText: { ...textStyle('bodyMd'), fontWeight: '600', color: colors.onSurface, flex: 1 },
  dropdownPlaceholder: { color: colors.onSurfaceVariant, fontWeight: '500' },
  pickDeptHint: { alignItems: 'center', gap: 8, paddingVertical: 32 },
  pickerSheet: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.gutter,
    paddingBottom: spacing.lg,
    maxHeight: '70%',
  },
  pickerHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  pickerTitle: { ...textStyle('titleLg'), fontWeight: '700' },
  pickerList: { maxHeight: 360 },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  pickerItemActive: { backgroundColor: `${colors.primaryContainer}18` },
  pickerItemText: { ...textStyle('bodyMd'), fontWeight: '600', color: colors.onSurface },
  pickerItemTextActive: { color: colors.primary },
  pickerCount: { ...textStyle('labelMd'), color: colors.onSurfaceVariant, fontWeight: '700' },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.outlineVariant },
  chipActive: { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer },
  chipText: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  chipTextActive: { color: colors.onPrimary, fontWeight: '700' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    ...textStyle('bodyMd'),
    padding: 0,
    color: colors.onSurface,
  },
  resultLine: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  empty: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant, fontStyle: 'italic', textAlign: 'center' },
  staffCard: { padding: spacing.md },
  staffRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...textStyle('labelMd'), fontWeight: '700', color: colors.onSecondaryContainer },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.surfaceContainerLowest,
  },
  staffName: { ...textStyle('bodyMd'), fontWeight: '700' },
  staffRole: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  staffCat: { ...textStyle('chip10'), color: colors.primary, fontWeight: '700' },
  fab: {
    position: 'absolute',
    right: spacing.gutter,
    bottom: spacing.fabBottom,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.gutter,
    maxHeight: '85%',
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.outlineVariant, alignSelf: 'center', marginBottom: 12 },
  sheetClose: { position: 'absolute', right: spacing.gutter, top: spacing.gutter },
  sheetHead: { alignItems: 'center', marginBottom: 12 },
  sheetAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  sheetAvatarText: { ...textStyle('titleLg'), fontWeight: '700' },
  sheetName: { ...textStyle('headlineMd'), fontWeight: '700' },
  sheetEmp: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  sheetRole: { ...textStyle('bodyMd'), color: colors.primary, fontWeight: '600' },
  sheetDept: { ...textStyle('labelMd'), color: colors.onSurfaceVariant, marginTop: 2 },
  detailTabs: { gap: 8, marginVertical: 12 },
  detailTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.outlineVariant },
  detailTabActive: { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer },
  detailTabText: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  detailTabTextActive: { color: colors.onPrimary, fontWeight: '700' },
  field: { ...textStyle('bodyMd'), marginBottom: 6 },
  quickActions: { flexDirection: 'row', gap: 8, marginVertical: 12 },
  quickBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.outlineVariant, alignItems: 'center' },
  quickBtnText: { ...textStyle('labelMd'), fontWeight: '600' },
  rating: { ...textStyle('bodyMd'), color: colors.yellow400, fontWeight: '700', marginBottom: 8 },
  appraisalBtn: { backgroundColor: colors.primaryContainer, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginBottom: 16 },
  appraisalBtnText: { ...textStyle('bodyMd'), color: colors.onPrimary, fontWeight: '700' },
});
}
