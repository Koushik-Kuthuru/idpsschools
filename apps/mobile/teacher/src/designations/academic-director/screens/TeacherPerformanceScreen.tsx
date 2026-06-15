import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AcademicHeader } from '../components/AcademicHeader';
import { ScreenShell } from '../components/ScreenShell';
import { Card, ProgressBar } from '../components/ui';
import { departmentTeacherLabels, teachers, type TeacherPerformanceItem } from '../data/mockData';
import type { RootStackParamList } from '../navigation/types';
import type { AcademicColorScheme } from '../theme/colors';
import { spacing, textStyle, useAcademicTheme, useThemedStyles } from '@/designations/academic-director/theme';

const PERIODS = ['Week', 'Month', 'Quarter', 'Year'];
const DEPT_FILTERS = ['All', ...Object.values(departmentTeacherLabels)];
const MESSAGE_SHEET_MAX = Dimensions.get('window').height * 0.55;

type TeacherItem = TeacherPerformanceItem;

export function TeacherPerformanceScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'TeacherPerformance'>>();
  const { colors } = useAcademicTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const sheetBottomPad = Math.max(insets.bottom, 20);

  const routeDeptId = route.params?.departmentId;
  const routeDeptLabel = routeDeptId ? departmentTeacherLabels[routeDeptId] : undefined;

  const [period, setPeriod] = useState('Week');
  const [dept, setDept] = useState(routeDeptLabel ?? 'All');
  const [profileTeacher, setProfileTeacher] = useState<TeacherItem | null>(null);
  const [messageTeacher, setMessageTeacher] = useState<TeacherItem | null>(null);
  const [messageDraft, setMessageDraft] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (routeDeptLabel) setDept(routeDeptLabel);
    }, [routeDeptLabel]),
  );

  const visibleTeachers = useMemo(() => {
    if (routeDeptId) return teachers.filter((t) => t.departmentId === routeDeptId);
    if (dept === 'All') return teachers;
    const deptId = Object.entries(departmentTeacherLabels).find(([, label]) => label === dept)?.[0];
    return deptId ? teachers.filter((t) => t.departmentId === deptId) : teachers;
  }, [dept, routeDeptId]);

  const screenTitle = routeDeptLabel ? `${routeDeptLabel} Teachers` : 'Teacher Performance';
  const lockedDepartment = !!routeDeptId;

  const sendMessage = () => {
    const body = messageDraft.trim();
    if (!body) {
      Alert.alert('Message required', 'Please type a message before sending.');
      return;
    }
    if (!messageTeacher) return;
    const name = messageTeacher.name;
    setMessageTeacher(null);
    setMessageDraft('');
    Alert.alert('Message sent', `Your message was delivered to ${name}.`);
  };

  const renderActions = (teacher: TeacherItem) => (
    <View style={styles.actionRow}>
      <TouchableOpacity style={styles.outlineBtn} onPress={() => setProfileTeacher(teacher)}>
        <Text style={styles.outlineBtnText}>View Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.filledBtn}
        onPress={() => {
          setMessageTeacher(teacher);
          setMessageDraft('');
        }}
      >
        <Text style={styles.filledBtnText}>Message</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.flagBtn, teacher.atRisk && styles.flagBtnDanger]}
        onPress={() => Alert.alert('Flagged', `${teacher.name} has been flagged for academic review.`)}
      >
        <MaterialIcons name="flag" size={16} color={teacher.atRisk ? colors.onError : colors.onSurfaceVariant} />
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenShell
      header={
        <AcademicHeader
          title={screenTitle}
          subtitle={routeDeptLabel ? `${visibleTeachers.length} teachers in department` : undefined}
          onBack={() => navigation.goBack()}
        />
      }
    >
      <View style={styles.content}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity key={p} style={[styles.periodChip, period === p && styles.periodActive]} onPress={() => setPeriod(p)}>
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.summaryBanner}>
          <View style={styles.summaryGrid}>
            <View>
              <Text style={styles.summaryLabel}>Total Teachers</Text>
              <Text style={styles.summaryValue}>148</Text>
            </View>
            <View>
              <Text style={styles.summaryLabel}>Present Today</Text>
              <Text style={[styles.summaryValue, { color: colors.primaryFixed }]}>136</Text>
            </View>
            <View>
              <Text style={styles.summaryLabel}>Avg Score</Text>
              <View style={styles.trendRow}>
                <Text style={styles.summaryValue}>82.4%</Text>
                <MaterialIcons name="trending-up" size={14} color={colors.onPrimaryContainer} />
              </View>
            </View>
            <View>
              <Text style={styles.summaryLabel}>Reviews Due</Text>
              <Text style={[styles.summaryValue, { color: colors.tertiaryContainer }]}>12</Text>
            </View>
          </View>
        </View>

        <View style={styles.alertBanner}>
          <MaterialIcons name="report" size={22} color={colors.error} />
          <View style={styles.alertBody}>
            <Text style={styles.alertTitle}>Critical Attention</Text>
            <Text style={styles.alertSub}>6 teachers below performance threshold</Text>
          </View>
          <TouchableOpacity
            style={styles.alertBtn}
            onPress={() => setDept('Social Studies')}
          >
            <Text style={styles.alertBtnText}>Review All</Text>
          </TouchableOpacity>
        </View>

        {lockedDepartment ? (
          <View style={styles.deptBanner}>
            <MaterialIcons name="groups" size={18} color={colors.primaryContainer} />
            <Text style={styles.deptBannerText}>
              Showing {visibleTeachers.length} teacher{visibleTeachers.length === 1 ? '' : 's'} in {routeDeptLabel}
            </Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {DEPT_FILTERS.map((d) => (
              <TouchableOpacity key={d} style={[styles.deptChip, dept === d && styles.deptActive]} onPress={() => setDept(d)}>
                <Text style={[styles.deptText, dept === d && styles.deptTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={styles.sortBar}>
          <Text style={styles.sortLabel}>
            Sorted by: <Text style={styles.sortValue}>Performance Score</Text>
          </Text>
          <Text style={styles.countLabel}>{visibleTeachers.length} shown</Text>
        </View>

        {visibleTeachers.length === 0 ? (
          <Text style={styles.empty}>No teachers found for this department.</Text>
        ) : null}

        {visibleTeachers.map((t) => (
          <Card
            key={t.id}
            style={{
              ...styles.teacherCard,
              ...(t.atRisk ? styles.teacherCardRisk : {}),
            }}
          >
            <View style={styles.teacherHead}>
              <View style={styles.teacherLeft}>
                <View>
                  <Image source={{ uri: t.avatar }} style={[styles.avatar, t.atRisk && styles.avatarRisk]} />
                  {t.online ? <View style={[styles.onlineDot, t.atRisk && styles.onlineDotError]} /> : null}
                </View>
                <View style={styles.teacherCopy}>
                  <Text style={styles.teacherName}>{t.name}</Text>
                  <Text style={styles.teacherRole}>{t.role}</Text>
                </View>
              </View>
              <View
                style={[
                  styles.scoreBadge,
                  t.atRisk && styles.scoreBadgeRisk,
                  t.scoreTone === 'secondary' && styles.scoreBadgeSecondary,
                ]}
              >
                <Text style={[styles.scoreText, t.atRisk && styles.scoreTextRisk]}>{t.score}%</Text>
              </View>
            </View>

            {t.compact ? (
              <>
                <View style={styles.compactMetrics}>
                  <View style={styles.compactItem}>
                    <MaterialIcons name="event-available" size={14} color={colors.primary} />
                    <Text style={styles.compactText}>{t.attendance}% Attend.</Text>
                  </View>
                  <View style={styles.compactItem}>
                    <MaterialIcons name="menu-book" size={14} color={colors.primary} />
                    <Text style={styles.compactText}>{t.syllabus}% Syllabus</Text>
                  </View>
                  <View style={styles.compactItem}>
                    <MaterialIcons name="grade" size={14} color={colors.primary} />
                    <Text style={styles.compactText}>{t.studentAvg} Avg</Text>
                  </View>
                </View>
                {renderActions(t)}
              </>
            ) : (
              <>
                <View style={styles.metricsGrid}>
                  <View style={styles.metricCell}>
                    <Text style={styles.metricLabel}>Attendance</Text>
                    <Text style={[styles.metricValue, t.atRisk && t.attendance! < 80 && styles.metricDanger]}>{t.attendance}%</Text>
                  </View>
                  <View style={[styles.metricCell, styles.metricBorder]}>
                    <Text style={styles.metricLabel}>Syllabus</Text>
                    <Text style={[styles.metricValue, t.atRisk && t.syllabus! < 60 && styles.metricDanger]}>{t.syllabus}%</Text>
                  </View>
                  <View style={styles.metricCell}>
                    <Text style={styles.metricLabel}>Stud. Avg</Text>
                    <Text style={styles.metricValue}>{t.studentAvg}</Text>
                  </View>
                </View>
                <View style={styles.progressHead}>
                  <Text style={styles.progressLabel}>Syllabus Progress</Text>
                  <Text style={[styles.progressStatus, t.atRisk && styles.progressDelayed]}>{t.atRisk ? 'Delayed' : 'On Track'}</Text>
                </View>
                <ProgressBar percent={t.syllabus ?? 0} color={t.atRisk ? colors.error : colors.primary} height={6} />
                {renderActions(t)}
              </>
            )}
          </Card>
        ))}
      </View>

      {/* Teacher profile */}
      <Modal visible={!!profileTeacher} transparent animationType="slide" onRequestClose={() => setProfileTeacher(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.profileSheet, { paddingBottom: sheetBottomPad }]}>
            {profileTeacher ? (
              <>
                <View style={styles.sheetHead}>
                  <Text style={styles.sheetTitle}>Teacher Profile</Text>
                  <TouchableOpacity onPress={() => setProfileTeacher(null)}>
                    <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
                  </TouchableOpacity>
                </View>
                <View style={styles.profileTop}>
                  <Image source={{ uri: profileTeacher.avatar }} style={styles.profileAvatar} />
                  <View style={styles.profileMeta}>
                    <Text style={styles.profileName}>{profileTeacher.name}</Text>
                    <Text style={styles.profileRole}>{profileTeacher.role}</Text>
                    <Text style={[styles.profileScore, profileTeacher.atRisk && { color: colors.error }]}>
                      Performance: {profileTeacher.score}%
                    </Text>
                  </View>
                </View>
                <Text style={styles.profileLine}>Attendance: {profileTeacher.attendance}%</Text>
                <Text style={styles.profileLine}>Syllabus completion: {profileTeacher.syllabus}%</Text>
                <Text style={styles.profileLine}>Student average: {profileTeacher.studentAvg}</Text>
                <Text style={styles.profileLine}>Status: {profileTeacher.atRisk ? 'Needs review' : 'On track'}</Text>
                <TouchableOpacity
                  style={styles.sheetPrimaryBtn}
                  onPress={() => {
                    setProfileTeacher(null);
                    setMessageTeacher(profileTeacher);
                    setMessageDraft('');
                  }}
                >
                  <Text style={styles.sheetPrimaryBtnText}>Send Message</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Message teacher */}
      <Modal visible={!!messageTeacher} transparent animationType="slide" onRequestClose={() => setMessageTeacher(null)}>
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.modalDismiss} onPress={() => setMessageTeacher(null)} />
          <View style={[styles.messageSheet, { paddingBottom: sheetBottomPad, maxHeight: MESSAGE_SHEET_MAX }]}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>Message Teacher</Text>
              <TouchableOpacity onPress={() => setMessageTeacher(null)}>
                <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            {messageTeacher ? (
              <Text style={styles.messageSub}>To: {messageTeacher.name} · {messageTeacher.role}</Text>
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
            <TouchableOpacity style={styles.sheetPrimaryBtn} onPress={sendMessage}>
              <Text style={styles.sheetPrimaryBtnText}>Send Message</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenShell>
  );
}

function createStyles(colors: AcademicColorScheme) {
  return StyleSheet.create({
    content: { padding: spacing.gutter, gap: 16 },
    chipRow: { gap: 8 },
    periodChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: colors.surfaceContainer,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
    periodActive: { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer },
    periodText: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
    periodTextActive: { color: colors.onPrimaryContainer },
    summaryBanner: { backgroundColor: colors.primaryContainer, borderRadius: 12, padding: 20 },
    summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    summaryLabel: { ...textStyle('chip10'), color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 1 },
    summaryValue: { fontSize: 24, fontWeight: '700', color: colors.onPrimaryContainer },
    trendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    alertBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.errorContainer,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: `${colors.error}33`,
    },
    alertBody: { flex: 1 },
    alertTitle: { ...textStyle('bodyMd'), fontWeight: '700', color: colors.onErrorContainer },
    alertSub: { ...textStyle('chip10'), color: colors.onErrorContainer, opacity: 0.9 },
    alertBtn: { backgroundColor: colors.error, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    alertBtnText: { ...textStyle('chip10'), color: colors.onError, fontWeight: '700' },
    deptChip: {
      paddingHorizontal: 20,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: colors.secondaryFixed,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
    deptActive: { backgroundColor: colors.secondary, borderColor: colors.secondary },
    deptText: { ...textStyle('labelMd'), color: colors.onSecondaryFixed },
    deptTextActive: { color: colors.onSecondary },
    deptBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: `${colors.primaryContainer}18`,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: `${colors.primaryContainer}33`,
    },
    deptBannerText: { ...textStyle('bodyMd'), color: colors.primaryContainer, fontWeight: '600', flex: 1 },
    sortBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sortLabel: { ...textStyle('chip10'), color: colors.onSurfaceVariant, textTransform: 'uppercase' },
    sortValue: { color: colors.primary },
    countLabel: { ...textStyle('chip10'), color: colors.onSurfaceVariant },
    empty: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant, textAlign: 'center', paddingVertical: 16 },
    teacherCard: { gap: 12 },
    teacherCardRisk: { borderColor: `${colors.error}4d` },
    teacherHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
    },
    teacherLeft: { flexDirection: 'row', gap: 12, flex: 1, minWidth: 0 },
    teacherCopy: { flex: 1, minWidth: 0, gap: 2 },
    avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: colors.primaryContainer },
    avatarRisk: { borderColor: colors.errorContainer },
    onlineDot: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.primary,
      borderWidth: 2,
      borderColor: colors.onPrimary,
    },
    onlineDotError: { backgroundColor: colors.error },
    teacherName: { ...textStyle('bodyMd'), fontWeight: '700', color: colors.onSurface },
    teacherRole: { ...textStyle('chip10'), color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1 },
    scoreBadge: {
      backgroundColor: colors.primaryContainer,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      minWidth: 56,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    scoreBadgeRisk: { backgroundColor: colors.errorContainer },
    scoreBadgeSecondary: { backgroundColor: colors.secondaryContainer },
    scoreText: { ...textStyle('bodyMd'), fontWeight: '700', color: colors.onPrimaryContainer, lineHeight: 20 },
    scoreTextRisk: { color: colors.error },
    metricsGrid: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.outlineVariant,
      paddingVertical: 12,
    },
    metricCell: { flex: 1, alignItems: 'center' },
    metricBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.outlineVariant },
    metricLabel: { ...textStyle('chip10'), color: colors.onSurfaceVariant, textTransform: 'uppercase' },
    metricValue: { ...textStyle('bodyMd'), fontWeight: '700', color: colors.onSurface },
    metricDanger: { color: colors.error },
    progressHead: { flexDirection: 'row', justifyContent: 'space-between' },
    progressLabel: { ...textStyle('chip10'), color: colors.onSurfaceVariant, textTransform: 'uppercase' },
    progressStatus: { ...textStyle('chip10'), color: colors.primary },
    progressDelayed: { color: colors.error },
    actionRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    outlineBtn: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: 'center',
    },
    outlineBtnText: { ...textStyle('labelMd'), color: colors.primary, fontWeight: '700' },
    filledBtn: {
      flex: 1,
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: 'center',
    },
    filledBtnText: { ...textStyle('labelMd'), color: colors.onPrimary, fontWeight: '700' },
    flagBtn: {
      width: 44,
      height: 44,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    flagBtnDanger: { backgroundColor: colors.error, borderColor: colors.error },
    compactMetrics: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
    compactItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    compactText: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    modalDismiss: { ...StyleSheet.absoluteFillObject },
    profileSheet: {
      backgroundColor: colors.surfaceContainerLowest,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      gap: 8,
    },
    messageSheet: {
      width: '100%',
      backgroundColor: colors.surfaceContainerLowest,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 20,
      paddingTop: 20,
      zIndex: 1,
    },
    sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    sheetTitle: { ...textStyle('titleLg'), fontWeight: '700', color: colors.onSurface },
    profileTop: { flexDirection: 'row', gap: 14, alignItems: 'center', marginBottom: 8 },
    profileAvatar: { width: 64, height: 64, borderRadius: 32 },
    profileMeta: { flex: 1, gap: 2 },
    profileName: { ...textStyle('headlineMd'), color: colors.onSurface },
    profileRole: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant },
    profileScore: { ...textStyle('bodyMd'), fontWeight: '700', color: colors.primaryContainer, marginTop: 4 },
    profileLine: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant },
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
    sheetPrimaryBtn: {
      backgroundColor: colors.primaryContainer,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 4,
    },
    sheetPrimaryBtnText: { ...textStyle('bodyMd'), color: colors.onPrimary, fontWeight: '700' },
  });
}
