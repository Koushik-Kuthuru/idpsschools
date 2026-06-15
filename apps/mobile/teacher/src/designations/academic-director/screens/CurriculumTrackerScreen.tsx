import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Share,
  Alert,
  Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AcademicHeader } from '../components/AcademicHeader';
import { ScreenShell } from '../components/ScreenShell';
import { Card, ProgressBar } from '../components/ui';
import {
  curriculumByClass,
  curriculumBySubject,
  curriculumByTeacher,
  curriculumCalendarEvents,
  curriculumCoverage,
  curriculumTerms,
} from '../data/mockData';
import { handleAcademicTabPress } from '../navigation/navigationHelpers';
import type { RootStackParamList } from '../navigation/types';
import { SCHOOL_NAME } from '@/constants/school';
import type { AcademicColorScheme } from '../theme/colors';
import { spacing, textStyle, useAcademicTheme, useThemedStyles } from '@/designations/academic-director/theme';

const FAB_SIZE = 56;
const LIST_BOTTOM_PAD = FAB_SIZE + 24;

type ViewMode = 'By Subject' | 'By Class' | 'By Teacher';

function progressColor(colors: AcademicColorScheme, percent: number): string {
  if (percent >= 80) return colors.primaryContainer;
  if (percent >= 60) return colors.amber400;
  return colors.error;
}

export function CurriculumTrackerScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useAcademicTheme();
  const styles = useThemedStyles(createStyles);
  const statusStyles = (status: 'ON TRACK' | 'LAGGING') => {
    if (status === 'ON TRACK') {
      return { badge: styles.onTrack, text: styles.onTrackText, value: styles.progressOnTrack };
    }
    return { badge: styles.lagging, text: styles.laggingText, value: styles.progressLagging };
  };
  const [view, setView] = useState<ViewMode>('By Subject');
  const [termId, setTermId] = useState(curriculumTerms[0].id);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [detailSubjectId, setDetailSubjectId] = useState<string | null>(null);

  const selectedTerm = curriculumTerms.find((t) => t.id === termId) ?? curriculumTerms[0];
  const detailSubject = curriculumBySubject.find((s) => s.id === detailSubjectId);

  const shareSummary = useMemo(() => {
    const lagging = curriculumBySubject.filter((s) => s.status === 'LAGGING').length;
    return [
      `${SCHOOL_NAME} — Curriculum Tracker`,
      selectedTerm.shortLabel,
      `Coverage: Done ${curriculumCoverage.done}% · Active ${curriculumCoverage.active}% · Pending ${curriculumCoverage.pending}%`,
      `Target: ${curriculumCoverage.target}% by ${selectedTerm.targetDate}`,
      `${lagging} subject(s) lagging · ${curriculumBySubject.length} tracked`,
    ].join('\n');
  }, [selectedTerm]);

  const handleShare = async () => {
    try {
      await Share.share({ message: shareSummary, title: 'Curriculum Coverage Report' });
    } catch {
      Alert.alert('Share unavailable', 'Could not open the share sheet on this device.');
    }
  };

  const handleAddAction = (action: string) => {
    setShowAddMenu(false);
    Alert.alert(action, 'This update will be synced with department HODs.');
  };

  return (
    <ScreenShell
      scroll={false}
      paddingBottom={0}
      activeTab="curriculum"
      onTabPress={(t) => handleAcademicTabPress(navigation, t)}
      header={
        <AcademicHeader
          title="Curriculum Tracker"
          right={
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerBtn} onPress={() => setShowCalendar(true)} activeOpacity={0.7}>
                <MaterialIcons name="calendar-month" size={22} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerBtn} onPress={handleShare} activeOpacity={0.7}>
                <MaterialIcons name="share" size={22} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          }
        />
      }
    >
      <View style={styles.screen}>
        <ScrollView style={styles.pageScroll} contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
        <Card>
          <View style={styles.coverageHead}>
            <Text style={textStyle('titleLg')}>School-Wide Coverage</Text>
            <View style={styles.termBadgeWrap}>
              <Text style={styles.termBadgeTerm}>{selectedTerm.termLabel}</Text>
              <Text style={styles.termBadgeDate}>
                {selectedTerm.month} {selectedTerm.year}
              </Text>
            </View>
          </View>
          <View style={styles.stackedBar}>
            <View style={[styles.barDone, { flex: curriculumCoverage.done }]} />
            <View style={[styles.barActive, { flex: curriculumCoverage.active }]} />
            <View style={[styles.barPending, { flex: curriculumCoverage.pending }]} />
            <View style={[styles.targetMarker, { left: `${curriculumCoverage.target}%` }]} />
          </View>
          <View style={styles.legendRow}>
            <Text style={styles.legend}>Done {curriculumCoverage.done}%</Text>
            <Text style={styles.legend}>Active {curriculumCoverage.active}%</Text>
            <Text style={styles.legend}>Pending {curriculumCoverage.pending}%</Text>
          </View>
          <View style={styles.targetRow}>
            <Text style={styles.target}>Target: {curriculumCoverage.target}% by {selectedTerm.targetDate}</Text>
            <Text style={styles.goal}>{curriculumCoverage.goalGap}% to goal</Text>
          </View>
        </Card>

        <View style={styles.toggle}>
          {(['By Subject', 'By Class', 'By Teacher'] as ViewMode[]).map((v) => (
            <TouchableOpacity key={v} style={[styles.toggleBtn, view === v && styles.toggleActive]} onPress={() => setView(v)}>
              <Text style={[styles.toggleText, view === v && styles.toggleTextActive]}>{v}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.alert}>
          <MaterialIcons name="warning" size={22} color={colors.error} />
          <Text style={styles.alertText}>3 subjects are &gt;15% behind schedule.</Text>
          <TouchableOpacity style={styles.alertBtn} onPress={() => setView('By Subject')}>
            <Text style={styles.alertBtnText}>Take Action</Text>
          </TouchableOpacity>
        </View>

        {view === 'By Subject' &&
          curriculumBySubject.map((subject) => {
            const tone = statusStyles(subject.status);
            return (
              <Card key={subject.id} style={styles.subjectCard}>
                <View style={styles.subjectHead}>
                  <View style={styles.subjectLeft}>
                    <View style={styles.subjectIcon}>
                      <MaterialIcons name={subject.icon} size={22} color={colors.primaryContainer} />
                    </View>
                    <View style={styles.subjectMeta}>
                      <Text style={styles.subjectName}>{subject.name}</Text>
                      <Text style={styles.hod}>HOD: {subject.hod}</Text>
                    </View>
                  </View>
                  <View style={styles.subjectRight}>
                    <Text style={[styles.progressValue, tone.value]}>{subject.progress}%</Text>
                    <Text style={[styles.statusBadge, tone.badge, tone.text]}>{subject.status}</Text>
                  </View>
                </View>

                {subject.classes.length > 0 ? (
                  <View style={styles.breakdown}>
                    {subject.classes.map((cls) => (
                      <View key={cls.name} style={styles.classRow}>
                        <View style={styles.classLabelRow}>
                          <Text style={styles.classLabel}>{cls.name}</Text>
                          <Text style={styles.classPct}>{cls.progress}%</Text>
                        </View>
                        <ProgressBar percent={cls.progress} color={progressColor(colors, cls.progress)} height={6} />
                      </View>
                    ))}
                  </View>
                ) : null}

                <View style={styles.subjectFooter}>
                  <View style={styles.footerMeta}>
                    <Text style={styles.footerMetaText}>Teachers: {subject.teacherCount}</Text>
                    <Text style={styles.footerMetaText}>
                      Chapters: {subject.chaptersDone}/{subject.chaptersTotal}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.viewDetailsBtn} onPress={() => setDetailSubjectId(subject.id)}>
                    <Text style={styles.viewDetails}>View Details</Text>
                    <MaterialIcons name="arrow-forward" size={14} color={colors.primaryContainer} />
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })}

        {view === 'By Class' &&
          curriculumByClass.map((cls) => {
            const tone = statusStyles(cls.status);
            return (
              <Card key={cls.id} style={styles.subjectCard}>
                <View style={styles.subjectHead}>
                  <View style={styles.subjectLeft}>
                    <View style={styles.subjectIcon}>
                      <MaterialIcons name="school" size={22} color={colors.primaryContainer} />
                    </View>
                    <View style={styles.subjectMeta}>
                      <Text style={styles.subjectName}>{cls.name}</Text>
                      <Text style={styles.hod}>Class Teacher: {cls.classTeacher}</Text>
                    </View>
                  </View>
                  <View style={styles.subjectRight}>
                    <Text style={[styles.progressValue, tone.value]}>{cls.progress}%</Text>
                    <Text style={[styles.statusBadge, tone.badge, tone.text]}>{cls.status}</Text>
                  </View>
                </View>
                <View style={styles.breakdown}>
                  {cls.subjects.map((sub) => (
                    <View key={sub.name} style={styles.classRow}>
                      <View style={styles.classLabelRow}>
                        <Text style={styles.classLabel}>{sub.name}</Text>
                        <Text style={styles.classPct}>{sub.progress}%</Text>
                      </View>
                      <Text style={styles.teacherLine}>Teacher: {sub.teacher}</Text>
                      <ProgressBar percent={sub.progress} color={progressColor(colors, sub.progress)} height={6} />
                    </View>
                  ))}
                </View>
              </Card>
            );
          })}

        {view === 'By Teacher' &&
          curriculumByTeacher.map((teacher) => {
            const tone = statusStyles(teacher.status);
            return (
              <Card key={teacher.id} style={styles.subjectCard}>
                <View style={styles.subjectHead}>
                  <View style={styles.subjectLeft}>
                    <View style={[styles.subjectIcon, styles.teacherIcon]}>
                      <MaterialIcons name="person" size={22} color={colors.primary} />
                    </View>
                    <View style={styles.subjectMeta}>
                      <Text style={styles.subjectName}>{teacher.name}</Text>
                      <Text style={styles.hod}>
                        {teacher.role} · {teacher.subject}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.subjectRight}>
                    <Text style={[styles.progressValue, tone.value]}>{teacher.progress}%</Text>
                    <Text style={[styles.statusBadge, tone.badge, tone.text]}>{teacher.status}</Text>
                  </View>
                </View>
                <View style={styles.breakdown}>
                  <Text style={styles.teacherLine}>
                    Classes: {teacher.classes.join(', ')}
                  </Text>
                  <Text style={styles.teacherLine}>
                    Chapters: {teacher.chaptersDone}/{teacher.chaptersTotal}
                  </Text>
                  <ProgressBar percent={teacher.progress} color={progressColor(colors, teacher.progress)} height={6} />
                </View>
              </Card>
            );
          })}
        </ScrollView>

        <TouchableOpacity style={styles.fab} onPress={() => setShowAddMenu(true)} activeOpacity={0.85}>
          <MaterialIcons name="add" size={28} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>

      {/* Term / calendar picker */}
      <Modal visible={showCalendar} transparent animationType="fade" onRequestClose={() => setShowCalendar(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowCalendar(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Academic Calendar</Text>
              <TouchableOpacity onPress={() => setShowCalendar(false)}>
                <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            <View style={styles.termDetailCard}>
              <Text style={styles.termDetailYear}>Academic Year {selectedTerm.academicYear}</Text>
              <Text style={styles.termDetailMain}>
                {selectedTerm.termLabel} — {selectedTerm.month} {selectedTerm.year}
              </Text>
              <Text style={styles.termDetailPeriod}>Coverage period: {selectedTerm.period}</Text>
              <Text style={styles.termDetailTarget}>Target date: {selectedTerm.targetDate}</Text>
            </View>
            <Text style={styles.modalSection}>Select Term</Text>
            <View style={styles.termRow}>
              {curriculumTerms.map((term) => (
                <TouchableOpacity
                  key={term.id}
                  style={[styles.termChip, termId === term.id && styles.termChipActive]}
                  onPress={() => setTermId(term.id)}
                >
                  <Text style={[styles.termChipTerm, termId === term.id && styles.termChipTextActive]}>{term.termLabel}</Text>
                  <Text style={[styles.termChipSub, termId === term.id && styles.termChipSubActive]}>
                    {term.month} {term.year}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.modalSection}>Key Dates</Text>
            {curriculumCalendarEvents.map((event) => (
              <View key={event.date + event.label} style={styles.eventRow}>
                <View style={[styles.eventDot, event.tone === 'error' && styles.eventDotError, event.tone === 'tertiary' && styles.eventDotTertiary]} />
                <View style={styles.eventBody}>
                  <Text style={styles.eventDate}>{event.date}</Text>
                  <Text style={styles.eventLabel}>{event.label}</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.modalPrimaryBtn} onPress={() => setShowCalendar(false)}>
              <Text style={styles.modalPrimaryText}>Apply</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Subject details */}
      <Modal visible={!!detailSubject} transparent animationType="slide" onRequestClose={() => setDetailSubjectId(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.detailSheet}>
            {detailSubject ? (
              <>
                <View style={styles.modalHead}>
                  <Text style={styles.modalTitle}>{detailSubject.name}</Text>
                  <TouchableOpacity onPress={() => setDetailSubjectId(null)}>
                    <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
                  </TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailScroll}>
                  <View style={styles.detailSummary}>
                    <Text style={styles.detailProgress}>{detailSubject.progress}%</Text>
                    <Text style={[styles.statusBadge, statusStyles(detailSubject.status).badge, statusStyles(detailSubject.status).text]}>
                      {detailSubject.status}
                    </Text>
                  </View>
                  <Text style={styles.detailLine}>HOD: {detailSubject.hod}</Text>
                  <Text style={styles.detailLine}>
                    Chapters: {detailSubject.chaptersDone}/{detailSubject.chaptersTotal}
                  </Text>
                  <Text style={styles.detailLine}>Last updated: {detailSubject.lastUpdated}</Text>

                  <Text style={styles.detailSection}>Class Breakdown</Text>
                  {detailSubject.classes.map((cls) => (
                    <View key={cls.name} style={styles.classRow}>
                      <View style={styles.classLabelRow}>
                        <Text style={styles.classLabel}>{cls.name}</Text>
                        <Text style={styles.classPct}>{cls.progress}%</Text>
                      </View>
                      <ProgressBar percent={cls.progress} color={progressColor(colors, cls.progress)} height={6} />
                    </View>
                  ))}

                  <Text style={styles.detailSection}>Teachers ({detailSubject.teacherCount})</Text>
                  {detailSubject.teachers.map((t) => (
                    <Text key={t} style={styles.detailBullet}>• {t}</Text>
                  ))}

                  <Text style={styles.detailSection}>Topics Covered</Text>
                  {detailSubject.topics.map((topic) => (
                    <Text key={topic} style={styles.detailBullet}>• {topic}</Text>
                  ))}
                </ScrollView>
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Add menu */}
      <Modal visible={showAddMenu} transparent animationType="fade" onRequestClose={() => setShowAddMenu(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowAddMenu(false)}>
          <Pressable style={styles.addMenu} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Add Curriculum Update</Text>
            {[
              { label: 'Log Chapter Completion', icon: 'menu-book' as const },
              { label: 'Assign Substitute Teacher', icon: 'person-add' as const },
              { label: 'Flag Coverage Gap', icon: 'flag' as const },
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
  pageScroll: { flex: 1 },
  pageContent: { padding: spacing.gutter, gap: 16, paddingBottom: LIST_BOTTOM_PAD },
  headerActions: { flexDirection: 'row', gap: 4 },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  coverageHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  termBadgeWrap: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'flex-end',
  },
  termBadgeTerm: { ...textStyle('chip10'), fontWeight: '700', color: colors.onSurface, letterSpacing: 0.5 },
  termBadgeDate: { ...textStyle('chip10'), color: colors.onSurfaceVariant, marginTop: 2 },
  termDetailCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  termDetailYear: { ...textStyle('chip10'), color: colors.outline, letterSpacing: 1, textTransform: 'uppercase' },
  termDetailMain: { ...textStyle('bodyMd'), fontWeight: '700', color: colors.onSurface },
  termDetailPeriod: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  termDetailTarget: { ...textStyle('labelMd'), color: colors.primaryContainer, fontWeight: '600' },
  stackedBar: { flexDirection: 'row', height: 32, borderRadius: 16, overflow: 'hidden', position: 'relative' },
  barDone: { backgroundColor: colors.primaryContainer },
  barActive: { backgroundColor: colors.amber400 },
  barPending: { backgroundColor: colors.error },
  targetMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.7)',
    zIndex: 1,
  },
  legendRow: { flexDirection: 'row', gap: 16, marginTop: 12 },
  legend: { fontSize: 11, fontWeight: '500', color: colors.onSurfaceVariant },
  targetRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  target: { fontSize: 11, color: colors.outline },
  goal: { fontSize: 11, fontWeight: '700', color: colors.primaryContainer, fontStyle: 'italic' },
  toggle: { flexDirection: 'row', backgroundColor: colors.surfaceContainerHigh, borderRadius: 12, padding: 4 },
  toggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  toggleActive: { backgroundColor: colors.surfaceContainerLowest },
  toggleText: { fontSize: 14, fontWeight: '500', color: colors.onSurfaceVariant },
  toggleTextActive: { color: colors.primaryContainer, fontWeight: '600' },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: `${colors.errorContainer}33`,
    borderWidth: 1,
    borderColor: `${colors.error}1a`,
    borderRadius: 12,
    padding: 16,
  },
  alertText: { ...textStyle('bodyMd'), fontWeight: '600', flex: 1, color: colors.onErrorContainer },
  alertBtn: { backgroundColor: colors.tertiary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  alertBtnText: { ...textStyle('chip10'), color: colors.onTertiary, fontWeight: '700' },
  subjectCard: { padding: 0, overflow: 'hidden' },
  subjectHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.outlineVariant}33`,
  },
  subjectLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  subjectIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${colors.primaryContainer}1a`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teacherIcon: { backgroundColor: `${colors.primary}14` },
  subjectMeta: { flex: 1 },
  subjectName: { ...textStyle('bodyLg'), fontWeight: '700' },
  hod: { ...textStyle('chip10'), color: colors.outline, letterSpacing: 1, marginTop: 2, textTransform: 'uppercase' },
  subjectRight: { alignItems: 'flex-end', gap: 6, minWidth: 72 },
  progressValue: { fontSize: 20, fontWeight: '700', lineHeight: 24 },
  progressOnTrack: { color: colors.primaryContainer },
  progressLagging: { color: colors.amber400 },
  statusBadge: {
    ...textStyle('chip10'),
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
    textAlign: 'center',
  },
  onTrack: { backgroundColor: `${colors.primaryContainer}1a` },
  onTrackText: { color: colors.primaryContainer },
  lagging: { backgroundColor: `${colors.amber400}1a` },
  laggingText: { color: colors.amber400 },
  breakdown: { padding: 16, gap: 12 },
  classRow: { gap: 6 },
  classLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  classLabel: { fontSize: 12, fontWeight: '600', color: colors.onSurfaceVariant },
  classPct: { fontSize: 12, fontWeight: '600', color: colors.onSurfaceVariant },
  teacherLine: { ...textStyle('chip10'), color: colors.outline, marginBottom: 2 },
  subjectFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  footerMeta: { flexDirection: 'row', gap: 12, flex: 1, flexWrap: 'wrap' },
  footerMetaText: { ...textStyle('chip10'), color: colors.outline, textTransform: 'uppercase', fontWeight: '700' },
  viewDetailsBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewDetails: { ...textStyle('labelMd'), color: colors.primaryContainer, fontWeight: '700' },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: 16,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    padding: spacing.gutter,
  },
  modalCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 20,
    gap: 12,
    marginBottom: 40,
  },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { ...textStyle('titleLg'), fontWeight: '700' },
  modalSub: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant },
  modalSection: { ...textStyle('chip10'), color: colors.outline, letterSpacing: 1, marginTop: 4 },
  termRow: { gap: 8 },
  termChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLow,
  },
  termChipActive: { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer },
  termChipTerm: { ...textStyle('labelMd'), fontWeight: '700', color: colors.onSurfaceVariant },
  termChipSub: { ...textStyle('chip10'), color: colors.outline, marginTop: 2 },
  termChipSubActive: { color: colors.onPrimary },
  termChipTextActive: { color: colors.onPrimary },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  eventDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primaryContainer },
  eventDotError: { backgroundColor: colors.error },
  eventDotTertiary: { backgroundColor: colors.tertiary },
  eventBody: { flex: 1 },
  eventDate: { ...textStyle('labelMd'), fontWeight: '700' },
  eventLabel: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant },
  modalPrimaryBtn: {
    backgroundColor: colors.primaryContainer,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  modalPrimaryText: { ...textStyle('bodyMd'), color: colors.onPrimary, fontWeight: '700' },
  detailSheet: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '82%',
  },
  detailScroll: { gap: 10, paddingBottom: 24 },
  detailSummary: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  detailProgress: { fontSize: 32, fontWeight: '700', color: colors.primaryContainer },
  detailLine: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant },
  detailSection: { ...textStyle('titleLg'), marginTop: 12, marginBottom: 4 },
  detailBullet: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant, paddingLeft: 4 },
  addMenu: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 20,
    gap: 8,
    marginBottom: 100,
  },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.slate100 },
  addRowText: { ...textStyle('bodyMd'), fontWeight: '600' },
  });
}
