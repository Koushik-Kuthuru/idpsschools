import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Alert,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AcademicHeader } from '../components/AcademicHeader';
import { ScreenShell } from '../components/ScreenShell';
import { Card, ProgressBar } from '../components/ui';
import {
  examGradeFilters,
  examHallTickets,
  examSortOptions,
  examTypeFilters,
  examUploadTeachers,
  exams,
  type ExamStatus,
} from '../data/mockData';
import { handleAcademicTabPress } from '../navigation/navigationHelpers';
import { usePriorityActionsStore } from '../store/priorityActionsStore';
import type { RootStackParamList } from '../navigation/types';
import type { AcademicColorScheme } from '../theme/colors';
import { spacing, textStyle, useAcademicTheme, useThemedStyles } from '@/designations/academic-director/theme';

const FAB_SIZE = 56;
const FAB_BOTTOM = 24;
const LIST_BOTTOM_PAD = FAB_SIZE + FAB_BOTTOM + 8;
const WINDOW_HEIGHT = Dimensions.get('window').height;
const UPLOAD_SHEET_MAX = WINDOW_HEIGHT * 0.88;
const UPLOAD_FOOTER_HEIGHT = 72;

type StatusFilter = 'All' | ExamStatus;
type GradeFilter = (typeof examGradeFilters)[number]['key'];
type TypeFilter = (typeof examTypeFilters)[number]['key'];
type SortFilter = (typeof examSortOptions)[number]['key'];

function statusTabLabel(status: ExamStatus, count: number): string {
  const labels: Record<ExamStatus, string> = {
    Upcoming: 'Upcoming',
    Ongoing: 'Ongoing',
    'Results Pending': 'Pending',
    Completed: 'Completed',
  };
  return count > 0 ? `${labels[status]} (${count})` : labels[status];
}

function applyExamFilters(
  items: typeof exams,
  statusTab: StatusFilter,
  gradeFilter: GradeFilter,
  typeFilter: TypeFilter,
  sortBy: SortFilter,
) {
  let result = items;

  if (statusTab !== 'All') {
    result = result.filter((e) => e.status === statusTab);
  }
  if (gradeFilter !== 'all') {
    result = result.filter((e) => e.gradeBand === gradeFilter);
  }
  if (typeFilter !== 'all') {
    result = result.filter((e) => e.examType === typeFilter);
  }

  result = [...result];
  if (sortBy === 'name') {
    result.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortBy === 'date-asc') {
    result.sort((a, b) => a.sortOrder - b.sortOrder);
  } else {
    result.sort((a, b) => b.sortOrder - a.sortOrder);
  }

  return result;
}

function getCtaLabel(status: ExamStatus): string {
  if (status === 'Completed') return 'View Full Report';
  if (status === 'Results Pending') return 'Track Uploads';
  return 'View Timetable';
}

export function ExamManagementScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useAcademicTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const sheetBottomPad = Math.max(insets.bottom, 20);
  const pendingExamUploadId = usePriorityActionsStore((s) => s.pendingExamUploadId);
  const clearPendingExamUpload = usePriorityActionsStore((s) => s.clearPendingExamUpload);
  const completeByExamId = usePriorityActionsStore((s) => s.completeByExamId);
  const [tab, setTab] = useState<StatusFilter>('All');
  const [showFilter, setShowFilter] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [uploadExamId, setUploadExamId] = useState<string | null>(null);
  const [hallTicketExamId, setHallTicketExamId] = useState<string | null>(null);
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [sortBy, setSortBy] = useState<SortFilter>('date-desc');
  const [draftGrade, setDraftGrade] = useState<GradeFilter>('all');
  const [draftType, setDraftType] = useState<TypeFilter>('all');
  const [draftSort, setDraftSort] = useState<SortFilter>('date-desc');

  const baseFiltered = useMemo(
    () => applyExamFilters(exams, 'All', gradeFilter, typeFilter, sortBy),
    [gradeFilter, typeFilter, sortBy],
  );

  const statusCounts = useMemo(() => {
    const counts: Record<ExamStatus, number> = {
      Upcoming: 0,
      Ongoing: 0,
      'Results Pending': 0,
      Completed: 0,
    };
    baseFiltered.forEach((e) => {
      counts[e.status] += 1;
    });
    return counts;
  }, [baseFiltered]);

  const statusTabs: { key: StatusFilter; label: string }[] = useMemo(
    () => [
      { key: 'All', label: `All (${baseFiltered.length})` },
      { key: 'Upcoming', label: statusTabLabel('Upcoming', statusCounts.Upcoming) },
      { key: 'Ongoing', label: statusTabLabel('Ongoing', statusCounts.Ongoing) },
      { key: 'Results Pending', label: statusTabLabel('Results Pending', statusCounts['Results Pending']) },
      { key: 'Completed', label: statusTabLabel('Completed', statusCounts.Completed) },
    ],
    [baseFiltered.length, statusCounts],
  );

  const visibleExams = useMemo(
    () => applyExamFilters(exams, tab, gradeFilter, typeFilter, sortBy),
    [tab, gradeFilter, typeFilter, sortBy],
  );

  const hasActiveFilters = gradeFilter !== 'all' || typeFilter !== 'all' || sortBy !== 'date-desc';

  const openFilterModal = () => {
    setDraftGrade(gradeFilter);
    setDraftType(typeFilter);
    setDraftSort(sortBy);
    setShowFilter(true);
  };

  const applyFilters = () => {
    setGradeFilter(draftGrade);
    setTypeFilter(draftType);
    setSortBy(draftSort);
    setShowFilter(false);
  };

  const clearFilters = () => {
    setGradeFilter('all');
    setTypeFilter('all');
    setSortBy('date-desc');
    setDraftGrade('all');
    setDraftType('all');
    setDraftSort('date-desc');
    setShowFilter(false);
  };

  const uploadExam = exams.find((e) => e.id === uploadExamId);
  const hallTicketExam = exams.find((e) => e.id === hallTicketExamId);
  const hallTickets = hallTicketExamId ? examHallTickets[hallTicketExamId] : undefined;

  const openTrackUploads = useCallback(
    (examId: string) => {
      setUploadExamId(examId);
      completeByExamId(examId);
    },
    [completeByExamId],
  );

  useFocusEffect(
    useCallback(() => {
      if (!pendingExamUploadId) return;
      setTab('Results Pending');
      setUploadExamId(pendingExamUploadId);
      completeByExamId(pendingExamUploadId);
      clearPendingExamUpload();
    }, [pendingExamUploadId, completeByExamId, clearPendingExamUpload]),
  );

  const handleCta = (examId: string, status: ExamStatus) => {
    if (status === 'Completed') {
      navigation.navigate('ReportsAnalytics');
      return;
    }
    if (status === 'Results Pending') {
      openTrackUploads(examId);
      return;
    }
    navigation.navigate('ExamTimetable', { examId });
  };

  const handleAddAction = (action: string) => {
    setShowAddMenu(false);
    Alert.alert(action, 'Exam schedule draft saved. HODs will be notified for review.');
  };

  const handleRemindAll = () => {
    Alert.alert('Reminders Sent', 'Pending teachers have been notified to upload results.');
  };

  return (
    <ScreenShell
      scroll={false}
      paddingBottom={0}
      activeTab="exams"
      onTabPress={(t) => handleAcademicTabPress(navigation, t)}
      header={
        <AcademicHeader
          title="Exam Management"
          right={
            <TouchableOpacity style={styles.iconCircle} onPress={openFilterModal}>
              <MaterialIcons name="filter-list" size={22} color={hasActiveFilters ? colors.primaryContainer : colors.onSurfaceVariant} />
              {hasActiveFilters ? <View style={styles.filterDot} /> : null}
            </TouchableOpacity>
          }
        />
      }
    >
      <View style={styles.screen}>
        <View style={styles.tabsWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
            {statusTabs.map((t) => {
              const isActive = tab === t.key;
              const countForTab =
                t.key === 'All'
                  ? baseFiltered.length
                  : statusCounts[t.key as ExamStatus] ?? 0;
              const isDisabled = t.key !== 'All' && countForTab === 0;
              return (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.tabChip, isActive && styles.tabChipActive, isDisabled && styles.tabChipDisabled]}
                  onPress={() => !isDisabled && setTab(t.key)}
                  disabled={isDisabled}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabChipText, isActive && styles.tabChipTextActive, isDisabled && styles.tabChipTextDisabled]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {hasActiveFilters || tab !== 'All' ? (
          <View style={styles.filterBanner}>
            <Text style={styles.filterBannerText}>
              Showing {visibleExams.length} exam{visibleExams.length === 1 ? '' : 's'}
              {tab !== 'All' ? ` · ${tab}` : ''}
              {hasActiveFilters ? ' · Filtered' : ''}
            </Text>
            {(hasActiveFilters || tab !== 'All') ? (
              <TouchableOpacity
                onPress={() => {
                  setTab('All');
                  clearFilters();
                }}
              >
                <Text style={styles.clearFilters}>Clear</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        <ScrollView style={styles.listScroll} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {visibleExams.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialIcons name="filter-alt-off" size={36} color={colors.outline} />
            <Text style={styles.empty}>No exams match these filters.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => { setTab('All'); clearFilters(); }}>
              <Text style={styles.emptyBtnText}>Reset filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          visibleExams.map((exam) => (
            <Card key={exam.id}>
              <View style={styles.examHead}>
                <View style={[styles.examIcon, exam.status === 'Results Pending' && styles.examIconPending, exam.status === 'Completed' && styles.examIconDone]}>
                  <MaterialIcons
                    name={exam.status === 'Completed' ? 'check-circle' : exam.status === 'Results Pending' ? 'edit-note' : 'calendar-today'}
                    size={22}
                    color={exam.status === 'Results Pending' ? colors.amber500 : exam.status === 'Completed' ? colors.slate400 : colors.blue600}
                  />
                </View>
                <View style={styles.examHeadBody}>
                  <Text style={styles.examTitle}>{exam.title}</Text>
                  <Text
                    style={[
                      styles.statusBadge,
                      exam.status === 'Upcoming' && styles.upcoming,
                      exam.status === 'Ongoing' && styles.ongoing,
                      exam.status === 'Results Pending' && styles.pending,
                      exam.status === 'Completed' && styles.completed,
                    ]}
                  >
                    {exam.status}
                  </Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <MaterialIcons name="event" size={14} color={colors.onSurfaceVariant} />
                <Text style={styles.examMeta}>{exam.dates}</Text>
                {exam.duration ? <Text style={styles.examMetaDot}>•</Text> : null}
                {exam.duration ? <Text style={styles.examMeta}>Duration: {exam.duration}</Text> : null}
              </View>
              {exam.grades ? (
                <View style={styles.metaRow}>
                  <MaterialIcons name="school" size={14} color={colors.onSurfaceVariant} />
                  <Text style={styles.examMeta}>{exam.grades}</Text>
                </View>
              ) : null}

              {exam.subjects ? (
                <View style={styles.subjectRow}>
                  {exam.subjects.map((s) => (
                    <Text key={s} style={styles.subjectChip}>
                      {s}
                    </Text>
                  ))}
                </View>
              ) : null}

              {exam.progress !== undefined && exam.status !== 'Results Pending' ? (
                <View style={styles.progressSection}>
                  <View style={styles.progressHead}>
                    <Text style={styles.progressLabel}>Preparation Progress</Text>
                    <Text style={styles.progressPct}>{exam.progress}%</Text>
                  </View>
                  <ProgressBar percent={exam.progress} color={colors.primaryContainer} />
                  {exam.prepChecklist ? (
                    <View style={styles.checklist}>
                      {exam.prepChecklist.map((item) => (
                        <View key={item.label} style={styles.checkItem}>
                          <MaterialIcons
                            name={item.done ? 'check-circle' : item.label === 'Invigilators' ? 'lock' : 'hourglass-empty'}
                            size={14}
                            color={item.done ? colors.primaryContainer : colors.onSurfaceVariant}
                          />
                          <Text style={[styles.checkText, !item.done && styles.checkTextPending]}>{item.label}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              ) : null}

              {exam.status === 'Results Pending' && exam.uploadDone !== undefined && exam.uploadTotal !== undefined ? (
                <View style={styles.progressSection}>
                  <View style={styles.progressHead}>
                    <Text style={styles.progressLabel}>Results Upload Status</Text>
                    <Text style={styles.progressPct}>
                      {exam.uploadDone} / {exam.uploadTotal} Teachers
                    </Text>
                  </View>
                  <ProgressBar percent={exam.progress ?? 0} color={colors.amber500} height={8} />
                </View>
              ) : null}

              {exam.passRate ? (
                <View style={styles.statsBox}>
                  <View style={styles.statCell}>
                    <Text style={styles.statLabel}>Pass Rate</Text>
                    <Text style={styles.statValue}>{exam.passRate}</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statCell}>
                    <Text style={styles.statLabel}>Avg. Score</Text>
                    <Text style={styles.statValueDark}>{exam.avg}</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statCell}>
                    <Text style={styles.statLabel}>Toppers</Text>
                    <Text style={styles.statValueDark}>{exam.toppers}</Text>
                  </View>
                </View>
              ) : null}

              {exam.status === 'Results Pending' ? (
                <View style={styles.ctaRow}>
                  <TouchableOpacity style={styles.cta} onPress={() => handleCta(exam.id, exam.status)}>
                    <Text style={styles.ctaText}>Track Uploads</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.ctaOutline} onPress={handleRemindAll}>
                    <Text style={styles.ctaOutlineText}>Remind All</Text>
                  </TouchableOpacity>
                </View>
              ) : exam.status === 'Upcoming' || exam.status === 'Ongoing' ? (
                <View style={styles.ctaRow}>
                  <TouchableOpacity style={styles.ctaOutline} onPress={() => setHallTicketExamId(exam.id)}>
                    <Text style={styles.ctaOutlineText}>Hall Tickets</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.ctaOutline} onPress={() => handleCta(exam.id, exam.status)}>
                    <Text style={styles.ctaOutlineText}>View Timetable</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.cta} onPress={() => handleCta(exam.id, exam.status)}>
                  <Text style={styles.ctaText}>{getCtaLabel(exam.status)}</Text>
                </TouchableOpacity>
              )}
            </Card>
          ))
        )}
        </ScrollView>

        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowAddMenu(true)}
          activeOpacity={0.85}
          accessibilityLabel="Schedule exam"
        >
          <MaterialIcons name="add" size={28} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>

      {/* Filter modal */}
      <Modal visible={showFilter} transparent animationType="fade" onRequestClose={() => setShowFilter(false)}>
        <Pressable style={styles.modalBackdropFade} onPress={() => setShowFilter(false)}>
          <Pressable style={styles.filterSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Filter Exams</Text>
              <TouchableOpacity onPress={() => setShowFilter(false)}>
                <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <Text style={styles.filterSection}>Grade Band</Text>
            <View style={styles.filterChipRow}>
              {examGradeFilters.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.filterChip, draftGrade === option.key && styles.filterChipActive]}
                  onPress={() => setDraftGrade(option.key)}
                >
                  <Text style={[styles.filterChipText, draftGrade === option.key && styles.filterChipTextActive]}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterSection}>Exam Type</Text>
            <View style={styles.filterChipRow}>
              {examTypeFilters.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.filterChip, draftType === option.key && styles.filterChipActive]}
                  onPress={() => setDraftType(option.key)}
                >
                  <Text style={[styles.filterChipText, draftType === option.key && styles.filterChipTextActive]}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterSection}>Sort By</Text>
            <View style={styles.sortList}>
              {examSortOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.sortRow, draftSort === option.key && styles.sortRowActive]}
                  onPress={() => setDraftSort(option.key)}
                >
                  <Text style={[styles.sortText, draftSort === option.key && styles.sortTextActive]}>{option.label}</Text>
                  {draftSort === option.key ? <MaterialIcons name="check" size={18} color={colors.primaryContainer} /> : null}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.filterActions}>
              <TouchableOpacity style={styles.filterClearBtn} onPress={clearFilters}>
                <Text style={styles.filterClearText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterApplyBtn} onPress={applyFilters}>
                <Text style={styles.filterApplyText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Hall tickets modal */}
      <Modal visible={!!hallTicketExamId} transparent animationType="slide" onRequestClose={() => setHallTicketExamId(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.uploadSheet}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Hall Tickets</Text>
              <TouchableOpacity onPress={() => setHallTicketExamId(null)}>
                <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            {hallTicketExam ? (
              <>
                <Text style={styles.modalSub}>{hallTicketExam.title}</Text>
                {hallTickets?.length ? (
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.uploadList}>
                    {hallTickets.map((ticket) => (
                      <View key={ticket.grade} style={styles.uploadRow}>
                        <View style={styles.uploadLeft}>
                          <Text style={styles.uploadName}>{ticket.grade}</Text>
                          <Text style={styles.uploadSubject}>
                            {ticket.issued} / {ticket.total} issued
                          </Text>
                        </View>
                        <Text style={[styles.uploadStatus, ticket.status === 'ready' ? styles.uploaded : styles.pendingStatus]}>
                          {ticket.status === 'ready' ? 'Ready' : 'In Progress'}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={styles.empty}>Hall tickets are being prepared for this exam.</Text>
                )}
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Track uploads modal */}
      <Modal visible={!!uploadExamId} transparent animationType="slide" onRequestClose={() => setUploadExamId(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.uploadSheet, { maxHeight: UPLOAD_SHEET_MAX, paddingBottom: sheetBottomPad }]}>
            <View style={[styles.modalHead, styles.uploadSheetHead]}>
              <Text style={styles.modalTitle}>Track Uploads</Text>
              <TouchableOpacity onPress={() => setUploadExamId(null)}>
                <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            {uploadExam ? (
              <>
                <Text style={[styles.modalSub, styles.uploadSheetSub]}>{uploadExam.title}</Text>
                <Text style={[styles.uploadSummary, styles.uploadSheetSub]}>
                  {uploadExam.uploadDone}/{uploadExam.uploadTotal} teachers uploaded · {uploadExam.progress}% complete
                </Text>
                <ScrollView
                  style={{ maxHeight: UPLOAD_SHEET_MAX - UPLOAD_FOOTER_HEIGHT - sheetBottomPad - 120 }}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.uploadList}
                >
                  {examUploadTeachers.map((teacher) => (
                    <View key={teacher.id} style={styles.uploadRow}>
                      <View style={styles.uploadLeft}>
                        <Text style={styles.uploadName}>{teacher.name}</Text>
                        <Text style={styles.uploadSubject}>{teacher.subject}</Text>
                      </View>
                      <View style={styles.uploadRight}>
                        <Text
                          style={[
                            styles.uploadStatus,
                            teacher.status === 'uploaded' && styles.uploaded,
                            teacher.status === 'pending' && styles.pendingStatus,
                            teacher.status === 'overdue' && styles.overdue,
                          ]}
                        >
                          {teacher.status === 'uploaded' ? 'Uploaded' : teacher.status === 'overdue' ? 'Overdue' : 'Pending'}
                        </Text>
                        {'uploadedAt' in teacher && teacher.uploadedAt ? (
                          <Text style={styles.uploadTime}>{teacher.uploadedAt}</Text>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </ScrollView>
                <View style={styles.uploadFooter}>
                  <TouchableOpacity
                    style={styles.uploadFooterBtn}
                    onPress={() => {
                      setUploadExamId(null);
                      navigation.navigate('ReportsAnalytics');
                    }}
                  >
                    <Text style={styles.ctaText}>View Reports</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Add exam FAB menu */}
      <Modal visible={showAddMenu} transparent animationType="fade" onRequestClose={() => setShowAddMenu(false)}>
        <Pressable style={styles.modalBackdropFade} onPress={() => setShowAddMenu(false)}>
          <Pressable style={styles.addMenu} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Schedule Exam</Text>
            {[
              { label: 'Create New Exam', icon: 'event' as const },
              { label: 'Add Unit Test', icon: 'assignment' as const },
              { label: 'Import Exam Calendar', icon: 'upload-file' as const },
            ].map((item) => (
              <TouchableOpacity key={item.label} style={styles.addRow} onPress={() => handleAddAction(item.label)}>
                <MaterialIcons name={item.icon} size={20} color={colors.primaryContainer} />
                <Text style={styles.addRowText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenShell>
  );
}

function createStyles(colors: AcademicColorScheme) {
  return StyleSheet.create({
  screen: { flex: 1, position: 'relative' },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primaryContainer,
  },
  tabsWrap: {
    backgroundColor: colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  tabsRow: { paddingHorizontal: spacing.gutter, gap: 8, paddingVertical: 12 },
  filterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.gutter,
    paddingVertical: 8,
    backgroundColor: `${colors.primaryContainer}14`,
  },
  filterBannerText: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  clearFilters: { ...textStyle('labelMd'), color: colors.primaryContainer, fontWeight: '700' },
  listScroll: { flex: 1 },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.slate100,
    minHeight: 36,
    justifyContent: 'center',
  },
  tabChipActive: { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer },
  tabChipDisabled: { opacity: 0.45 },
  tabChipText: { fontSize: 13, fontWeight: '500', color: colors.slate400 },
  tabChipTextActive: { color: colors.onPrimary, fontWeight: '600' },
  tabChipTextDisabled: { color: colors.outline },
  list: { padding: spacing.gutter, gap: 16, paddingBottom: LIST_BOTTOM_PAD },
  emptyWrap: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  empty: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant, textAlign: 'center' },
  emptyBtn: {
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.primaryContainer,
  },
  emptyBtnText: { ...textStyle('labelMd'), color: colors.primaryContainer, fontWeight: '700' },
  filterSheet: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 20,
    gap: 12,
    marginBottom: 40,
    maxHeight: '85%',
  },
  filterSection: { ...textStyle('chip10'), color: colors.outline, letterSpacing: 1, marginTop: 4 },
  filterChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLow,
  },
  filterChipActive: { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer },
  filterChipText: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  filterChipTextActive: { color: colors.onPrimary, fontWeight: '700' },
  sortList: { gap: 6 },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.slate100,
  },
  sortRowActive: { borderColor: colors.primaryContainer, backgroundColor: `${colors.primaryContainer}10` },
  sortText: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant },
  sortTextActive: { color: colors.primaryContainer, fontWeight: '600' },
  filterActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  filterClearBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
  },
  filterClearText: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant, fontWeight: '600' },
  filterApplyBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
  },
  filterApplyText: { ...textStyle('bodyMd'), color: colors.onPrimary, fontWeight: '700' },
  examHead: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  examIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.blue50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  examIconPending: { backgroundColor: '#fffbeb' },
  examIconDone: { backgroundColor: colors.surfaceContainerLow },
  examHeadBody: { flex: 1 },
  examTitle: { ...textStyle('headlineMd'), color: colors.onSurface },
  statusBadge: {
    ...textStyle('chip10'),
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    textTransform: 'uppercase',
  },
  upcoming: { backgroundColor: colors.blue50, color: colors.blue600 },
  ongoing: { backgroundColor: `${colors.primaryContainer}1a`, color: colors.primaryContainer },
  pending: { backgroundColor: '#fffbeb', color: colors.amber500 },
  completed: { backgroundColor: colors.surfaceContainerLow, color: colors.slate400 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  examMeta: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant },
  examMetaDot: { color: colors.onSurfaceVariant },
  subjectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  subjectChip: {
    ...textStyle('chip10'),
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    color: colors.onSurfaceVariant,
  },
  progressSection: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 12,
  },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 11, fontWeight: '600', color: colors.onSurfaceVariant },
  progressPct: { fontSize: 11, fontWeight: '700', color: colors.onSurface },
  checklist: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 4, width: '47%' },
  checkText: { fontSize: 10, color: colors.onSurface },
  checkTextPending: { color: colors.onSurfaceVariant },
  statsBox: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  statCell: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 32, backgroundColor: colors.outlineVariant },
  statLabel: { fontSize: 10, color: colors.onSurfaceVariant },
  statValue: { fontSize: 12, fontWeight: '700', color: colors.primaryContainer, marginTop: 2 },
  statValueDark: { fontSize: 12, fontWeight: '700', color: colors.onSurface, marginTop: 2 },
  ctaRow: { flexDirection: 'row', gap: 8 },
  cta: { flex: 1, backgroundColor: colors.primaryContainer, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  ctaText: { ...textStyle('bodyMd'), color: colors.onPrimary, fontWeight: '600' },
  ctaOutline: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ctaOutlineText: { ...textStyle('bodyMd'), color: colors.primary, fontWeight: '600' },
  fab: {
    position: 'absolute',
    right: spacing.gutter,
    bottom: FAB_BOTTOM,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: 16,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
  },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalBackdropFade: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end', padding: spacing.gutter },
  uploadSheet: {
    width: '100%',
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  uploadSheetHead: { paddingHorizontal: 20, paddingTop: 20, marginBottom: 0 },
  uploadSheetSub: { paddingHorizontal: 20 },
  uploadFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  uploadFooterBtn: {
    backgroundColor: colors.primaryContainer,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { ...textStyle('titleLg'), fontWeight: '700' },
  modalSub: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant, marginBottom: 8 },
  uploadSummary: { ...textStyle('labelMd'), color: colors.primaryContainer, fontWeight: '600', marginBottom: 12 },
  uploadList: { gap: 10, paddingBottom: 16 },
  uploadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.slate100,
    backgroundColor: colors.surfaceContainerLowest,
  },
  uploadLeft: { flex: 1 },
  uploadName: { ...textStyle('bodyMd'), fontWeight: '600' },
  uploadSubject: { ...textStyle('chip10'), color: colors.onSurfaceVariant, marginTop: 2 },
  uploadRight: { alignItems: 'flex-end' },
  uploadStatus: { ...textStyle('chip10'), fontWeight: '700', textTransform: 'uppercase' },
  uploaded: { color: colors.primaryContainer },
  pendingStatus: { color: colors.amber500 },
  overdue: { color: colors.error },
  uploadTime: { ...textStyle('chip10'), color: colors.outline, marginTop: 2 },
  addMenu: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 20,
    gap: 8,
    marginBottom: 100,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
  },
  addRowText: { ...textStyle('bodyMd'), fontWeight: '600' },
  });
}
