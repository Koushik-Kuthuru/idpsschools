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

export function MarksSuccessScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'MarksSuccess'>>();
  const { className = '10-A', examName = 'Final Exam' } = route.params ?? {};

  return (
    <ScreenLayout header={<AppHeader variant="back" title="MARKS SUBMITTED" />}>
      <View style={styles.body}>
        <AppIcon name="check_circle" size={64} color={colors.primaryContainer} />
        <Text style={[textStyle('headlineLg')]}>Marks submitted</Text>
        <Text style={[textStyle('bodyMd'), { textAlign: 'center' }]}>
          Class {className} · {examName}
        </Text>
        <AppButton label="Back to Marks Entry" onPress={() => navigation.navigate('MarksClasses')} />
      </View>
    </ScreenLayout>
  );
}
