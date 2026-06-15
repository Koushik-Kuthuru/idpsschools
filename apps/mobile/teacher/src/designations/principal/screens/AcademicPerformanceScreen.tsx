import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PrincipalHeader } from '../components/PrincipalHeader';
import { ScreenShell } from '../components/ScreenShell';
import { Card } from '../components/ui';
import { academicTerms, gradePerformance, schoolToppers, subjectPerformance } from '../data/mockData';
import { handlePrincipalTabPress } from '../navigation/navigationHelpers';
import type { PrincipalColorScheme } from '@/designations/principal/theme/colors';
import type { PrincipalStackParamList } from '../navigation/types';
import { spacing, textStyle, usePrincipalTheme, useThemedStyles } from '@/designations/principal/theme';

export function AcademicPerformanceScreen() {
  const { colors } = usePrincipalTheme();
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<NativeStackNavigationProp<PrincipalStackParamList>>();
  const [term, setTerm] = useState<(typeof academicTerms)[number]>('Term 2');

  return (
    <ScreenShell
      activeTab="academics"
      onTabPress={(t) => handlePrincipalTabPress(navigation, t)}
      header={
        <PrincipalHeader
          title="Academic Performance"
          right={
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <MaterialIcons name="filter-list" size={22} color={colors.onSurfaceVariant} />
              <MaterialIcons name="share" size={22} color={colors.onSurfaceVariant} />
            </View>
          }
        />
      }
    >
      <View style={[styles.content, { backgroundColor: colors.canvas }]}>
        <View style={styles.termRow}>
          {academicTerms.map((t) => (
            <TouchableOpacity key={t} style={[styles.termChip, term === t && styles.termActive]} onPress={() => setTerm(t)}>
              <Text style={[styles.termText, term === t && styles.termTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Card style={styles.passCard}>
          <Text style={styles.passLabel}>Overall Pass Rate</Text>
          <Text style={styles.passValue}>88.4%</Text>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownItem}>Distinction <Text style={styles.bold}>42</Text></Text>
            <Text style={[styles.breakdownItem, { color: colors.blue500 }]}>First Class <Text style={styles.bold}>318</Text></Text>
            <Text style={styles.breakdownItem}>Pass <Text style={styles.bold}>742</Text></Text>
            <Text style={[styles.breakdownItem, { color: colors.error }]}>Fail <Text style={styles.bold}>58</Text></Text>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Subject-wise Performance</Text>
        {subjectPerformance.map((s) => (
          <View key={s.subject} style={styles.subjectRow}>
            <Text style={styles.subjectName}>{s.subject}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${s.percent}%`, backgroundColor: s.color }]} />
            </View>
            <Text style={styles.subjectPct}>{s.percent}%</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Grade-wise Summary</Text>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <View style={styles.tableHead}>
            <Text style={[styles.th, { flex: 1 }]}>Grade</Text>
            <Text style={styles.th}>Avg</Text>
            <Text style={styles.th}>Pass</Text>
            <Text style={styles.th}>Trend</Text>
          </View>
          {gradePerformance.map((g) => (
            <View key={g.grade} style={styles.tableRow}>
              <Text style={[styles.td, { flex: 1, fontWeight: '700' }]}>{g.grade}</Text>
              <Text style={styles.td}>{g.avg}</Text>
              <Text style={styles.td}>{g.pass}</Text>
              <MaterialIcons
                name={g.trend === 'up' ? 'trending-up' : g.trend === 'down' ? 'trending-down' : 'trending-flat'}
                size={18}
                color={g.trend === 'up' ? colors.primary : g.trend === 'down' ? colors.error : colors.onSurfaceVariant}
              />
            </View>
          ))}
        </Card>

        <Text style={styles.sectionTitle}>School Toppers</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>
          {schoolToppers.map((t) => (
            <Card key={t.name} style={styles.topperCard}>
              <View style={[styles.medal, t.medal === 'gold' && { backgroundColor: colors.yellow400 }, t.medal === 'silver' && { backgroundColor: colors.slate300 }, t.medal === 'bronze' && { backgroundColor: colors.amber600 }]}>
                <MaterialIcons name="emoji-events" size={20} color={colors.onPrimary} />
              </View>
              <Text style={styles.topperName}>{t.name}</Text>
              <Text style={styles.topperGrade}>{t.grade}</Text>
              <Text style={styles.topperScore}>{t.score}</Text>
            </Card>
          ))}
        </ScrollView>
      </View>
    </ScreenShell>
  );
}

function createStyles(colors: PrincipalColorScheme) {
  return StyleSheet.create({
  content: { padding: spacing.gutter, gap: spacing.md, paddingBottom: 32 },
  termRow: { flexDirection: 'row', backgroundColor: colors.surfaceContainerLow, borderRadius: 12, padding: 4 },
  termChip: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  termActive: { backgroundColor: colors.surfaceContainerLowest },
  termText: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  termTextActive: { color: colors.primary, fontWeight: '700' },
  passCard: { alignItems: 'center', gap: 8 },
  passLabel: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  passValue: { fontSize: 36, fontWeight: '700', color: colors.primary },
  breakdownRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  breakdownItem: { ...textStyle('chip10'), color: colors.onSurfaceVariant },
  bold: { fontWeight: '700', color: colors.onSurface },
  sectionTitle: { ...textStyle('titleLg'), fontWeight: '600' },
  subjectRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subjectName: { width: 72, ...textStyle('labelMd') },
  barTrack: { flex: 1, height: 8, backgroundColor: colors.surfaceVariant, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  subjectPct: { width: 36, ...textStyle('chip10'), fontWeight: '700', textAlign: 'right' },
  tableHead: { flexDirection: 'row', padding: 12, backgroundColor: colors.green50 },
  th: { ...textStyle('chip10'), fontWeight: '700', width: 48, textAlign: 'center' },
  tableRow: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: colors.outlineVariant, alignItems: 'center' },
  td: { ...textStyle('labelMd'), width: 48, textAlign: 'center' },
  topperCard: { minWidth: 140, alignItems: 'center', gap: 4 },
  medal: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  topperName: { ...textStyle('bodyMd'), fontWeight: '700' },
  topperGrade: { ...textStyle('chip10'), color: colors.onSurfaceVariant },
  topperScore: { ...textStyle('titleLg'), color: colors.primary, fontWeight: '700' },
});
}
