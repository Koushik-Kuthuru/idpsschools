import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Polygon, Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { AcademicHeader } from '../components/AcademicHeader';
import { ScreenShell } from '../components/ScreenShell';
import { Card, ProgressBar } from '../components/ui';
import { atRiskStudents, gradePerformance, studentKpis } from '../data/mockData';
import type { AcademicColorScheme } from '../theme/colors';
import { spacing, textStyle, useAcademicTheme, useThemedStyles } from '@/designations/academic-director/theme';

const PERIODS = ['This Month', 'This Term', 'This Year', 'Custom'];
const RISK_FILTERS = ['All', 'Low Attendance', 'Failing', 'Behavior'];
const CHART_HEIGHTS = [88, 92, 85, 94, 90, 96, 91, 93, 89, 95];

export function StudentAnalyticsScreen() {
  const navigation = useNavigation();
  const { colors } = useAcademicTheme();
  const styles = useThemedStyles(createStyles);
  const [period, setPeriod] = useState('This Month');
  const [riskFilter, setRiskFilter] = useState('All');

  return (
    <ScreenShell
      header={
        <AcademicHeader
          title="Student Analytics"
          onBack={() => navigation.goBack()}
          right={
            <View style={styles.headerRight}>
              <MaterialIcons name="filter-list" size={22} color={colors.onSurface} />
              <MaterialIcons name="file-upload" size={22} color={colors.onSurface} />
            </View>
          }
        />
      }
    >
      <View style={styles.content}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity key={p} style={[styles.periodChip, period === p && styles.periodActive]} onPress={() => setPeriod(p)}>
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kpiRow}>
          {studentKpis.map((kpi) => (
            <View key={kpi.label} style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>{kpi.label}</Text>
              <Text style={styles.kpiValue}>{kpi.value}</Text>
              <Text style={[styles.kpiDelta, kpi.negative && styles.kpiDeltaNeg]}>{kpi.delta}</Text>
            </View>
          ))}
        </ScrollView>

        <Card>
          <View style={styles.chartHead}>
            <Text style={textStyle('titleLg')}>Attendance Trends</Text>
            <Text style={styles.chartSub}>Last 30 Days</Text>
          </View>
          <View style={styles.barChart}>
            {CHART_HEIGHTS.map((h, i) => (
              <View key={i} style={styles.barWrap}>
                <View style={[styles.barBg, { height: '95%' }]}>
                  <View style={[styles.barFill, { height: `${h}%` }]} />
                </View>
              </View>
            ))}
            <View style={styles.targetLine}>
              <Text style={styles.targetLabel}>95% Target</Text>
            </View>
          </View>
          <View style={styles.chartLabels}>
            <Text style={styles.chartLabel}>1 Oct</Text>
            <Text style={styles.chartLabel}>15 Oct</Text>
            <Text style={styles.chartLabel}>30 Oct</Text>
          </View>
        </Card>

        <Card>
          <Text style={[textStyle('titleLg'), { marginBottom: 16 }]}>Performance by Grade</Text>
          {gradePerformance.map((g) => (
            <View key={g.label} style={styles.gradeRow}>
              <View style={styles.gradeHead}>
                <Text style={styles.gradeLabel}>{g.label}</Text>
                <Text style={styles.gradePct}>{g.percent}%</Text>
              </View>
              <ProgressBar percent={g.percent} color={colors.primary} />
            </View>
          ))}
        </Card>

        <Card>
          <Text style={[textStyle('titleLg'), { marginBottom: 16 }]}>Subject-wise Scores</Text>
          <View style={styles.radarWrap}>
            <Svg width="100%" height={200} viewBox="0 0 100 100">
              <Circle cx="50" cy="50" r="45" fill="none" stroke={colors.onSurface} strokeOpacity={0.1} />
              <Circle cx="50" cy="50" r="33" fill="none" stroke={colors.onSurface} strokeOpacity={0.1} />
              <Circle cx="50" cy="50" r="21" fill="none" stroke={colors.onSurface} strokeOpacity={0.1} />
              <Polygon
                points="50,10 85,30 90,70 50,90 10,70 15,30"
                fill={`${colors.primary}33`}
                stroke={colors.primary}
                strokeWidth={1.5}
              />
            </Svg>
          </View>
        </Card>

        <Text style={textStyle('titleLg')}>At-Risk Students</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.riskFilters}>
          {RISK_FILTERS.map((f) => (
            <TouchableOpacity key={f} style={[styles.riskChip, riskFilter === f && styles.riskActive]} onPress={() => setRiskFilter(f)}>
              <Text style={[styles.riskText, riskFilter === f && styles.riskTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {atRiskStudents.map((s) => (
          <View key={s.name} style={styles.studentRow}>
            <Image source={{ uri: s.avatar }} style={styles.studentAvatar} />
            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>{s.name}</Text>
              <Text style={styles.studentClass}>{s.className}</Text>
            </View>
            <Text style={styles.riskBadge}>{s.risk}</Text>
          </View>
        ))}

        <Card>
          <View style={styles.disciplineHead}>
            <View>
              <Text style={textStyle('titleLg')}>Discipline Incidents</Text>
              <Text style={styles.disciplineSub}>By Grade Category</Text>
            </View>
            <View style={styles.disciplineStat}>
              <Text style={textStyle('headlineMd')}>48</Text>
              <Text style={styles.disciplineDelta}>-12% from last term</Text>
            </View>
          </View>
          <View style={styles.disciplineBars}>
            {[
              { label: 'Primary', h: 96 },
              { label: 'Middle', h: 128 },
              { label: 'Senior', h: 64 },
            ].map((b) => (
              <View key={b.label} style={styles.disciplineCol}>
                <View style={[styles.disciplineBar, { height: b.h }, b.label === 'Middle' && { backgroundColor: colors.primary }]} />
                <Text style={styles.disciplineLabel}>{b.label}</Text>
              </View>
            ))}
          </View>
        </Card>

        <View style={styles.skeletonSection}>
          <Text style={textStyle('titleLg')}>Upcoming Reports</Text>
          <Card style={styles.skeletonCard}>
            <View style={styles.skeletonLine} />
            <View style={[styles.skeletonLine, { width: '100%' }]} />
            <View style={[styles.skeletonLine, { width: '50%' }]} />
          </Card>
        </View>
      </View>
    </ScreenShell>
  );
}

function createStyles(colors: AcademicColorScheme) {
  return StyleSheet.create({
  content: { padding: spacing.gutter, gap: 16 },
  headerRight: { flexDirection: 'row', gap: 8 },
  periodRow: { gap: 12 },
  periodChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: colors.surfaceContainerHigh },
  periodActive: { backgroundColor: colors.primaryContainer },
  periodText: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  periodTextActive: { color: colors.onPrimaryContainer },
  kpiRow: { gap: 16 },
  kpiCard: {
    width: 160,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: `${colors.outlineVariant}4d`,
    gap: 8,
  },
  kpiLabel: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  kpiValue: { ...textStyle('headlineMd') },
  kpiDelta: { ...textStyle('chip10'), backgroundColor: `${colors.primaryContainer}33`, color: colors.primary, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  kpiDeltaNeg: { backgroundColor: colors.errorContainer, color: colors.onErrorContainer },
  chartHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  chartSub: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 4, position: 'relative' },
  barWrap: { flex: 1, height: '100%', alignItems: 'center' },
  barBg: { width: 4, backgroundColor: `${colors.primaryContainer}66`, borderTopLeftRadius: 4, borderTopRightRadius: 4, justifyContent: 'flex-end' },
  barFill: { width: '100%', backgroundColor: colors.primary, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  targetLine: { position: 'absolute', top: 0, left: 0, right: 0, borderTopWidth: 1, borderStyle: 'dashed', borderColor: `${colors.onSurfaceVariant}66` },
  targetLabel: { ...textStyle('chip10'), position: 'absolute', right: 0, top: -8, backgroundColor: colors.surfaceContainerLowest, color: colors.onSurfaceVariant },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  chartLabel: { ...textStyle('chip10'), color: colors.onSurfaceVariant },
  gradeRow: { marginBottom: 12, gap: 4 },
  gradeHead: { flexDirection: 'row', justifyContent: 'space-between' },
  gradeLabel: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  gradePct: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  radarWrap: { alignItems: 'center', padding: 16 },
  riskFilters: { gap: 8, marginBottom: 8 },
  riskChip: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.secondaryContainer },
  riskActive: { backgroundColor: colors.onSecondaryFixed },
  riskText: { ...textStyle('labelMd'), color: colors.onSecondaryContainer },
  riskTextActive: { color: colors.onPrimary },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: `${colors.outlineVariant}4d`,
    marginBottom: 8,
  },
  studentAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.secondaryContainer },
  studentInfo: { flex: 1 },
  studentName: { ...textStyle('bodyLg'), fontWeight: '600' },
  studentClass: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  riskBadge: { ...textStyle('chip10'), backgroundColor: colors.errorContainer, color: colors.onErrorContainer, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  disciplineHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  disciplineSub: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  disciplineStat: { alignItems: 'flex-end' },
  disciplineDelta: { ...textStyle('chip10'), color: colors.primary, fontWeight: '700' },
  disciplineBars: { flexDirection: 'row', alignItems: 'flex-end', height: 128, gap: 24, paddingHorizontal: 16 },
  disciplineCol: { flex: 1, alignItems: 'center', gap: 8 },
  disciplineBar: { width: '100%', backgroundColor: colors.secondaryContainer, borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  disciplineLabel: { ...textStyle('chip10'), color: colors.onSurfaceVariant },
  skeletonSection: { opacity: 0.4, gap: 16 },
  skeletonCard: { gap: 12 },
  skeletonLine: { height: 16, width: '75%', backgroundColor: colors.surfaceContainer, borderRadius: 4 },
  });
}
