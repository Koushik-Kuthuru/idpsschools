import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppButton, AppHeader, ScreenLayout } from '@/components';
import { mockApi } from '@/services/api';
import type { LeaveRequest, RootStackParamList } from '@/types';
import { colors, textStyle } from '@/theme';
import { StyleSheet } from 'react-native';
import { borderRadius, spacing } from '@/theme';

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md },
  section: { fontWeight: '700', color: colors.onSurface },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.slate100,
    gap: spacing.xs,
  },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  link: { color: colors.primaryContainer, fontWeight: '600' },
});

export function LeaveManagementScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);

  useEffect(() => {
    mockApi.faculty.getLeaves().then(setLeaves);
  }, []);

  const pending = leaves.filter((l) => l.status === 'pending');
  const approved = leaves.filter((l) => l.status === 'approved');

  return (
    <ScreenLayout scroll header={<AppHeader variant="back" title="LEAVE MANAGEMENT" />}>
      <View style={styles.content}>
        <Text style={[textStyle('labelLg'), styles.section]}>PENDING APPROVAL ({pending.length})</Text>
        {pending.map((l) => (
          <View key={l.id} style={styles.card}>
            <Text style={[textStyle('headlineSm')]}>{l.type} leave</Text>
            <Text style={[textStyle('bodyMd')]}>{l.fromDate} — {l.toDate}</Text>
            <Text style={[textStyle('bodyMd')]}>Reason: {l.reason}</Text>
            <Text style={[textStyle('labelSm'), { color: colors.late }]}>Status: Awaiting approval</Text>
          </View>
        ))}
        <Text style={[textStyle('labelLg'), styles.section]}>APPROVED ({approved.length})</Text>
        {approved.map((l) => (
          <View key={l.id} style={styles.card}>
            <Text style={[textStyle('headlineSm')]}>{l.type} leave</Text>
            <Text style={[textStyle('bodyMd')]}>{l.fromDate} — {l.toDate}</Text>
            <Text style={[textStyle('labelSm'), { color: colors.primaryContainer }]}>✓ Approved</Text>
          </View>
        ))}
        <AppButton label="Apply for Leave" onPress={() => navigation.navigate('ApplyLeave')} />
        <TouchableOpacity onPress={() => navigation.navigate('LeaveBalance')}>
          <Text style={[textStyle('labelLg'), styles.link, { textAlign: 'center' }]}>View Balance</Text>
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
}
