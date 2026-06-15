import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AcademicHeader } from '../components/AcademicHeader';
import { ScreenShell } from '../components/ScreenShell';
import { Card, ProgressBar } from '../components/ui';
import { ACADEMIC_MODULES } from '../constants/academicModules';
import {
  academicHealth,
  curriculumSubjects,
  departmentPerformance,
  initialCirculars,
  type PriorityAction,
  type PriorityActionTone,
} from '../data/mockData';
import { getAcademicUnreadCount, useAcademicNotificationsStore } from '../store/notificationsStore';
import { usePriorityActionsStore } from '../store/priorityActionsStore';
import { handleAcademicTabPress } from '../navigation/navigationHelpers';
import type { RootStackParamList } from '../navigation/types';
import type { AcademicColorScheme } from '../theme/colors';
import { SCHOOL_NAME } from '@/constants/school';
import { useAuthStore } from '@/store';
import { formatDashboardDateLine } from '@/utils/datetime';
import { getGreeting } from '@/utils/greeting';
import { spacing, textStyle, useAcademicTheme, useThemedStyles } from '@/designations/academic-director/theme';

function toneColors(colors: AcademicColorScheme, tone: PriorityActionTone) {
  if (tone === 'error') {
    return {
      accent: colors.error,
      iconBg: `${colors.error}18`,
      btnBg: colors.error,
      btnText: colors.onPrimary,
      btnBorder: colors.error,
    };
  }
  if (tone === 'tertiary') {
    return {
      accent: colors.tertiary,
      iconBg: `${colors.tertiary}18`,
      btnBg: colors.surfaceContainerLowest,
      btnText: colors.tertiary,
      btnBorder: colors.tertiary,
    };
  }
  return {
    accent: colors.primary,
    iconBg: `${colors.primaryContainer}18`,
    btnBg: colors.primaryContainer,
    btnText: colors.onPrimary,
    btnBorder: colors.primaryContainer,
  };
}

export function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useAuthStore((s) => s.user);
  const { colors } = useAcademicTheme();
  const styles = useThemedStyles(createStyles);
  const notificationItems = useAcademicNotificationsStore((s) => s.items);
  const priorityItems = usePriorityActionsStore((s) => s.items);
  const completePriority = usePriorityActionsStore((s) => s.complete);
  const queueExamUpload = usePriorityActionsStore((s) => s.queueExamUpload);
  const unreadCount = getAcademicUnreadCount(notificationItems);
  const [dateLine, setDateLine] = useState(() => formatDashboardDateLine());

  const moduleItems = useMemo(() => {
    const hasConflict = priorityItems.some((item) => item.kind === 'timetable-conflict');
    const publishedCirculars = initialCirculars.filter((c) => c.status === 'published').length;
    return ACADEMIC_MODULES.map((item) => {
      if (item.route === 'TimetableOverview') {
        return { ...item, sub: hasConflict ? '1 conflict detected' : 'All schedules clear' };
      }
      if (item.route === 'Circulars') {
        return { ...item, sub: `${publishedCirculars} sent this month` };
      }
      return item;
    });
  }, [priorityItems]);

  const handlePriorityAction = (action: PriorityAction) => {
    switch (action.kind) {
      case 'exam-upload':
        if (action.examId) queueExamUpload(action.examId);
        handleAcademicTabPress(navigation, 'exams');
        break;
      case 'hod-reminder':
        Alert.alert('Send reminders', 'Send monthly report reminder to 3 HODs?', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Send Reminder',
            onPress: () => {
              completePriority(action.id);
              Alert.alert('Reminders sent', 'HODs have been notified to submit their monthly reports.');
            },
          },
        ]);
        break;
      case 'timetable-conflict':
        navigation.navigate('TimetableOverview');
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setDateLine(formatDashboardDateLine()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setDateLine(formatDashboardDateLine());
    }, []),
  );

  const displayName = user?.name?.replace(/^Dr\.\s*/i, '') ?? 'Academic Director';
  const greetingLine = `${getGreeting()}, ${displayName}`;

  return (
    <ScreenShell
      activeTab="home"
      onTabPress={(t) => handleAcademicTabPress(navigation, t)}
      header={
        <AcademicHeader
          title=""
          identity={{
            orgTitle: 'Academic Director',
            orgSubtitle: SCHOOL_NAME,
            notificationCount: unreadCount > 0 ? unreadCount : undefined,
            onNotifications: () => navigation.navigate('Notifications'),
          }}
        />
      }
    >
      <View style={styles.content}>
        <View style={styles.greeting}>
          <Text style={[textStyle('headlineLgMobile'), styles.greetingTitle]}>{greetingLine}</Text>
          <Text style={styles.greetingSub}>{dateLine}</Text>
        </View>

        <Card style={styles.healthCard}>
          <View style={styles.healthTop}>
            <View>
              <Text style={styles.healthLabel}>ACADEMIC HEALTH</Text>
              <View style={styles.healthScoreRow}>
                <Text style={styles.healthScore}>{academicHealth.score}</Text>
                <Text style={styles.healthPts}>pts</Text>
              </View>
              <View style={styles.growthBadge}>
                <MaterialIcons name="trending-up" size={14} color={colors.primary} />
                <Text style={styles.growthText}>{academicHealth.growth}</Text>
              </View>
            </View>
            <View style={styles.healthRing}>
              <MaterialIcons name="school" size={32} color={colors.primary} />
            </View>
          </View>
          <View style={styles.healthGrid}>
            {[
              ['Attendance', academicHealth.attendance],
              ['Exam Pass', academicHealth.examPass],
              ['Syllabus %', academicHealth.syllabus],
              ['Teacher Score', academicHealth.teacherScore],
            ].map(([label, value]) => (
              <View key={label} style={styles.healthMetric}>
                <Text style={styles.metricLabel}>{label}</Text>
                <Text style={styles.metricValue}>{value}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Text style={styles.modulesTitle}>Academic Modules</Text>
        <View style={styles.moduleGrid}>
          {moduleItems.map((module) => (
            <TouchableOpacity
              key={module.label}
              style={styles.moduleCard}
              onPress={() => navigation.navigate(module.route)}
              activeOpacity={0.85}
            >
              <View style={styles.moduleIcon}>
                <MaterialIcons name={module.icon} size={22} color={colors.primaryContainer} />
              </View>
              <Text style={styles.moduleLabel} numberOfLines={2}>
                {module.label}
              </Text>
              <Text style={styles.moduleSub} numberOfLines={2}>
                {module.sub}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHead}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionHeading}>Priority Actions</Text>
            {priorityItems.length > 0 ? (
              <View style={styles.priorityBadge}>
                <Text style={styles.priorityBadgeText}>{priorityItems.length}</Text>
              </View>
            ) : null}
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        {priorityItems.length === 0 ? (
          <View style={styles.priorityEmpty}>
            <MaterialIcons name="task-alt" size={28} color={colors.primaryContainer} />
            <Text style={styles.priorityEmptyTitle}>All caught up</Text>
            <Text style={styles.priorityEmptySub}>No pending actions right now.</Text>
          </View>
        ) : (
          priorityItems.map((action) => {
            const tone = toneColors(colors, action.tone);
            return (
              <View key={action.id} style={[styles.priorityCard, { borderLeftColor: tone.accent }]}>
                <View style={styles.priorityLeft}>
                  <View style={[styles.priorityIconWrap, { backgroundColor: tone.iconBg }]}>
                    <MaterialIcons name={action.icon} size={20} color={tone.accent} />
                  </View>
                  <View style={styles.priorityCopy}>
                    <Text style={styles.priorityTitle} numberOfLines={2}>
                      {action.title}
                    </Text>
                    <Text style={styles.prioritySub} numberOfLines={2}>
                      {action.sub}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.priorityBtn,
                    action.tone === 'error'
                      ? { backgroundColor: tone.btnBg, borderColor: tone.btnBorder }
                      : { backgroundColor: tone.btnBg, borderColor: tone.btnBorder, borderWidth: 1 },
                  ]}
                  onPress={() => handlePriorityAction(action)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.priorityBtnText, { color: tone.btnText }]}>{action.actionLabel}</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}

        <Text style={styles.sectionHeading}>Department Performance</Text>
        {departmentPerformance.map((dept) => (
          <View key={dept.name} style={styles.deptRow}>
            <Text style={styles.deptName}>{dept.name}</Text>
            <ProgressBar percent={dept.percent} />
            <Text style={styles.deptPct}>{dept.percent}%</Text>
          </View>
        ))}

        <Text style={styles.sectionHeading}>Curriculum Snapshot</Text>
        {curriculumSubjects.map((subject) => (
          <Card key={subject.name} style={styles.subjectCard}>
            <View style={styles.subjectHead}>
              <MaterialIcons name={subject.icon as keyof typeof MaterialIcons.glyphMap} size={22} color={colors.primary} />
              <Text style={styles.subjectName}>{subject.name}</Text>
              <Text style={[styles.subjectStatus, subject.tone === 'tertiary' && { color: colors.tertiary }]}>{subject.status}</Text>
            </View>
            <ProgressBar percent={subject.progress} color={subject.tone === 'tertiary' ? colors.tertiary : colors.primaryContainer} />
            <Text style={styles.subjectMeta}>
              Target {subject.target}% · Current {subject.progress}%
            </Text>
          </Card>
        ))}
      </View>
    </ScreenShell>
  );
}

function createStyles(colors: AcademicColorScheme) {
  return StyleSheet.create({
    content: { padding: spacing.gutter, gap: 16 },
    greeting: { gap: 4 },
    greetingTitle: { color: colors.onBackground },
    greetingSub: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant },
    healthCard: { gap: 16 },
    healthTop: { flexDirection: 'row', justifyContent: 'space-between' },
    healthLabel: { ...textStyle('chip10'), color: colors.onSurfaceVariant, letterSpacing: 2 },
    healthScoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
    healthScore: { fontSize: 36, fontWeight: '700', color: colors.primary },
    healthPts: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant },
    growthBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    growthText: { ...textStyle('chip10'), color: colors.primary },
    healthRing: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: `${colors.primaryContainer}1a`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    healthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    healthMetric: { width: '47%', gap: 2 },
    metricLabel: { ...textStyle('chip10'), color: colors.onSurfaceVariant },
    metricValue: { ...textStyle('bodyMd'), fontWeight: '700', color: colors.onSurface },
    modulesTitle: { ...textStyle('titleLg'), color: colors.onSurface },
    moduleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    moduleCard: {
      width: '48%',
      flexGrow: 1,
      minWidth: '46%',
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      padding: 14,
      gap: 8,
    },
    moduleIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: `${colors.primaryContainer}1a`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    moduleLabel: { ...textStyle('bodyMd'), fontWeight: '600', color: colors.onSurface },
    moduleSub: { ...textStyle('chip10'), color: colors.onSurfaceVariant },
    sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sectionHeading: { ...textStyle('titleLg'), color: colors.onSurface, marginTop: 4 },
    priorityBadge: {
      minWidth: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.error,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    priorityBadgeText: { ...textStyle('chip10'), color: colors.onPrimary, fontWeight: '700' },
    viewAll: { ...textStyle('bodyMd'), color: colors.primary, fontWeight: '500' },
    priorityEmpty: {
      alignItems: 'center',
      gap: 6,
      paddingVertical: 24,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      backgroundColor: colors.surfaceContainerLowest,
    },
    priorityEmptyTitle: { ...textStyle('bodyMd'), fontWeight: '700', color: colors.onSurface },
    priorityEmptySub: { ...textStyle('chip10'), color: colors.onSurfaceVariant },
    priorityCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 12,
      paddingLeft: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderLeftWidth: 4,
      backgroundColor: colors.surfaceContainerLowest,
      gap: 10,
    },
    priorityLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
    priorityIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    priorityCopy: { flex: 1, minWidth: 0, gap: 2 },
    priorityTitle: { ...textStyle('bodyMd'), fontWeight: '600', color: colors.onSurface },
    prioritySub: { ...textStyle('chip10'), color: colors.onSurfaceVariant },
    priorityBtn: {
      minWidth: 84,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    priorityBtnText: { ...textStyle('chip10'), fontWeight: '700' },
    deptRow: { gap: 6, marginBottom: 8 },
    deptName: { ...textStyle('bodyMd'), fontWeight: '600', color: colors.onSurface },
    deptPct: { ...textStyle('chip10'), alignSelf: 'flex-end', color: colors.primary },
    subjectCard: { gap: 8 },
    subjectHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    subjectName: { ...textStyle('bodyMd'), fontWeight: '600', flex: 1, color: colors.onSurface },
    subjectStatus: { ...textStyle('chip10'), color: colors.primary, fontWeight: '700' },
    subjectMeta: { ...textStyle('chip10'), color: colors.onSurfaceVariant },
  });
}
