import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ManagerHeader } from '../components/ManagerHeader';
import { ScreenShell } from '../components/ScreenShell';
import { Card, ProgressBar } from '../components/ui';
import { curriculumSubjects } from '../data/mockData';
import { colors, spacing, textStyle } from '@/designations/academic-manager/theme';

export function CurriculumTrackerScreen() {
  const navigation = useNavigation();
  const [grade, setGrade] = useState('Grade 10');

  return (
    <ScreenShell
      header={
        <ManagerHeader
          title="Curriculum Tracker"
          onBack={() => navigation.goBack()}
          right={
            <View style={styles.headerRight}>
              <MaterialIcons name="download" size={22} color={colors.onSurfaceVariant} />
              <MaterialIcons name="filter-list" size={22} color={colors.onSurfaceVariant} />
            </View>
          }
        />
      }
    >
      <View style={styles.content}>
        <Text style={styles.termBadge}>Academic Year 2024–25 · Term II</Text>
        <Card style={styles.overallCard}>
          <Text style={styles.overallLabel}>Overall Progress</Text>
          <Text style={styles.overallValue}>72%</Text>
          <Text style={styles.overallMeta}>14 subjects · 8/12 grades on track · 4 gaps</Text>
          <ProgressBar percent={72} />
        </Card>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gradeRow}>
          {['Grade 10', 'Grade 9', 'Grade 8', 'Grade 7'].map((g) => (
            <TouchableOpacity key={g} style={[styles.gradeChip, grade === g && styles.gradeActive]} onPress={() => setGrade(g)}>
              <Text style={[styles.gradeText, grade === g && styles.gradeTextActive]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text style={styles.sectionTitle}>{grade} — Subject Coverage</Text>
        {curriculumSubjects.map((s) => (
          <Card key={s.name} style={styles.subjectCard}>
            <View style={styles.subjectHead}>
              <Text style={styles.subjectName}>{s.name}</Text>
              <Text style={[styles.status, s.tone === 'error' && { color: colors.error }, s.tone === 'tertiary' && { color: colors.tertiary }, s.tone === 'primary' && { color: colors.primary }]}>{s.status}</Text>
            </View>
            <Text style={styles.chapter}>{s.chapter}</Text>
            <ProgressBar percent={s.progress} color={s.tone === 'error' ? colors.error : colors.primaryContainer} />
            <Text style={styles.progressPct}>{s.progress}%</Text>
          </Card>
        ))}
        <TouchableOpacity style={styles.cta}><Text style={styles.ctaText}>Generate Curriculum Report</Text></TouchableOpacity>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.gutter, gap: 16 },
  headerRight: { flexDirection: 'row', gap: 12 },
  termBadge: { ...textStyle('chip10'), backgroundColor: colors.surfaceContainerHigh, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  overallCard: { alignItems: 'center', gap: 8 },
  overallLabel: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  overallValue: { fontSize: 32, fontWeight: '700', color: colors.primary },
  overallMeta: { ...textStyle('chip10'), color: colors.onSurfaceVariant, textAlign: 'center' },
  gradeRow: { gap: 8 },
  gradeChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.outlineVariant },
  gradeActive: { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer },
  gradeText: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  gradeTextActive: { color: colors.onPrimaryContainer },
  sectionTitle: { ...textStyle('titleLg') },
  subjectCard: { gap: 8 },
  subjectHead: { flexDirection: 'row', justifyContent: 'space-between' },
  subjectName: { ...textStyle('bodyMd'), fontWeight: '700' },
  status: { ...textStyle('chip10'), fontWeight: '700' },
  chapter: { ...textStyle('chip10'), color: colors.onSurfaceVariant },
  progressPct: { ...textStyle('chip10'), alignSelf: 'flex-end', fontWeight: '700' },
  cta: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  ctaText: { ...textStyle('bodyMd'), color: colors.onPrimary, fontWeight: '600' },
});
