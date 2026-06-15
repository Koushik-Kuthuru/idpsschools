import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { VicePrincipalHeader } from '../components/VicePrincipalHeader';
import { ScreenShell } from '../components/ScreenShell';
import { ProgressBar } from '../components/ui';
import { availableReports, kpiMetrics, reportFilters } from '../data/mockData';
import { handleVpTabPress } from '../navigation/navigationHelpers';
import type { VicePrincipalStackParamList } from '../navigation/types';
import { spacing, textStyle, useThemedStyles, useVicePrincipalTheme } from '../theme';
import type { VicePrincipalColorScheme } from '../theme/colors';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

export function ReportsAnalyticsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<VicePrincipalStackParamList>>();
  const { colors } = useVicePrincipalTheme();
  const styles = useThemedStyles(createStyles);
  const [activeFilter, setActiveFilter] = useState(0);

  return (
    <ScreenShell
      activeTab="data"
      onTabPress={(t) => handleVpTabPress(navigation, t)}
      header={
        <VicePrincipalHeader
          variant="back"
          title="Reports & Analytics"
          onBack={() => handleVpTabPress(navigation, 'home')}
          actionIcon="download"
          onAction={() => {}}
        />
      }
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {reportFilters.map((f, i) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, activeFilter === i && styles.filterChipActive]}
              onPress={() => setActiveFilter(i)}
            >
              <Text style={[styles.filterText, activeFilter === i && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.summaryHead}>
          <Text style={styles.summaryTitle}>Executive Summary</Text>
          <Text style={styles.realtime}>Real-time</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kpiRow}>
          {kpiMetrics.map((k) => {
            const valueColor =
              k.colorKey === 'tertiary' ? colors.tertiary : k.colorKey === 'secondary' ? colors.onSecondaryContainer : colors.primary;
            const barColor = k.colorKey === 'tertiary' ? colors.tertiaryContainer : k.colorKey === 'secondary' ? colors.secondary : colors.primaryContainer;
            return (
              <View key={k.label} style={styles.kpiCard}>
                <Text style={styles.kpiLbl}>{k.label}</Text>
                <View style={styles.kpiValRow}>
                  <Text style={[styles.kpiVal, { color: valueColor }]}>{k.value}</Text>
                  <MaterialIcons name={k.icon as IconName} size={18} color={valueColor} />
                </View>
                <ProgressBar percent={k.progress} color={barColor} height={6} />
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.chartCard}>
          <View style={styles.chartHead}>
            <View>
              <Text style={styles.chartTitle}>Student Attendance</Text>
              <Text style={styles.chartSub}>Last 30 Days trend</Text>
            </View>
            <MaterialIcons name="more-vert" size={22} color={colors.onSurfaceVariant} />
          </View>
          <View style={styles.chartArea}>
            <Svg width="100%" height={160} viewBox="0 0 400 160" preserveAspectRatio="none">
              <Defs>
                <LinearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#0fbd83" />
                  <Stop offset="100%" stopColor="#0fbd83" stopOpacity={0} />
                </LinearGradient>
              </Defs>
              <Path d="M0,140 Q40,130 80,100 T160,80 T240,110 T320,60 T400,40 V160 H0 Z" fill="url(#chartFill)" opacity={0.2} />
              <Path d="M0,140 Q40,130 80,100 T160,80 T240,110 T320,60 T400,40" fill="none" stroke="#006c49" strokeWidth={3} strokeLinecap="round" />
              <Circle cx={80} cy={100} r={4} fill="#006c49" />
              <Circle cx={160} cy={80} r={4} fill="#006c49" />
              <Circle cx={240} cy={110} r={4} fill="#006c49" />
              <Circle cx={320} cy={60} r={4} fill="#006c49" />
              <Circle cx={400} cy={40} r={4} fill="#006c49" />
            </Svg>
          </View>
          <View style={styles.chartFoot}>
            <Text style={styles.peakText}>Peak: 96% on Monday</Text>
            <TouchableOpacity style={styles.logsBtn}>
              <Text style={styles.logsText}>Detailed Logs</Text>
              <MaterialIcons name="chevron-right" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.reportsTitle}>Available Reports</Text>
        {availableReports.map((r) => (
          <TouchableOpacity key={r.id} style={styles.reportRow} activeOpacity={0.7}>
            <View style={[styles.reportIcon, { backgroundColor: `${r.color}22` }]}>
              <MaterialIcons name={r.icon as IconName} size={22} color={r.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.reportTitle}>{r.title}</Text>
              <Text style={styles.reportMeta}>{r.meta}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ScreenShell>
  );
}

function createStyles(colors: VicePrincipalColorScheme) {
  return StyleSheet.create({
    content: { paddingBottom: 32 },
    filterRow: { gap: 8, paddingHorizontal: spacing.gutter, paddingTop: spacing.md },
    filterChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: colors.surfaceContainer,
    },
    filterChipActive: { backgroundColor: colors.primaryContainer },
    filterText: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
    filterTextActive: { color: colors.onPrimaryContainer, fontWeight: '600' },
    summaryHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.gutter, marginTop: spacing.lg, marginBottom: 12 },
    summaryTitle: { ...textStyle('headlineMd'), color: colors.onSurface },
    realtime: { ...textStyle('labelMd'), color: colors.primary, fontWeight: '600' },
    kpiRow: { gap: 16, paddingHorizontal: spacing.gutter, paddingBottom: 4 },
    kpiCard: {
      width: 160,
      backgroundColor: colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderRadius: 12,
      padding: spacing.md,
      gap: 8,
    },
    kpiLbl: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
    kpiValRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
    kpiVal: { ...textStyle('headlineLgMobile'), fontWeight: '700' },
    chartCard: {
      marginHorizontal: spacing.gutter,
      marginTop: spacing.lg,
      backgroundColor: colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderRadius: 12,
      padding: spacing.md,
    },
    chartHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
    chartTitle: { ...textStyle('titleLg'), color: colors.onSurface },
    chartSub: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant },
    chartArea: { height: 160, marginBottom: spacing.md },
    chartFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.outlineVariant, paddingTop: 8 },
    peakText: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
    logsBtn: { flexDirection: 'row', alignItems: 'center' },
    logsText: { ...textStyle('labelMd'), color: colors.primary, fontWeight: '600' },
    reportsTitle: { ...textStyle('headlineMd'), color: colors.onSurface, paddingHorizontal: spacing.gutter, marginTop: spacing.lg, marginBottom: spacing.md },
    reportRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginHorizontal: spacing.gutter,
      marginBottom: 12,
      backgroundColor: colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderRadius: 12,
      padding: spacing.md,
    },
    reportIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    reportTitle: { ...textStyle('bodyMd'), fontWeight: '700', color: colors.onSurface },
    reportMeta: { ...textStyle('chip10'), color: colors.onSurfaceVariant },
  });
}
