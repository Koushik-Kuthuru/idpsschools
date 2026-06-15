import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AcademicHeader } from '../components/AcademicHeader';
import { ScreenShell } from '../components/ScreenShell';
import { Card } from '../components/ui';
import { reportCategories, recentReports, quickExports } from '../data/mockData';
import type { RootStackParamList } from '../navigation/types';
import type { AcademicColorScheme } from '../theme/colors';
import { spacing, textStyle, useAcademicTheme, useThemedStyles } from '@/designations/academic-director/theme';

export function ReportsAnalyticsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useAcademicTheme();
  const styles = useThemedStyles(createStyles);
  const [format, setFormat] = useState<'PDF' | 'Excel'>('PDF');

  return (
    <ScreenShell
      header={
        <AcademicHeader
          title="Reports & Analytics"
          onBack={() => navigation.goBack()}
          right={
            <View style={styles.headerRight}>
              <MaterialIcons name="filter-list" size={22} color={colors.onSurfaceVariant} />
              <MaterialIcons name="download" size={22} color={colors.onSurfaceVariant} />
            </View>
          }
        />
      }
    >
      <View style={styles.grid}>
        {reportCategories.map((cat) => (
          <TouchableOpacity
            key={cat.title}
            style={styles.categoryCard}
            onPress={() => cat.route && navigation.navigate(cat.route)}
          >
            <View style={styles.categoryIcon}>
              <MaterialIcons name={cat.icon} size={22} color={colors.primaryContainer} />
            </View>
            <Text style={styles.categoryTitle}>{cat.title}</Text>
            <Text style={styles.categoryCount}>{cat.count} reports</Text>
            <MaterialIcons name="chevron-right" size={20} color={colors.outline} style={styles.categoryChevron} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Recently Generated</Text>
          <Text style={styles.viewAll}>View All</Text>
        </View>
        {recentReports.map((r) => (
          <Card key={r.title} style={styles.reportRow}>
            <View style={[styles.reportIcon, r.type === 'pdf' ? styles.pdfIcon : styles.excelIcon]}>
              <MaterialIcons name={r.type === 'pdf' ? 'description' : 'table-chart'} size={22} color={r.type === 'pdf' ? colors.error : colors.primary} />
            </View>
            <View style={styles.reportInfo}>
              <Text style={styles.reportTitle} numberOfLines={1}>{r.title}</Text>
              <Text style={styles.reportMeta}>Generated: {r.generated}</Text>
              <Text style={styles.reportPeriod}>{r.period}</Text>
            </View>
            <View style={styles.reportActions}>
              <MaterialIcons name="download" size={20} color={colors.outline} />
              <MaterialIcons name="share" size={20} color={colors.outline} />
            </View>
          </Card>
        ))}
      </View>

      <View style={styles.customCard}>
        <Text style={styles.customTitle}>Generate Custom Report</Text>
        <Text style={styles.customSub}>Choose parameters and export in PDF or Excel.</Text>
        <Text style={styles.fieldLabel}>Report Type</Text>
        <TouchableOpacity style={styles.select}>
          <Text style={styles.selectText}>Academic Performance</Text>
          <MaterialIcons name="arrow-drop-down" size={22} color={colors.outline} />
        </TouchableOpacity>
        <View style={styles.fieldRow}>
          <View style={styles.fieldHalf}>
            <Text style={styles.fieldLabel}>Period</Text>
            <TouchableOpacity style={styles.select}>
              <Text style={styles.selectText}>Jun 2025</Text>
              <MaterialIcons name="calendar-month" size={18} color={colors.outline} />
            </TouchableOpacity>
          </View>
          <View style={styles.fieldHalf}>
            <Text style={styles.fieldLabel}>Scope</Text>
            <TouchableOpacity style={styles.select}>
              <Text style={styles.selectText}>All Classes</Text>
              <MaterialIcons name="filter-alt" size={18} color={colors.outline} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.fieldLabel}>Format</Text>
        <View style={styles.formatRow}>
          {(['PDF', 'Excel'] as const).map((f) => (
            <TouchableOpacity key={f} style={[styles.formatBtn, format === f && styles.formatActive]} onPress={() => setFormat(f)}>
              <Text style={[styles.formatText, format === f && styles.formatTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.generateBtn}><Text style={styles.generateText}>Generate & Download</Text></TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Export</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow}>
          {quickExports.map((q) => (
            <TouchableOpacity key={q.label} style={styles.quickCard}>
              <MaterialIcons name={q.icon} size={24} color={colors.primary} />
              <Text style={styles.quickLabel}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </ScreenShell>
  );
}

function createStyles(colors: AcademicColorScheme) {
  return StyleSheet.create({
  headerRight: { flexDirection: 'row', gap: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: spacing.gutter, gap: 12 },
  categoryCard: {
    width: '47%',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.slate100,
    padding: 16,
    position: 'relative',
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.primaryContainer}1a`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryTitle: { ...textStyle('bodyMd'), fontWeight: '600' },
  categoryCount: { fontSize: 12, color: colors.onSurfaceVariant, marginTop: 2 },
  categoryChevron: { position: 'absolute', bottom: 12, right: 12 },
  section: { paddingHorizontal: spacing.gutter, marginTop: 16 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { ...textStyle('bodyLg'), fontWeight: '600' },
  viewAll: { ...textStyle('bodyMd'), color: colors.primary },
  reportRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  reportIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  pdfIcon: { backgroundColor: `${colors.errorContainer}33` },
  excelIcon: { backgroundColor: `${colors.primaryContainer}33` },
  reportInfo: { flex: 1 },
  reportTitle: { ...textStyle('bodyMd'), fontWeight: '600' },
  reportMeta: { ...textStyle('chip10'), color: colors.onSurfaceVariant, marginTop: 2 },
  reportPeriod: {
    ...textStyle('chip10'),
    backgroundColor: colors.surfaceContainerHigh,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginTop: 4,
    color: colors.onSurfaceVariant,
  },
  reportActions: { flexDirection: 'row', gap: 4 },
  customCard: {
    margin: spacing.gutter,
    marginTop: 8,
    backgroundColor: `${colors.primaryContainer}1a`,
    borderWidth: 1,
    borderColor: `${colors.primaryContainer}4d`,
    borderRadius: 12,
    padding: 16,
  },
  customTitle: { ...textStyle('bodyLg'), fontWeight: '600', color: colors.primary },
  customSub: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant, marginBottom: 16 },
  fieldLabel: { ...textStyle('chip10'), color: colors.outline, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  select: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  selectText: { ...textStyle('bodyMd'), fontWeight: '500' },
  fieldRow: { flexDirection: 'row', gap: 12 },
  fieldHalf: { flex: 1 },
  formatRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  formatBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.outlineVariant, alignItems: 'center' },
  formatActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  formatText: { ...textStyle('bodyMd'), color: colors.outline, fontWeight: '600' },
  formatTextActive: { color: colors.onPrimary },
  generateBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  generateText: { ...textStyle('bodyLg'), color: colors.onPrimary, fontWeight: '600' },
  quickRow: { gap: 12, paddingVertical: 8 },
  quickCard: {
    width: 112,
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    padding: 12,
  },
  quickLabel: { ...textStyle('chip10'), fontWeight: '600', textAlign: 'center', marginTop: 8 },
  });
}
