import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { PrincipalHeader } from '../components/PrincipalHeader';
import { ScreenShell } from '../components/ScreenShell';
import { Card } from '../components/ui';
import { computeLeaveSummary, leaveRequests as initialRequests } from '../data/mockData';
import { spacing, textStyle, usePrincipalTheme, useThemedStyles } from '@/designations/principal/theme';
import type { PrincipalColorScheme } from '@/designations/principal/theme/colors';

function todayDateToken(): string {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

type TabKey = 'Pending' | 'Approved' | 'Rejected';

function leaveBadgeColor(type: string, palette: PrincipalColorScheme) {
  if (type.includes('Sick')) return palette.orange500;
  if (type.includes('Casual')) return palette.blue500;
  return palette.primaryContainer;
}

export function LeaveApprovalsCentreScreen() {
  const { colors } = usePrincipalTheme();
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation();
  const [tab, setTab] = useState<TabKey>('Pending');
  const [requests, setRequests] = useState(initialRequests);

  const summary = useMemo(() => computeLeaveSummary(requests), [requests]);

  const visible = requests.filter((r) => {
    if (tab === 'Pending') return r.status === 'pending';
    if (tab === 'Approved') return r.status === 'approved';
    return r.status === 'rejected';
  });

  const approve = (id: string, name: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'approved' as const,
              onLeaveToday: r.dates.includes(todayDateToken()),
            }
          : r,
      ),
    );
    Alert.alert('Approved', `${name}'s leave approved.`);
  };

  const reject = (id: string, name: string) => {
    Alert.alert('Reject leave', `Reject ${name}'s request?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: () => {
          setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'rejected' as const } : r)));
          Alert.alert('Rejected', `${name}'s leave rejected.`);
        },
      },
    ]);
  };

  const tabCounts: Record<TabKey, number> = {
    Pending: summary.pending,
    Approved: summary.approved,
    Rejected: summary.rejected,
  };

  return (
    <>
      <ScreenShell
        scroll={false}
        paddingBottom={0}
        header={
          <View style={styles.headerBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
              <MaterialIcons name="arrow-back" size={22} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Leave & Approvals</Text>
            <MaterialIcons name="history" size={22} color={colors.onSurfaceVariant} />
          </View>
        }
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.summaryBento}>
            {[
              { l: 'Pending', v: summary.pending },
              { l: 'Approved', v: summary.approved },
              { l: 'Rejected', v: summary.rejected },
              { l: 'On Leave Today', v: summary.onLeaveToday },
            ].map((item) => (
              <View key={item.l} style={styles.bentoItem}>
                <Text style={styles.bentoVal}>{String(item.v).padStart(2, '0')}</Text>
                <Text style={styles.bentoLbl}>{item.l}</Text>
              </View>
            ))}
          </View>

          <View style={styles.tabs}>
            {(['Pending', 'Approved', 'Rejected'] as TabKey[]).map((t) => (
              <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
                <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                  {t} ({tabCounts[t]})
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {visible.map((r) => (
            <Card key={r.id} style={styles.reqCard}>
              <Text style={styles.reqName}>{r.name}</Text>
              <Text style={styles.reqDept}>{r.dept}</Text>
              <View style={[styles.typeBadge, { backgroundColor: `${leaveBadgeColor(r.type, colors)}22` }]}>
                <Text style={[styles.typeText, { color: leaveBadgeColor(r.type, colors) }]}>{r.type} · {r.days}</Text>
              </View>
              <Text style={styles.reqDates}>{r.dates}</Text>
              <Text style={styles.reqSubmitted}>Submitted {r.submitted}</Text>
              {r.status === 'pending' ? (
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => reject(r.id, r.name)}><Text style={styles.rejectText}>Reject</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.approveBtn} onPress={() => approve(r.id, r.name)}><Text style={styles.approveText}>Approve</Text></TouchableOpacity>
                </View>
              ) : (
                <Text style={[styles.statusLbl, r.status === 'approved' ? styles.approvedLbl : styles.rejectedLbl]}>{r.status}</Text>
              )}
            </Card>
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={() => Alert.alert('Filter', 'Filter leave requests')}>
          <MaterialIcons name="filter-list" size={26} color={colors.onPrimary} />
        </TouchableOpacity>
      </ScreenShell>
    </>
  );
}

function createStyles(colors: PrincipalColorScheme) {
  return StyleSheet.create({
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.gutter, minHeight: spacing.headerHeight, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant, backgroundColor: colors.surface },
  headerTitle: { ...textStyle('headlineMd'), fontWeight: '700' },
  content: { padding: spacing.gutter, gap: spacing.md, paddingBottom: 100 },
  summaryBento: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: colors.primaryContainer, borderRadius: 16, padding: spacing.md, gap: spacing.sm },
  bentoItem: { width: '47%', alignItems: 'center' },
  bentoVal: { fontSize: 22, fontWeight: '700', color: colors.onPrimary },
  bentoLbl: { ...textStyle('chip10'), color: colors.onPrimary, opacity: 0.9, textAlign: 'center' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primaryContainer },
  tabText: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  tabTextActive: { color: colors.primary, fontWeight: '700' },
  reqCard: { gap: 4, borderColor: '#f1f5f9' },
  reqName: { ...textStyle('bodyMd'), fontWeight: '700' },
  reqDept: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  typeText: { ...textStyle('chip10'), fontWeight: '700' },
  reqDates: { ...textStyle('bodyMd'), fontWeight: '500' },
  reqSubmitted: { ...textStyle('chip10'), color: colors.onSurfaceVariant },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  rejectBtn: { flex: 1, borderWidth: 1, borderColor: colors.error, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  rejectText: { ...textStyle('labelMd'), color: colors.error, fontWeight: '700' },
  approveBtn: { flex: 1, backgroundColor: colors.primaryContainer, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  approveText: { ...textStyle('labelMd'), color: colors.onPrimary, fontWeight: '700' },
  statusLbl: { ...textStyle('labelMd'), fontWeight: '700', marginTop: 8, textTransform: 'capitalize' },
  approvedLbl: { color: colors.primary },
  rejectedLbl: { color: colors.error },
  fab: { position: 'absolute', right: spacing.gutter, bottom: spacing.fabBottom, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 6 },
  });
}
