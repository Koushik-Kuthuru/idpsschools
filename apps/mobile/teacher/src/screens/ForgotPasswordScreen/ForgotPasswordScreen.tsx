import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton, AppHeader, AppInput } from '@/components';
import { getMockAccountByEmail } from '@/services/api/mockData';
import { useAuthStore } from '@/store';
import { textStyle } from '@/theme';
import { styles } from '../TeacherLoginScreen/TeacherLoginScreen.styles';
import type { ForgotPasswordScreenProps } from './ForgotPasswordScreen.types';

export function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState('');
  const setPendingEmail = useAuthStore((s) => s.setPendingEmail);

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
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <AppHeader variant="back" title="RESET PASSWORD" showBack onBackPress={() => navigation.goBack()} />
      <View style={styles.card}>
        <Text style={[textStyle('bodyMd'), { marginBottom: 16 }]}>
          Enter your email address. We&apos;ll send you an OTP to reset your password.
        </Text>
        <AppInput label="Email" value={email} onChangeText={setEmail} icon="mail" autoCapitalize="none" keyboardType="email-address" />
        <AppButton
          label="Send OTP"
          onPress={sendOtp}
        />
        <AppButton label="Back to Login" variant="outline" onPress={() => navigation.navigate('TeacherLogin')} />
      </View>
    </SafeAreaView>
  );
}
