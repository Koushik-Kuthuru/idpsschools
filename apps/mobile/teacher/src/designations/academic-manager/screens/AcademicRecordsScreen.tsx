import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ManagerHeader } from '../components/ManagerHeader';
import { ScreenShell } from '../components/ScreenShell';
import { Card } from '../components/ui';
import { academicRecords } from '../data/mockData';
import { colors, spacing, textStyle } from '@/designations/academic-manager/theme';

const FILTERS = ['All', 'Grade 12 - Outgoing', 'TC Requests', 'Promoted', 'Detained', 'Transfer In'];

export function AcademicRecordsScreen() {
  const navigation = useNavigation();
  const [filter, setFilter] = useState('All');

  return (
    <ScreenShell
      header={
        <ManagerHeader
          title="Academic Records"
          onBack={() => navigation.goBack()}
          right={
            <View style={styles.headerRight}>
              <MaterialIcons name="search" size={22} color={colors.onSurfaceVariant} />
              <MaterialIcons name="filter-list" size={22} color={colors.onSurfaceVariant} />
            </View>
          }
        />
      }
    >
      <View style={styles.content}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={20} color={colors.outline} />
          <Text style={styles.searchPlaceholder}>Search student name, roll no...</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {FILTERS.map((f) => (
            <TouchableOpacity key={f} style={[styles.filterChip, filter === f && styles.filterActive]} onPress={() => setFilter(f)}>
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {academicRecords.map((r) => (
          <Card key={r.name} style={styles.recordCard}>
            <View style={styles.recordHead}>
              <Text style={styles.recordName}>{r.name}</Text>
              <Text style={styles.recordTag}>{r.tag}</Text>
            </View>
            <Text style={styles.recordMeta}>{r.meta}</Text>
            {r.detail ? <Text style={styles.recordDetail}>{r.detail}</Text> : null}
            {r.date ? <Text style={styles.recordDate}>{r.date}</Text> : null}
          </Card>
        ))}
        <View style={styles.syncError}>
          <MaterialIcons name="cloud-off" size={18} color={colors.error} />
          <Text style={styles.syncText}>3 student files failed to sync. Tap to retry.</Text>
        </View>
        <View style={styles.bulkBar}>
          <Text style={styles.bulkText}>3 selected</Text>
          <TouchableOpacity style={styles.bulkBtn}><Text style={styles.bulkBtnText}>Promote All</Text></TouchableOpacity>
          <TouchableOpacity style={styles.bulkBtn}><Text style={styles.bulkBtnText}>Generate TC</Text></TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity style={styles.fab}><MaterialIcons name="add" size={28} color={colors.onPrimary} /></TouchableOpacity>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.gutter, gap: 12 },
  headerRight: { flexDirection: 'row', gap: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLowest },
  searchPlaceholder: { ...textStyle('bodyMd'), color: colors.outline },
  filters: { gap: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.outlineVariant },
  filterActive: { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer },
  filterText: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  filterTextActive: { color: colors.onPrimaryContainer },
  sectionTitle: { ...textStyle('titleLg') },
  recordCard: { gap: 4 },
  recordHead: { flexDirection: 'row', justifyContent: 'space-between' },
  recordName: { ...textStyle('bodyMd'), fontWeight: '700' },
  recordTag: { ...textStyle('chip10'), backgroundColor: colors.secondaryContainer, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, color: colors.onSecondaryContainer },
  recordMeta: { ...textStyle('chip10'), color: colors.onSurfaceVariant },
  recordDetail: { ...textStyle('chip10'), color: colors.primary },
  recordDate: { ...textStyle('chip10'), color: colors.onSurfaceVariant },
  syncError: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.errorContainer, padding: 12, borderRadius: 8 },
  syncText: { ...textStyle('bodyMd'), color: colors.onErrorContainer, flex: 1 },
  bulkBar: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: colors.inverseSurface, borderRadius: 12 },
  bulkText: { ...textStyle('labelMd'), color: colors.inverseOnSurface, flex: 1 },
  bulkBtn: { backgroundColor: colors.primaryContainer, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  bulkBtnText: { ...textStyle('chip10'), color: colors.onPrimaryContainer },
  fab: { position: 'absolute', right: spacing.gutter, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center' },
});
