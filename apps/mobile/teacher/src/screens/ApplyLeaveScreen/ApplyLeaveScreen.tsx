import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppButton, AppHeader, AppInput, ScreenLayout } from '@/components';
import { mockApi } from '@/services/api';
import type { LeaveType, RootStackParamList } from '@/types';
import { colors, textStyle } from '@/theme';
import { StyleSheet } from 'react-native';
import { borderRadius, spacing } from '@/theme';

const TYPES: { key: LeaveType; label: string }[] = [
  { key: 'casual', label: 'Casual' },
  { key: 'sick', label: 'Sick' },
  { key: 'annual', label: 'Annual' },
  { key: 'special', label: 'Special' },
];

const styles = StyleSheet.create({
  body: { padding: spacing.md, gap: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  chipActive: { backgroundColor: `${colors.primaryContainer}1A`, borderColor: colors.primaryContainer },
  chipText: { color: colors.onSurface },
  chipTextActive: { color: colors.primaryContainer, fontWeight: '700' },
});

export function ApplyLeaveScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [type, setType] = useState<LeaveType>('casual');
  const [fromDate, setFromDate] = useState('Jan 20, 2026');
  const [toDate, setToDate] = useState('Jan 20, 2026');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!reason.trim()) {
      Alert.alert('Required', 'Please enter a reason.');
      return;
    }
    setSubmitting(true);
    try {
      await mockApi.faculty.applyLeave({ type, fromDate, toDate, reason: reason.trim() });
      Alert.alert('Submitted', 'Leave request submitted.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenLayout scroll header={<AppHeader variant="back" title="APPLY FOR LEAVE" />}>
      <View style={styles.body}>
        <Text style={[textStyle('labelLg')]}>Leave type</Text>
        <View style={styles.chips}>
          {TYPES.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.chip, type === t.key && styles.chipActive]}
              onPress={() => setType(t.key)}
            >
              <Text style={[textStyle('labelSm'), styles.chipText, type === t.key && styles.chipTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <AppInput label="From date" value={fromDate} onChangeText={setFromDate} />
        <AppInput label="To date" value={toDate} onChangeText={setToDate} />
        <AppInput label="Reason" value={reason} onChangeText={setReason} multiline />
        <AppButton label="Submit" onPress={submit} loading={submitting} disabled={submitting} />
      </View>
    </ScreenLayout>
  );
}
