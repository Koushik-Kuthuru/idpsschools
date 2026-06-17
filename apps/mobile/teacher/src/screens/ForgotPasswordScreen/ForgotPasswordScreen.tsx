import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton, AppHeader, AppInput } from '@/components';
import { getMockAccountByEmail } from '@/services/api/mockData';
import { useAuthStore } from '@/store';
import { colors } from '@/theme';
import { styles } from '../TeacherLoginScreen/TeacherLoginScreen.styles';
import type { ForgotPasswordScreenProps } from './ForgotPasswordScreen.types';

export function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState('');
  const setPendingEmail = useAuthStore((s) => s.setPendingEmail);
  const pageBg = colors.canvas;

  const sendOtp = () => {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert('Email required', 'Enter your registered employee email.');
      return;
    }
    if (!getMockAccountByEmail(trimmed)) {
      Alert.alert('Account not found', 'No staff account is registered with this email.');
      return;
    }
    setPendingEmail(trimmed);
    navigation.navigate('VerifyOtp', { email: trimmed, flow: 'reset' });
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: pageBg }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={[styles.flex, { backgroundColor: pageBg }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <AppHeader variant="back" title="Reset password" showBack onBackPress={() => navigation.goBack()} />
        <ScrollView contentContainerStyle={styles.formBody} keyboardShouldPersistTaps="handled">
          <Text style={[styles.welcome, { marginBottom: 8 }]}>Forgot password</Text>
          <Text style={[styles.welcomeSub, { color: colors.slate500, marginBottom: 24 }]}>
            Enter your registered employee email. We&apos;ll send you an OTP to reset your password.
          </Text>
          <AppInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            icon="mail"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <View style={styles.fieldGap} />
          <AppButton label="Send OTP" onPress={sendOtp} icon="east" />
          <View style={styles.fieldGap} />
          <AppButton label="Back to login" variant="outline" onPress={() => navigation.navigate('TeacherLogin')} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
