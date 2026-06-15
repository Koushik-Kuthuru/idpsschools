import React from 'react';
import { View, Text } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { AppButton, AppHeader, AppIcon, ScreenLayout } from '@/components';
import type { RootStackParamList } from '@/types';
import { colors, textStyle } from '@/theme';
import { StyleSheet } from 'react-native';
import { spacing } from '@/theme';

const styles = StyleSheet.create({
  body: { padding: spacing.xl, alignItems: 'center', gap: spacing.md },
});

export function AttendanceSuccessScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'AttendanceSuccess'>>();
  const { className = '10-A', present = 43, absent = 2 } = route.params ?? {};

  return (
    <ScreenLayout header={<AppHeader variant="back" title="SUBMITTED" />}>
      <View style={styles.body}>
        <AppIcon name="check_circle" size={64} color={colors.primaryContainer} />
        <Text style={[textStyle('headlineLg')]}>Submitted successfully</Text>
        <Text style={[textStyle('bodyMd'), { textAlign: 'center' }]}>
          Class {className} · Present: {present} · Absent: {absent}
        </Text>
        <Text style={[textStyle('labelSm'), { color: colors.primaryContainer }]}>✓ Synced</Text>
        <AppButton label="Back to Classes" onPress={() => navigation.navigate('AttendanceClasses')} />
        <AppButton
          label="Submit Another"
          variant="outline"
          onPress={() => navigation.navigate('AttendanceClasses')}
        />
      </View>
    </ScreenLayout>
  );
}
