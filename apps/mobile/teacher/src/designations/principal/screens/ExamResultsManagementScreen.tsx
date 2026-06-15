import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { PrincipalHeader } from '../components/PrincipalHeader';
import { ScreenShell } from '../components/ScreenShell';
import { Card, ProgressBar } from '../components/ui';
import {
  EXAM_GRADES,
  EXAM_TYPES,
  initialExamSchedule,
  initialPassFailDistribution,
  initialResultsStatus,
  initialUpcomingExams,
  type ExamScheduleRow,
  type ExamStatus,
  type ExamTerm,
  type PassFailDistribution,
  type UpcomingExam,
} from '../data/mockData';

type ExamGrade = (typeof EXAM_GRADES)[number];
type ExamType = (typeof EXAM_TYPES)[number];

interface ExamForm {
  grade: ExamGrade;
  examType: ExamType;
  term: ExamTerm;
  startDate: string;
  endDate: string;
}
import { addDays, isSunday, startOfDay } from '@/utils/datetime';
import { spacing, textStyle, usePrincipalTheme, useThemedStyles } from '@/designations/principal/theme';
import type { PrincipalColorScheme } from '@/designations/principal/theme/colors';

const TERMS: ExamTerm[] = ['Term 1', 'Term 2', 'Term 3', 'Final'];

function statusStyle(status: ExamStatus) {
  if (status === 'DRAFT') return { bg: '#fef3c7', text: '#b45309' };
  if (status === 'IN PROGRESS') return { bg: '#d1fae5', text: '#047857' };
  return { bg: '#dbeafe', text: '#1d4ed8' };
}

function actionLabel(status: ExamStatus): string {
  if (status === 'DRAFT') return 'Review & Approve';
  if (status === 'IN PROGRESS') return 'View Live Status';
  return 'View Results';
}

function termCalendarWindow(term: ExamTerm, year = new Date().getFullYear()) {
  if (term === 'Term 1') return { start: new Date(year, 0, 15), end: new Date(year, 3, 30) };
  if (term === 'Term 2') return { start: new Date(year, 4, 1), end: new Date(year, 7, 31) };
  if (term === 'Term 3') return { start: new Date(year, 8, 1), end: new Date(year, 11, 15) };
  return { start: new Date(year, 11, 1), end: new Date(year, 11, 31) };
}

function formatShortRange(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const y = start.getFullYear();
  if (start.getMonth() === end.getMonth()) {
    return `${start.toLocaleDateString('en-US', opts)}–${end.getDate()}, ${y}`;
  }
  return `${start.toLocaleDateString('en-US', opts)}–${end.toLocaleDateString('en-US', opts)}, ${y}`;
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function nextWeekdayInTerm(term: ExamTerm): Date {
  const { start, end } = termCalendarWindow(term);
  let cursor = startOfDay(start);
  const today = startOfDay(new Date());
  if (cursor < today && today <= end) cursor = today;
  while (cursor <= end) {
    if (!isSunday(cursor)) return cursor;
    cursor = addDays(cursor, 1);
  }
  return startOfDay(start);
}

function emptyExamForm(term: ExamTerm): ExamForm {
  const start = nextWeekdayInTerm(term);
  const end = addDays(start, 4);
  return {
    grade: EXAM_GRADES[4],
    examType: EXAM_TYPES[1],
    term,
    startDate: toIsoDate(start),
    endDate: toIsoDate(end),
  };
}

export function ExamResultsManagementScreen() {
  const { colors } = usePrincipalTheme();
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation();
  const [term, setTerm] = useState<ExamTerm>('Term 2');
  const [exams, setExams] = useState<UpcomingExam[]>(initialUpcomingExams);
  const [schedule, setSchedule] = useState<ExamScheduleRow[]>(initialExamSchedule);
  const [addOpen, setAddOpen] = useState(false);
  const [detailExam, setDetailExam] = useState<UpcomingExam | null>(null);
  const [form, setForm] = useState<ExamForm>(() => emptyExamForm('Term 2'));

  const calendarWindow = useMemo(() => termCalendarWindow(term), [term]);
  const termExams = useMemo(() => exams.filter((e) => e.term === term), [exams, term]);
  const termSchedule = useMemo(
    () =>
      schedule.filter((row) => {
        const exam = exams.find((e) => e.id === row.examId);
        return exam?.term === term;
      }),
    [exams, schedule, term],
  );

  const openAddExam = () => {
    setForm(emptyExamForm(term));
    setAddOpen(true);
  };

  const handleExamAction = (exam: UpcomingExam) => {
    if (exam.status === 'DRAFT') {
      Alert.alert('Approve exam schedule?', `${exam.title} will move to In Progress.`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => {
            setExams((prev) =>
              prev.map((e) => (e.id === exam.id ? { ...e, status: 'IN PROGRESS' as const } : e)),
            );
            Alert.alert('Approved', `${exam.title} is now live on the academic calendar.`);
          },
        },
      ]);
      return;
    }
    setDetailExam(exam);
  };

  const addExam = () => {
    const grade = form.grade;
    const title = `${grade} ${form.examType}`;
    const start = new Date(`${form.startDate}T00:00:00`);
    const end = new Date(`${form.endDate}T00:00:00`);
    const window = termCalendarWindow(form.term);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      Alert.alert('Invalid dates', 'Enter valid start and end dates (YYYY-MM-DD).');
      return;
    }
    if (start < window.start || end > window.end) {
      Alert.alert('Outside academic calendar', `${form.term} runs ${formatShortRange(window.start, window.end)}.`);
      return;
    }
    if (end < start) {
      Alert.alert('Invalid range', 'End date must be on or after the start date.');
      return;
    }
    if (isSunday(start) || isSunday(end)) {
      Alert.alert('Sunday holiday', 'Exams cannot start or end on Sunday.');
      return;
    }

    const id = `e-${Date.now()}`;
    const dates = formatShortRange(start, end);
    const newExam: UpcomingExam = {
      id,
      title,
      grades: grade,
      term: form.term,
      status: 'DRAFT',
      dates,
      startDate: form.startDate,
      endDate: form.endDate,
      subjects: 'To be scheduled',
    };

    const classCode = grade.replace('Grade ', '');
    const scheduleRow: ExamScheduleRow = {
      id: `es-${Date.now()}`,
      examId: id,
      date: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      subject: 'Paper I',
      class: `${classCode}-A`,
      time: '09:00 AM',
    };

    setExams((prev) => [newExam, ...prev]);
    setSchedule((prev) => [scheduleRow, ...prev]);
    setTerm(form.term);
    setAddOpen(false);
    Alert.alert('Exam added', `${title} scheduled for ${dates} (${form.term}).`);
  };

  return (
    <>
      <ScreenShell
        scroll={false}
        paddingBottom={0}
        header={<PrincipalHeader title="Exam & Results" onBack={() => navigation.goBack()} />}
      >
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.termRow}>
            {TERMS.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.termChip, term === t && styles.termActive]}
                onPress={() => setTerm(t)}
                activeOpacity={0.7}
              >
                <Text style={[styles.termText, term === t && styles.termTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.calendarHint}>
            Academic window: {formatShortRange(calendarWindow.start, calendarWindow.end)}
          </Text>

          <Text style={styles.sectionTitle}>Upcoming Exams</Text>
          {termExams.length === 0 ? (
            <Text style={styles.empty}>No exams scheduled for {term}. Tap + to add one.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.examRow}>
              {termExams.map((e) => {
                const st = statusStyle(e.status);
                return (
                  <Card key={e.id} style={styles.examCard}>
                    <Text style={[styles.statusChip, { backgroundColor: st.bg, color: st.text }]}>{e.status}</Text>
                    <Text style={styles.examTitle}>{e.title}</Text>
                    <Text style={styles.examGrades}>{e.grades}</Text>
                    <Text style={styles.examDates}>{e.dates}</Text>
                    {e.subjects ? <Text style={styles.examSubjects}>{e.subjects}</Text> : null}
                    <TouchableOpacity onPress={() => handleExamAction(e)} activeOpacity={0.7}>
                      <Text style={styles.examAction}>{actionLabel(e.status)}</Text>
                    </TouchableOpacity>
                  </Card>
                );
              })}
            </ScrollView>
          )}

          <Text style={styles.sectionTitle}>{term} Exam Schedule</Text>
          <Card style={styles.tableCard}>
            <View style={styles.tableHead}>
              <Text style={[styles.th, { flex: 1 }]}>Date</Text>
              <Text style={[styles.th, { flex: 1 }]}>Subject</Text>
              <Text style={styles.th}>Class</Text>
              <Text style={styles.th}>Time</Text>
            </View>
            {termSchedule.length === 0 ? (
              <Text style={styles.emptyTable}>No papers scheduled yet for {term}.</Text>
            ) : (
              termSchedule.map((row) => (
                <View key={row.id} style={styles.tableRow}>
                  <Text style={[styles.td, { flex: 1 }]}>{row.date}</Text>
                  <Text style={[styles.td, { flex: 1 }]}>{row.subject}</Text>
                  <Text style={styles.td}>{row.class}</Text>
                  <Text style={styles.td}>{row.time}</Text>
                </View>
              ))
            )}
          </Card>

          <Text style={styles.sectionTitle}>Results Status — All Classes</Text>
          {initialResultsStatus.map((r) => (
            <Card key={r.grade} style={styles.resultCard}>
              <View style={styles.resultHead}>
                <Text style={styles.resultGrade}>{r.grade}</Text>
                <Text style={styles.resultLabel}>
                  {r.label} · {r.sectionsPublished}/{r.totalSections} sections
                </Text>
              </View>
              <ProgressBar percent={r.percent} color={colors.primaryContainer} />
              <Text style={styles.resultPct}>{r.percent}% uploaded</Text>
            </Card>
          ))}

          <Text style={styles.sectionTitle}>Pass/Fail Distribution — All Classes</Text>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.primaryContainer }]} />
              <Text style={styles.legendText}>Pass</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.red400 }]} />
              <Text style={styles.legendText}>Fail</Text>
            </View>
          </View>
          {initialPassFailDistribution.map((d) => (
            <PassFailRow key={d.grade} data={d} />
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={openAddExam}>
          <MaterialIcons name="add" size={28} color={colors.onPrimary} />
        </TouchableOpacity>
      </ScreenShell>

      {/* Add exam */}
      <Modal visible={addOpen} transparent animationType="slide" onRequestClose={() => setAddOpen(false)}>
        <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.modalBackdrop} onPress={() => setAddOpen(false)}>
            <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
              <View style={styles.sheetHead}>
                <Text style={styles.sheetTitle}>Add Exam</Text>
                <TouchableOpacity onPress={() => setAddOpen(false)}>
                  <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>
              <Text style={styles.sheetSub}>
                Dates must fall within the {form.term} academic calendar.
              </Text>

              <Text style={styles.fieldLabel}>Academic term</Text>
              <View style={styles.wrapRow}>
                {TERMS.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.optionChip, form.term === t && styles.optionActive]}
                    onPress={() => setForm((f) => ({ ...emptyExamForm(t), grade: f.grade, examType: f.examType }))}
                  >
                    <Text style={[styles.optionText, form.term === t && styles.optionTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Grade</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                {EXAM_GRADES.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.optionChip, form.grade === g && styles.optionActive]}
                    onPress={() => setForm((f) => ({ ...f, grade: g }))}
                  >
                    <Text style={[styles.optionText, form.grade === g && styles.optionTextActive]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.fieldLabel}>Exam type</Text>
              <View style={styles.wrapRow}>
                {EXAM_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.optionChip, form.examType === type && styles.optionActive]}
                    onPress={() => setForm((f) => ({ ...f, examType: type }))}
                  >
                    <Text style={[styles.optionText, form.examType === type && styles.optionTextActive]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Start date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={form.startDate}
                onChangeText={(v) => setForm((f) => ({ ...f, startDate: v }))}
                placeholder="2026-06-12"
                placeholderTextColor={colors.outline}
              />
              <Text style={styles.fieldLabel}>End date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={form.endDate}
                onChangeText={(v) => setForm((f) => ({ ...f, endDate: v }))}
                placeholder="2026-06-20"
                placeholderTextColor={colors.outline}
              />

              <TouchableOpacity style={styles.primaryBtn} onPress={addExam}>
                <Text style={styles.primaryBtnText}>Add to calendar</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Live status / results detail */}
      <Modal visible={!!detailExam} transparent animationType="slide" onRequestClose={() => setDetailExam(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setDetailExam(null)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            {detailExam ? (
              <>
                <View style={styles.sheetHead}>
                  <Text style={styles.sheetTitle}>{detailExam.title}</Text>
                  <TouchableOpacity onPress={() => setDetailExam(null)}>
                    <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.detailMeta}>
                  {detailExam.status} · {detailExam.dates} · {detailExam.term}
                </Text>
                {detailExam.status === 'IN PROGRESS' ? (
                  <>
                    <Text style={styles.detailSection}>Live status</Text>
                    {schedule
                      .filter((s) => s.examId === detailExam.id)
                      .map((s) => (
                        <Text key={s.id} style={styles.detailLine}>
                          {s.date} · {s.subject} · {s.class} · {s.time}
                        </Text>
                      ))}
                    <Text style={styles.detailHint}>Papers in progress — invigilation reports updating live.</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.detailSection}>Class results summary</Text>
                    {initialPassFailDistribution
                      .filter((d) => d.grade === detailExam.grades)
                      .map((d) => (
                        <Text key={d.grade} style={styles.detailLine}>
                          {d.grade}: {d.passPercent}% pass ({d.passCount}) · {d.failPercent}% fail ({d.failCount})
                        </Text>
                      ))}
                    {initialResultsStatus
                      .filter((r) => detailExam.grades === r.grade)
                      .map((r) => (
                        <Text key={r.grade} style={styles.detailHint}>
                          Upload status: {r.label} — {r.sectionsPublished}/{r.totalSections} sections published.
                        </Text>
                      ))}
                  </>
                )}
                <TouchableOpacity style={styles.primaryBtn} onPress={() => setDetailExam(null)}>
                  <Text style={styles.primaryBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function PassFailRow({ data }: { data: PassFailDistribution }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.distRow}>
      <Text style={styles.distGrade}>{data.grade.replace('Grade ', 'G')}</Text>
      <View style={styles.distBody}>
        <View style={styles.distTrack}>
          <View style={[styles.distPass, { width: `${data.passPercent}%` }]} />
          <View style={[styles.distFail, { width: `${data.failPercent}%` }]} />
        </View>
        <Text style={styles.distMeta}>
          Pass {data.passPercent}% ({data.passCount}) · Fail {data.failPercent}% ({data.failCount})
        </Text>
      </View>
    </View>
  );
}

function createStyles(colors: PrincipalColorScheme) {
  return StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.gutter, gap: spacing.md, paddingBottom: 100 },
  termRow: { gap: spacing.sm },
  termChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.outlineVariant },
  termActive: { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer },
  termText: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  termTextActive: { color: colors.onPrimary, fontWeight: '700' },
  calendarHint: { ...textStyle('labelMd'), color: colors.onSurfaceVariant, fontStyle: 'italic' },
  sectionTitle: { ...textStyle('titleLg'), fontWeight: '600' },
  empty: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant, fontStyle: 'italic' },
  examRow: { gap: spacing.md, paddingBottom: 4 },
  examCard: { minWidth: 210, gap: 4 },
  statusChip: { alignSelf: 'flex-start', ...textStyle('chip10'), fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  examTitle: { ...textStyle('bodyMd'), fontWeight: '700' },
  examGrades: { ...textStyle('chip10'), color: colors.primary, fontWeight: '600' },
  examDates: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  examSubjects: { ...textStyle('chip10'), color: colors.onSurfaceVariant },
  examAction: { ...textStyle('labelMd'), color: colors.primary, fontWeight: '700', marginTop: 6 },
  tableCard: { padding: 0, overflow: 'hidden' },
  tableHead: { flexDirection: 'row', padding: 12, backgroundColor: colors.green50 },
  th: { ...textStyle('chip10'), fontWeight: '700', width: 56 },
  tableRow: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: colors.outlineVariant },
  td: { ...textStyle('labelMd'), width: 56 },
  emptyTable: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant, padding: 16, textAlign: 'center' },
  resultCard: { gap: 6 },
  resultHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  resultGrade: { ...textStyle('bodyMd'), fontWeight: '700' },
  resultLabel: { ...textStyle('chip10'), color: colors.onSurfaceVariant, flex: 1, textAlign: 'right' },
  resultPct: { ...textStyle('chip10'), color: colors.primary, fontWeight: '600' },
  legendRow: { flexDirection: 'row', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { ...textStyle('chip10'), color: colors.onSurfaceVariant },
  distRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  distGrade: { width: 28, ...textStyle('labelMd'), fontWeight: '700', marginTop: 2 },
  distBody: { flex: 1, gap: 4 },
  distTrack: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', backgroundColor: colors.surfaceVariant },
  distPass: { backgroundColor: colors.primaryContainer, height: 12 },
  distFail: { backgroundColor: colors.red400, height: 12 },
  distMeta: { ...textStyle('chip10'), color: colors.onSurfaceVariant },
  fab: {
    position: 'absolute',
    right: spacing.gutter,
    bottom: spacing.fabBottom,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.gutter,
    paddingBottom: spacing.lg,
    maxHeight: '90%',
  },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sheetTitle: { ...textStyle('titleLg'), fontWeight: '700', flex: 1 },
  sheetSub: { ...textStyle('labelMd'), color: colors.onSurfaceVariant, marginBottom: 8 },
  fieldLabel: { ...textStyle('labelMd'), color: colors.onSurfaceVariant, marginTop: 8, marginBottom: 6 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipScroll: { gap: 8 },
  optionChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.outlineVariant },
  optionActive: { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer },
  optionText: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  optionTextActive: { color: colors.onPrimary, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 10,
    padding: 12,
    ...textStyle('bodyMd'),
    color: colors.onSurface,
  },
  primaryBtn: { marginTop: 16, backgroundColor: colors.primaryContainer, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  primaryBtnText: { ...textStyle('bodyMd'), color: colors.onPrimary, fontWeight: '700' },
  detailMeta: { ...textStyle('labelMd'), color: colors.onSurfaceVariant, marginBottom: 12 },
  detailSection: { ...textStyle('bodyMd'), fontWeight: '700', marginBottom: 8 },
  detailLine: { ...textStyle('bodyMd'), color: colors.onSurface, marginBottom: 4 },
  detailHint: { ...textStyle('labelMd'), color: colors.onSurfaceVariant, marginTop: 8, fontStyle: 'italic' },
});
}
