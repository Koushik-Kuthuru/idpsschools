import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppHeader, ScreenLayout } from '@/components';
import { mockApi } from '@/services/api';
import type { RootStackParamList, SalarySummary } from '@/types';
import { colors, textStyle } from '@/theme';
import { StyleSheet } from 'react-native';
import { borderRadius, spacing } from '@/theme';

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.xs,
  },
  net: { color: colors.primaryContainer, fontWeight: '800' },
  link: { color: colors.primaryContainer, fontWeight: '600', textAlign: 'center' },
});

export function SalaryOverviewScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [s, setS] = useState<SalarySummary | null>(null);
  useEffect(() => {
    mockApi.faculty.getSalarySummary().then(setS);
  }, []);

  if (!s) return null;

  return (
    <ScreenLayout scroll header={<AppHeader variant="back" title="SALARY / PAYROLL" />}>
      <View style={styles.content}>
        <Text style={[textStyle('labelLg')]}>Current month: {s.month}</Text>
        <View style={styles.card}>
          <Text style={[textStyle('bodyMd')]}>Base Salary: ${s.baseSalary}</Text>
          <Text style={[textStyle('bodyMd')]}>Allowances: ${s.allowances}</Text>
          <Text style={[textStyle('bodyMd')]}>Deductions: -${s.deductions}</Text>
          <Text style={[textStyle('headlineLg'), styles.net]}>Net: ${s.netSalary}</Text>
          <Text style={[textStyle('labelSm'), { color: colors.outline }]}>Status: {s.status}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('SalaryHistory')}>
          <Text style={[textStyle('labelLg'), styles.link]}>Previous Months</Text>
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
}
