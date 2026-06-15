import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ManagerHeader } from '../components/ManagerHeader';
import { ScreenShell } from '../components/ScreenShell';
import { Card, ProgressBar } from '../components/ui';
import { colors, spacing, textStyle } from '@/designations/academic-manager/theme';

const QUICK_REPORTS = [
  { icon: 'description' as const, label: 'Class Result Summary' },
  { icon: 'trending-up' as const, label: 'Progress Report' },
  { icon: 'groups' as const, label: 'Staff Performance' },
  { icon: 'assessment' as const, label: 'Exam Analysis' },
];

export function ReportsAnalyticsScreen() {
  const navigation = useNavigation();
  const [term, setTerm] = useState('Term II');

  return (
    <ScreenShell
      header={
        <ManagerHeader
          title="Reports & Analytics"
          onBack={() => navigation.goBack()}
          right={
            <View style={styles.headerRight}>
              <MaterialIcons name="download" size={22} color={colors.onSurfaceVariant} />
              <MaterialIcons name="share" size={22} color={colors.onSurfaceVariant} />
            </View>
          }
        />
      }
    >
      <View style={styles.content}>
        <View style={styles.termRow}>
          {['Term I', 'Term II', 'Annual'].map((t) => (
            <TouchableOpacity key={t} style={[styles.termChip, term === t && styles.termActive]} onPress={() => setTerm(t)}>
              <Text style={[styles.termText, term === t && styles.termTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.overviewRow}>
          {[
            { l: 'Pass Rate', v: '87.4%' },
            { l: 'Avg GPA', v: '7.8/10' },
            { l: 'Top Grade', v: 'Grade 5' },
            { l: 'Below Target', v: '4 Classes' },
          ].map((s) => (
            <View key={s.l} style={styles.overviewCard}>
              <Text style={styles.overviewVal}>{s.v}</Text>
              <Text style={styles.overviewLbl}>{s.l}</Text>
            </View>
          ))}
        </View>
        <Card>
          <Text style={styles.chartTitle}>Pass Rate by Grade</Text>
          {[
            { g: 'G12', p: 92 },
            { g: 'G10', p: 88 },
            { g: 'G8', p: 74 },
            { g: 'G5', p: 62 },
          ].map((b) => (
            <View key={b.g} style={styles.barRow}>
              <Text style={styles.barLabel}>{b.g}</Text>
              <ProgressBar percent={b.p} />
              <Text style={styles.barPct}>{b.p}%</Text>
            </View>
          ))}
        </Card>
        <Text style={styles.sectionTitle}>Quick Reports</Text>
        <View style={styles.quickGrid}>
          {QUICK_REPORTS.map((q) => (
            <TouchableOpacity key={q.label} style={styles.quickCard}>
              <MaterialIcons name={q.icon} size={24} color={colors.primary} />
              <Text style={styles.quickLabel}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.builderBtn}><Text style={styles.builderText}>Custom Report Builder</Text></TouchableOpacity>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.gutter, gap: 16 },
  headerRight: { flexDirection: 'row', gap: 12 },
  termRow: { flexDirection: 'row', gap: 8 },
  termChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.outlineVariant },
  termActive: { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer },
  termText: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  termTextActive: { color: colors.onPrimaryContainer },
  overviewRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  overviewCard: { width: '47%', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.outlineVariant, alignItems: 'center' },
  overviewVal: { fontSize: 18, fontWeight: '700', color: colors.primary },
  overviewLbl: { ...textStyle('chip10'), color: colors.onSurfaceVariant, marginTop: 4 },
  chartTitle: { ...textStyle('titleLg'), marginBottom: 12 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  barLabel: { width: 28, ...textStyle('chip10'), fontWeight: '700' },
  barPct: { width: 36, ...textStyle('chip10'), textAlign: 'right' },
  sectionTitle: { ...textStyle('titleLg') },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickCard: { width: '47%', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.outlineVariant, alignItems: 'center', gap: 8 },
  quickLabel: { ...textStyle('chip10'), fontWeight: '600', textAlign: 'center' },
  builderBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  builderText: { ...textStyle('bodyMd'), color: colors.onPrimary, fontWeight: '600' },
});
