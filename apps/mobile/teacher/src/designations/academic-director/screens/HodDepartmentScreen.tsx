import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  Pressable,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AcademicHeader } from '../components/AcademicHeader';
import { ScreenShell } from '../components/ScreenShell';
import { Card, ProgressBar } from '../components/ui';
import { initialDepartments, type DepartmentItem } from '../data/mockData';
import { handleAcademicTabPress } from '../navigation/navigationHelpers';
import type { RootStackParamList } from '../navigation/types';
import { usePriorityActionsStore } from '../store/priorityActionsStore';
import type { AcademicColorScheme } from '../theme/colors';
import { spacing, textStyle, useAcademicTheme, useThemedStyles } from '@/designations/academic-director/theme';

type SortMode = 'score-desc' | 'score-asc' | 'name';
type FilterMode = 'all' | 'attention' | 'pending';

const FAB_SIZE = 56;
const LIST_BOTTOM_PAD = FAB_SIZE + 24;
const MESSAGE_SHEET_MAX = Dimensions.get('window').height * 0.55;

export function HodDepartmentScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useAcademicTheme();
  const styles = useThemedStyles(createStyles);
  const completeByKind = usePriorityActionsStore((s) => s.completeByKind);
  const insets = useSafeAreaInsets();
  const sheetBottomPad = Math.max(insets.bottom, 20);

  const [deptList, setDeptList] = useState<DepartmentItem[]>(initialDepartments);
  const [expandedId, setExpandedId] = useState<string | null>('math');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('score-desc');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [fabOpen, setFabOpen] = useState(false);
  const [detailDept, setDetailDept] = useState<DepartmentItem | null>(null);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [messageDept, setMessageDept] = useState<DepartmentItem | null>(null);
  const [messageDraft, setMessageDraft] = useState('');

  const summary = useMemo(() => {
    const totalTeachers = deptList.reduce((sum, d) => sum + d.teachers, 0);
    const avgScore = Math.round(deptList.reduce((sum, d) => sum + d.score, 0) / deptList.length);
    return { deptCount: deptList.length, totalTeachers, avgScore };
  }, [deptList]);

  const pendingDepts = useMemo(
    () => deptList.filter((d) => !d.monthlyReportSubmitted && !d.reminderSent),
    [deptList],
  );

  const visibleDepts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = deptList.filter((d) => {
      if (filterMode === 'attention') return d.score < 80 || !d.monthlyReportSubmitted;
      if (filterMode === 'pending') return !d.monthlyReportSubmitted;
      return true;
    });
    if (q) {
      list = list.filter(
        (d) => d.name.toLowerCase().includes(q) || d.hod.toLowerCase().includes(q),
      );
    }
    list = [...list];
    if (sortMode === 'score-desc') list.sort((a, b) => b.score - a.score);
    else if (sortMode === 'score-asc') list.sort((a, b) => a.score - b.score);
    else list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [deptList, searchQuery, sortMode, filterMode]);

  const cycleSort = () => {
    setSortMode((prev) =>
      prev === 'score-desc' ? 'score-asc' : prev === 'score-asc' ? 'name' : 'score-desc',
    );
  };

  const sortLabel =
    sortMode === 'score-desc' ? 'Score ↓' : sortMode === 'score-asc' ? 'Score ↑' : 'Name A–Z';

  const filterLabel =
    filterMode === 'all' ? 'All Depts' : filterMode === 'attention' ? 'Needs Attention' : 'Pending Reports';

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const openMessageHod = (dept: DepartmentItem) => {
    setMessageDept(dept);
    setMessageDraft('');
  };

  const sendMessageHod = () => {
    const body = messageDraft.trim();
    if (!body) {
      Alert.alert('Message required', 'Please type a message before sending.');
      return;
    }
    if (!messageDept) return;
    setMessageDept(null);
    setMessageDraft('');
    Alert.alert('Message sent', `Your message was delivered to ${messageDept.hod}.`);
  };

  const requestReport = (dept: DepartmentItem) => {
    if (dept.monthlyReportSubmitted) {
      Alert.alert('Already submitted', `${dept.hod} has already submitted the monthly report.`);
      return;
    }
    if (dept.reportRequested) {
      Alert.alert('Already requested', `A report request was already sent to ${dept.hod}.`);
      return;
    }
    Alert.alert('Request report', `Send monthly report request to ${dept.hod}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send Request',
        onPress: () => {
          setDeptList((prev) =>
            prev.map((d) => (d.id === dept.id ? { ...d, reportRequested: true } : d)),
          );
          Alert.alert('Report requested', `${dept.hod} has been asked to submit the monthly report.`);
        },
      },
    ]);
  };

  const sendAllReminders = () => {
    if (pendingDepts.length === 0) {
      Alert.alert('All clear', 'Reminders have already been sent or all reports are submitted.');
      return;
    }
    Alert.alert('Send reminders', `Notify ${pendingDepts.length} HODs about pending monthly reports?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send',
        onPress: () => {
          setDeptList((prev) =>
            prev.map((d) =>
              !d.monthlyReportSubmitted ? { ...d, reminderSent: true, reportRequested: true } : d,
            ),
          );
          completeByKind('hod-reminder');
          Alert.alert('Reminders sent', 'Pending HODs have been notified.');
        },
      },
    ]);
  };

  const handleFabAction = (action: string) => {
    setFabOpen(false);
    if (action === 'Schedule HOD Meeting') {
      Alert.alert('Meeting scheduled', 'HOD meeting invite sent for Friday, 3:00 PM.');
      return;
    }
    if (action === 'Send Dept Circular') {
      navigation.navigate('Circulars');
      return;
    }
    Alert.alert('Add Department', 'New department draft saved for principal approval.');
  };

  return (
    <ScreenShell
      scroll={false}
      paddingBottom={0}
      activeTab="staff"
      onTabPress={(t) => handleAcademicTabPress(navigation, t)}
      header={
        <AcademicHeader
          title="Staff & Departments"
          right={
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.headerBtn}
                onPress={cycleSort}
              >
                <MaterialIcons name="sort" size={22} color={colors.primaryContainer} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerBtn}
                onPress={() => {
                  setSearchOpen((v) => !v);
                  if (searchOpen) setSearchQuery('');
                }}
              >
                <MaterialIcons
                  name={searchOpen ? 'close' : 'search'}
                  size={22}
                  color={searchOpen ? colors.primaryContainer : colors.onSurfaceVariant}
                />
              </TouchableOpacity>
            </View>
          }
        />
      }
    >
      <View style={styles.screen}>
        {searchOpen ? (
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={20} color={colors.onSurfaceVariant} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search department or HOD..."
              placeholderTextColor={colors.outline}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="cancel" size={18} color={colors.outline} />
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        <ScrollView
          style={styles.pageScroll}
          contentContainerStyle={styles.pageContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summaryStrip}>
            <View style={styles.summaryCopy}>
              <Text style={styles.summaryText}>
                {summary.deptCount} Departments · {summary.totalTeachers} Teachers
              </Text>
              <Text style={styles.summarySub}>Overall Dept Score: {summary.avgScore}%</Text>
            </View>
            <View style={styles.ring}>
              <Text style={styles.ringText}>{summary.avgScore}%</Text>
            </View>
          </View>

          <View style={styles.filterRow}>
            <TouchableOpacity style={styles.sortChip} onPress={cycleSort}>
              <MaterialIcons name="sort" size={14} color={colors.primary} />
              <Text style={styles.sortText}>{sortLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterChip} onPress={() => setFilterMenuOpen(true)}>
              <Text style={styles.filterText}>{filterLabel}</Text>
              <MaterialIcons name="keyboard-arrow-down" size={18} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {pendingDepts.length > 0 ? (
            <View style={styles.pendingCard}>
              <View style={styles.pendingHead}>
                <MaterialIcons name="hourglass-empty" size={18} color={colors.onTertiaryContainer} />
                <Text style={styles.pendingTitle}>
                  {pendingDepts.length} HOD{pendingDepts.length === 1 ? '' : 's'} pending monthly submissions
                </Text>
              </View>
              <View style={styles.pendingTags}>
                {pendingDepts.slice(0, 4).map((dept) => (
                  <Text key={dept.id} style={styles.pendingTag}>
                    {dept.hod}
                  </Text>
                ))}
              </View>
              <TouchableOpacity style={styles.remindBtn} onPress={sendAllReminders}>
                <Text style={styles.remindText}>Send Reminders to All</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {visibleDepts.length === 0 ? (
            <Text style={styles.empty}>No departments match your search or filters.</Text>
          ) : (
            visibleDepts.map((dept) => {
              const expanded = expandedId === dept.id;
              const needsAttention = dept.score < 80 || !dept.monthlyReportSubmitted;
              return (
                <Card key={dept.id} style={needsAttention ? styles.attentionCard : undefined}>
                  <TouchableOpacity style={styles.deptHead} onPress={() => toggleExpand(dept.id)} activeOpacity={0.8}>
                    <View style={styles.deptLeft}>
                      <View style={styles.deptIcon}>
                        <MaterialIcons name={dept.icon} size={22} color={colors.primaryContainer} />
                      </View>
                      <View style={styles.deptTitleBlock}>
                        <Text style={styles.deptName}>{dept.name}</Text>
                        <Text style={styles.hodName}>HOD: {dept.hod}</Text>
                      </View>
                    </View>
                    <View style={styles.deptHeadRight}>
                      <View style={[styles.scoreBadge, dept.score < 80 && styles.scoreBadgeDim]}>
                        <Text style={styles.scoreText}>{dept.score}%</Text>
                      </View>
                      <MaterialIcons
                        name={expanded ? 'expand-less' : 'expand-more'}
                        size={22}
                        color={colors.onSurfaceVariant}
                      />
                    </View>
                  </TouchableOpacity>

                  <View style={styles.coverageRow}>
                    <Text style={styles.coverageLabel}>Syllabus coverage</Text>
                    <Text style={styles.coveragePct}>{dept.coverage}%</Text>
                  </View>
                  <ProgressBar percent={dept.coverage} height={6} />

                  {expanded ? (
                    <View style={styles.expandedBody}>
                      <View style={styles.metricsGrid}>
                        <View style={styles.metricCell}>
                          <Text style={styles.metricValue}>{dept.teachers}</Text>
                          <Text style={styles.metricLabel}>Teachers</Text>
                        </View>
                        <View style={[styles.metricCell, styles.metricBorder]}>
                          <Text style={[styles.metricValue, { color: colors.tertiary }]}>{dept.coverage}%</Text>
                          <Text style={styles.metricLabel}>Coverage</Text>
                        </View>
                        <View style={styles.metricCell}>
                          <Text style={[styles.metricValue, { color: colors.primaryContainer }]}>{dept.avg}%</Text>
                          <Text style={styles.metricLabel}>Avg Score</Text>
                        </View>
                      </View>

                      <View style={styles.statusChips}>
                        <Text style={dept.monthlyReportSubmitted ? styles.statusChipOk : styles.statusChipWarn}>
                          Report:{' '}
                          {dept.monthlyReportSubmitted
                            ? 'Submitted'
                            : dept.reportRequested
                              ? 'Requested'
                              : 'Pending'}
                        </Text>
                        <Text style={dept.resultsUploaded === dept.resultsTotal ? styles.statusChipOk : styles.statusChipWarn}>
                          Results: {dept.resultsUploaded}/{dept.resultsTotal} uploaded
                        </Text>
                      </View>

                      <View style={styles.actionGrid}>
                        <TouchableOpacity
                          style={styles.actionBtnPrimary}
                          onPress={() => setDetailDept(dept)}
                        >
                          <MaterialIcons name="visibility" size={18} color={colors.primaryContainer} />
                          <Text style={styles.actionBtnPrimaryText}>View Details</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtnNeutral} onPress={() => openMessageHod(dept)}>
                          <MaterialIcons name="mail-outline" size={18} color={colors.onSurfaceVariant} />
                          <Text style={styles.actionBtnNeutralText}>Message HOD</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.actionBtnNeutral,
                            (dept.monthlyReportSubmitted || dept.reportRequested) && styles.actionBtnDisabled,
                          ]}
                          onPress={() => requestReport(dept)}
                          disabled={dept.monthlyReportSubmitted || dept.reportRequested}
                        >
                          <MaterialIcons name="assignment" size={18} color={colors.onSurfaceVariant} />
                          <Text style={styles.actionBtnNeutralText}>
                            {dept.reportRequested ? 'Requested' : 'Request Report'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionBtnNeutral}
                          onPress={() => navigation.navigate('TeacherPerformance', { departmentId: dept.id })}
                        >
                          <MaterialIcons name="groups" size={18} color={colors.onSurfaceVariant} />
                          <Text style={styles.actionBtnNeutralText}>View Teachers</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : null}
                </Card>
              );
            })
          )}
        </ScrollView>

        {fabOpen ? (
          <Pressable style={styles.fabBackdrop} onPress={() => setFabOpen(false)}>
            <View style={styles.fabMenu}>
              {[
                { label: 'Schedule HOD Meeting', icon: 'groups' as const },
                { label: 'Send Dept Circular', icon: 'campaign' as const },
                { label: 'Add Department', icon: 'add-circle' as const },
              ].map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={styles.fabMenuItem}
                  onPress={() => handleFabAction(item.label)}
                >
                  <MaterialIcons name={item.icon} size={20} color={colors.primaryContainer} />
                  <Text style={styles.fabMenuText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        ) : null}

        <TouchableOpacity style={styles.fab} onPress={() => setFabOpen((v) => !v)} activeOpacity={0.9}>
          <MaterialIcons name={fabOpen ? 'close' : 'add'} size={28} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>

      {/* Filter menu */}
      <Modal visible={filterMenuOpen} transparent animationType="fade" onRequestClose={() => setFilterMenuOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setFilterMenuOpen(false)}>
          <Pressable style={styles.filterSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.filterSheetTitle}>Filter departments</Text>
            {(
              [
                ['all', 'All Departments'],
                ['attention', 'Needs Attention'],
                ['pending', 'Pending Reports'],
              ] as const
            ).map(([key, label]) => (
              <TouchableOpacity
                key={key}
                style={[styles.filterOption, filterMode === key && styles.filterOptionActive]}
                onPress={() => {
                  setFilterMode(key);
                  setFilterMenuOpen(false);
                }}
              >
                <Text style={[styles.filterOptionText, filterMode === key && styles.filterOptionTextActive]}>{label}</Text>
                {filterMode === key ? <MaterialIcons name="check" size={18} color={colors.primaryContainer} /> : null}
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Message HOD */}
      <Modal visible={!!messageDept} transparent animationType="slide" onRequestClose={() => setMessageDept(null)}>
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.modalDismiss} onPress={() => setMessageDept(null)} />
          <View style={[styles.messageSheet, { paddingBottom: sheetBottomPad, maxHeight: MESSAGE_SHEET_MAX }]}>
            <View style={styles.messageHead}>
              <Text style={styles.messageTitle}>Message HOD</Text>
              <TouchableOpacity onPress={() => setMessageDept(null)}>
                <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            {messageDept ? (
              <Text style={styles.messageSub}>
                To: {messageDept.hod} · {messageDept.name}
              </Text>
            ) : null}
            <TextInput
              style={styles.messageInput}
              value={messageDraft}
              onChangeText={setMessageDraft}
              placeholder="Type your message..."
              placeholderTextColor={colors.outline}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              autoFocus
            />
            <TouchableOpacity style={styles.messageSendBtn} onPress={sendMessageHod}>
              <Text style={styles.messageSendText}>Send Message</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Department detail */}
      <Modal visible={!!detailDept} transparent animationType="slide" onRequestClose={() => setDetailDept(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.detailSheet}>
            {detailDept ? (
              <>
                <View style={styles.detailHead}>
                  <Text style={styles.detailTitle}>{detailDept.name}</Text>
                  <TouchableOpacity onPress={() => setDetailDept(null)}>
                    <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.detailLine}>HOD: {detailDept.hod}</Text>
                <Text style={styles.detailLine}>Department score: {detailDept.score}%</Text>
                <Text style={styles.detailLine}>Teachers: {detailDept.teachers}</Text>
                <Text style={styles.detailLine}>Syllabus coverage: {detailDept.coverage}%</Text>
                <Text style={styles.detailLine}>Class average: {detailDept.avg}%</Text>
                <Text style={styles.detailLine}>
                  Monthly report: {detailDept.monthlyReportSubmitted ? 'Submitted' : 'Pending'}
                </Text>
                <Text style={styles.detailLine}>
                  Results upload: {detailDept.resultsUploaded}/{detailDept.resultsTotal}
                </Text>
                <TouchableOpacity
                  style={styles.detailCta}
                  onPress={() => {
                    setDetailDept(null);
                    navigation.navigate('TeacherPerformance', { departmentId: detailDept.id });
                  }}
                >
                  <Text style={styles.detailCtaText}>Open Teacher Performance</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </ScreenShell>
  );
}

function createStyles(colors: AcademicColorScheme) {
  return StyleSheet.create({
    screen: { flex: 1, position: 'relative' },
    headerRight: { flexDirection: 'row', gap: 4 },
    headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginHorizontal: spacing.gutter,
      marginTop: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
    searchInput: { flex: 1, ...textStyle('bodyMd'), color: colors.onSurface, padding: 0 },
    pageScroll: { flex: 1 },
    pageContent: { padding: spacing.gutter, gap: 12, paddingBottom: LIST_BOTTOM_PAD },
    summaryStrip: {
      backgroundColor: colors.primaryContainer,
      borderRadius: 14,
      padding: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    summaryCopy: { flex: 1, paddingRight: 12 },
    summaryText: { ...textStyle('bodyMd'), color: colors.onPrimary, fontWeight: '600' },
    summarySub: { ...textStyle('labelMd'), color: 'rgba(255,255,255,0.85)', marginTop: 4 },
    ring: {
      width: 52,
      height: 52,
      borderRadius: 26,
      borderWidth: 3,
      borderColor: 'rgba(255,255,255,0.35)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    ringText: { ...textStyle('bodyMd'), color: colors.onPrimary, fontWeight: '700' },
    filterRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    sortChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: `${colors.primaryContainer}18`,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
    },
    sortText: { ...textStyle('labelMd'), color: colors.primary, fontWeight: '600' },
    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: colors.surfaceContainerLowest,
    },
    filterText: { ...textStyle('labelMd'), color: colors.onSurfaceVariant, fontWeight: '500' },
    pendingCard: {
      backgroundColor: colors.tertiaryFixed,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: `${colors.tertiaryContainer}55`,
      gap: 10,
    },
    pendingHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    pendingTitle: { ...textStyle('bodyMd'), color: colors.onTertiaryContainer, fontWeight: '600', flex: 1 },
    pendingTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    pendingTag: {
      ...textStyle('chip10'),
      backgroundColor: colors.surfaceContainerLowest,
      color: colors.onTertiaryContainer,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    remindBtn: { backgroundColor: colors.tertiaryContainer, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    remindText: { ...textStyle('bodyMd'), color: colors.onTertiaryContainer, fontWeight: '700' },
    empty: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant, textAlign: 'center', paddingVertical: 24 },
    attentionCard: { borderColor: `${colors.tertiary}55` },
    deptHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
    deptLeft: { flexDirection: 'row', gap: 12, flex: 1, minWidth: 0 },
    deptIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: `${colors.primaryContainer}18`,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    deptTitleBlock: { flex: 1, minWidth: 0, gap: 2 },
    deptName: { ...textStyle('bodyMd'), fontWeight: '700', color: colors.onSurface },
    hodName: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
    deptHeadRight: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
    scoreBadge: {
      backgroundColor: colors.primaryContainer,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
    },
    scoreBadgeDim: { backgroundColor: `${colors.primaryContainer}99` },
    scoreText: { ...textStyle('labelMd'), color: colors.onPrimary, fontWeight: '700' },
    coverageRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, marginBottom: 6 },
    coverageLabel: { ...textStyle('chip10'), color: colors.onSurfaceVariant },
    coveragePct: { ...textStyle('chip10'), fontWeight: '700', color: colors.onSurface },
    expandedBody: { marginTop: 12, gap: 12 },
    metricsGrid: {
      flexDirection: 'row',
      borderRadius: 10,
      backgroundColor: colors.surfaceContainerLow,
      paddingVertical: 10,
    },
    metricCell: { flex: 1, alignItems: 'center' },
    metricBorder: {
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: colors.outlineVariant,
    },
    metricValue: { ...textStyle('bodyMd'), fontWeight: '700', color: colors.onSurface },
    metricLabel: { ...textStyle('chip10'), color: colors.onSurfaceVariant, marginTop: 2 },
    statusChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    statusChipOk: {
      ...textStyle('chip10'),
      backgroundColor: `${colors.primaryContainer}18`,
      color: colors.primaryContainer,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      overflow: 'hidden',
    },
    statusChipWarn: {
      ...textStyle('chip10'),
      backgroundColor: `${colors.tertiary}18`,
      color: colors.tertiary,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      overflow: 'hidden',
    },
    actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    actionBtnPrimary: {
      width: '48%',
      flexGrow: 1,
      minWidth: '46%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: colors.primaryContainer,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 8,
      backgroundColor: `${colors.primaryContainer}12`,
    },
    actionBtnPrimaryText: { ...textStyle('labelMd'), color: colors.primaryContainer, fontWeight: '700' },
    actionBtnNeutral: {
      width: '48%',
      flexGrow: 1,
      minWidth: '46%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 8,
      backgroundColor: colors.surfaceContainerLowest,
    },
    actionBtnNeutralText: { ...textStyle('labelMd'), color: colors.onSurfaceVariant, fontWeight: '600' },
    actionBtnDisabled: { opacity: 0.55 },
    modalDismiss: { ...StyleSheet.absoluteFillObject },
    messageSheet: {
      width: '100%',
      backgroundColor: colors.surfaceContainerLowest,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 20,
      paddingTop: 20,
      zIndex: 1,
    },
    messageHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    messageTitle: { ...textStyle('titleLg'), fontWeight: '700', color: colors.onSurface },
    messageSub: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant, marginBottom: 12 },
    messageInput: {
      minHeight: 120,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      ...textStyle('bodyMd'),
      color: colors.onSurface,
      backgroundColor: colors.surfaceContainerLow,
      marginBottom: 12,
    },
    messageSendBtn: {
      backgroundColor: colors.primaryContainer,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    messageSendText: { ...textStyle('bodyMd'), color: colors.onPrimary, fontWeight: '700' },
    fabBackdrop: { ...StyleSheet.absoluteFillObject, zIndex: 15 },
    fabMenu: {
      position: 'absolute',
      right: spacing.gutter,
      bottom: FAB_SIZE + 40,
      gap: 10,
      alignItems: 'flex-end',
      zIndex: 16,
    },
    fabMenuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.surfaceContainerLowest,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      minWidth: 200,
    },
    fabMenuText: { ...textStyle('bodyMd'), fontWeight: '600', color: colors.onSurface, flex: 1 },
    fab: {
      position: 'absolute',
      right: spacing.gutter,
      bottom: 24,
      width: FAB_SIZE,
      height: FAB_SIZE,
      borderRadius: 28,
      backgroundColor: colors.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 20,
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    filterSheet: {
      backgroundColor: colors.surfaceContainerLowest,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      gap: 4,
    },
    filterSheetTitle: { ...textStyle('titleLg'), fontWeight: '700', color: colors.onSurface, marginBottom: 8 },
    filterOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.outlineVariant,
    },
    filterOptionActive: { backgroundColor: `${colors.primaryContainer}10` },
    filterOptionText: { ...textStyle('bodyMd'), color: colors.onSurface },
    filterOptionTextActive: { color: colors.primaryContainer, fontWeight: '700' },
    detailSheet: {
      backgroundColor: colors.surfaceContainerLowest,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      gap: 8,
    },
    detailHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    detailTitle: { ...textStyle('titleLg'), fontWeight: '700', color: colors.onSurface },
    detailLine: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant },
    detailCta: {
      marginTop: 12,
      backgroundColor: colors.primaryContainer,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    detailCtaText: { ...textStyle('bodyMd'), color: colors.onPrimary, fontWeight: '700' },
  });
}
