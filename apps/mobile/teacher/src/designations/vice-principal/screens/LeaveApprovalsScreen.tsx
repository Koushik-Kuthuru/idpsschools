import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { VicePrincipalHeader } from '../components/VicePrincipalHeader';
import { ScreenShell } from '../components/ScreenShell';
import { leaveRequests as initial, leaveStats } from '../data/mockData';
import type { LeaveRequest } from '../data/mockData';
import { spacing, textStyle, useThemedStyles } from '../theme';
import type { VicePrincipalColorScheme } from '../theme/colors';

const TABS = ['Pending (6)', 'All Requests', 'Approved', 'Rejected'] as const;

const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  'CASUAL LEAVE': { bg: '#dbeafe', text: '#1d4ed8' },
  URGENT: { bg: '#fee2e2', text: '#b91c1c' },
  'MEDICAL LEAVE': { bg: '#d1fae5', text: '#047857' },
  'EARNED LEAVE': { bg: '#f3e8ff', text: '#7e22ce' },
};

export function LeaveApprovalsScreen() {
  const navigation = useNavigation();
  const styles = useThemedStyles(createStyles);
  const [requests, setRequests] = useState(initial);
  const [activeTab, setActiveTab] = useState(0);

  const filtered = requests.filter((r) => {
    if (activeTab === 0) return r.status === 'pending';
    if (activeTab === 2) return r.status === 'approved';
    if (activeTab === 3) return r.status === 'rejected';
    return true;
  });

  return (
    <ScreenShell
      header={
        <VicePrincipalHeader
          variant="back"
          title="Leave Management"
          onBack={() => navigation.goBack()}
          actionIcon="history"
          onAction={() => Alert.alert('History', 'Leave approval history')}
        />
      }
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.pendingBanner}>
          <MaterialIcons name="pending-actions" size={22} color="#ea580c" />
          <Text style={styles.pendingText}>6 leave requests awaiting your approval</Text>
          <TouchableOpacity><Text style={styles.reviewNow}>Review Now</Text></TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <StatCard label="Pending" value={String(leaveStats.pending)} color="#f97316" icon="hourglass-empty" />
          <StatCard label="Approved Today" value={String(leaveStats.approvedToday)} color="#10b981" icon="check-circle" />
          <StatCard label="Rejected" value={String(leaveStats.rejected)} color="#ef4444" icon="cancel" />
          <StatCard label="On Leave Now" value={String(leaveStats.onLeaveNow)} color="#3b82f6" icon="person-off" />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
          {TABS.map((t, i) => (
            <TouchableOpacity key={t} onPress={() => setActiveTab(i)} style={[styles.tab, activeTab === i && styles.tabActive]}>
              <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filtered.map((r) => (
          <LeaveCard
            key={r.id}
            request={r}
            onReject={() => setRequests((p) => p.map((x) => (x.id === r.id ? { ...x, status: 'rejected' } : x)))}
            onApprove={() => {
              setRequests((p) => p.map((x) => (x.id === r.id ? { ...x, status: 'approved' } : x)));
              Alert.alert('Approved', `${r.name}'s leave approved.`);
            }}
          />
        ))}
      </ScrollView>
    </ScreenShell>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value: string; color: string; icon: string }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLbl}>{label}</Text>
      <View style={styles.statBottom}>
        <Text style={[styles.statVal, { color }]}>{value}</Text>
        <MaterialIcons name={icon as 'hourglass-empty'} size={28} color={color} style={{ opacity: 0.2 }} />
      </View>
    </View>
  );
}

function LeaveCard({
  request: r,
  onReject,
  onApprove,
}: {
  request: LeaveRequest;
  onReject: () => void;
  onApprove: () => void;
}) {
  const styles = useThemedStyles(createStyles);

  if (r.status !== 'pending') {
    return (
      <View style={styles.card}>
        <Text style={styles.name}>{r.name}</Text>
        <Text style={styles.statusLbl}>{r.status}</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardBody}>
        <View style={styles.cardHead}>
          {r.avatar ? <Image source={{ uri: r.avatar }} style={styles.avatar} contentFit="cover" /> : null}
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{r.name}</Text>
            <Text style={styles.meta}>{r.type} • {r.days} ({r.dates})</Text>
          </View>
        </View>
        {r.badges ? (
          <View style={styles.badgeRow}>
            {r.badges.map((b) => {
              const c = BADGE_COLORS[b] ?? { bg: colorsFallback.bg, text: colorsFallback.text };
              return (
                <View key={b} style={[styles.badge, { backgroundColor: c.bg }]}>
                  <Text style={[styles.badgeText, { color: c.text }]}>{b}</Text>
                </View>
              );
            })}
          </View>
        ) : null}
        <View style={styles.details}>
          {r.reason ? <Text style={styles.detailLine}><Text style={styles.detailLbl}>Reason:</Text> {r.reason}</Text> : null}
          {r.remaining ? <Text style={styles.detailLine}><Text style={styles.detailLbl}>Remaining CL:</Text> {r.remaining}</Text> : null}
          {r.coverage ? (
            <View style={styles.coverageRow}>
              <MaterialIcons name="sync" size={14} color={r.coverageWarning ? '#dc2626' : '#059669'} />
              <Text style={[styles.coverageText, r.coverageWarning && { color: '#dc2626', fontWeight: '500' }]}>
                Coverage: {r.coverage}
              </Text>
            </View>
          ) : null}
          {r.attachment ? (
            <View style={styles.attachRow}>
              <MaterialIcons name="description" size={18} color="#047857" />
              <Text style={styles.attachText}>{r.attachment}</Text>
            </View>
          ) : null}
          {r.alert ? (
            <View style={styles.alertBox}>
              <MaterialIcons name="notification-important" size={16} color="#ea580c" />
              <Text style={styles.alertText}>{r.alert}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.rejectBtn} onPress={onReject}>
          <Text style={styles.rejectText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.approveBtn} onPress={onApprove}>
          <Text style={styles.approveText}>{r.approveLabel ?? 'Approve'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const colorsFallback = { bg: '#eceeed', text: '#3c4a42' };

function createStyles(colors: VicePrincipalColorScheme) {
  return StyleSheet.create({
    content: { padding: spacing.gutter, gap: spacing.md, paddingBottom: 32 },
    pendingBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: '#fff7ed',
      borderRadius: 16,
      padding: spacing.md,
    },
    pendingText: { flex: 1, ...textStyle('bodyMd'), color: '#9a3412' },
    reviewNow: { ...textStyle('labelMd'), color: colors.primaryContainer, fontWeight: '700', textDecorationLine: 'underline' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
    statCard: {
      width: '47%',
      backgroundColor: colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderRadius: 12,
      padding: spacing.md,
    },
    statLbl: { ...textStyle('labelMd'), color: colors.onSurfaceVariant, marginBottom: 4 },
    statBottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
    statVal: { fontSize: 28, fontWeight: '700' },
    tabRow: { gap: 24, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant, paddingBottom: 0 },
    tab: { paddingBottom: 12, paddingHorizontal: 4 },
    tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
    tabText: { ...textStyle('labelMd'), color: colors.onSurfaceVariant },
    tabTextActive: { color: colors.primary, fontWeight: '600' },
    card: {
      backgroundColor: colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderRadius: 12,
      overflow: 'hidden',
    },
    cardBody: { padding: spacing.md, gap: 12 },
    cardHead: { flexDirection: 'row', gap: 12 },
    avatar: { width: 40, height: 40, borderRadius: 20 },
    name: { ...textStyle('titleLg'), color: colors.onSurface },
    meta: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant },
    badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
    badgeText: { ...textStyle('labelMd'), fontWeight: '600' },
    details: { gap: 8 },
    detailLine: { ...textStyle('bodyMd'), color: colors.onSurface },
    detailLbl: { color: colors.onSurfaceVariant, fontWeight: '500' },
    coverageRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    coverageText: { ...textStyle('bodyMd'), color: '#059669' },
    attachRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ecfdf5', padding: 8, borderRadius: 8 },
    attachText: { ...textStyle('bodyMd'), color: '#047857', fontWeight: '500' },
    alertBox: { flexDirection: 'row', gap: 8, backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa', borderRadius: 8, padding: 12 },
    alertText: { flex: 1, fontSize: 12, color: '#9a3412' },
    cardActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.outlineVariant },
    rejectBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRightWidth: 1, borderRightColor: colors.outlineVariant },
    rejectText: { ...textStyle('labelMd'), color: '#dc2626', fontWeight: '600' },
    approveBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
    approveText: { ...textStyle('labelMd'), color: colors.primaryContainer, fontWeight: '600' },
    statusLbl: { ...textStyle('labelMd'), color: colors.primary, fontWeight: '700', textTransform: 'capitalize', padding: spacing.md },
  });
}
