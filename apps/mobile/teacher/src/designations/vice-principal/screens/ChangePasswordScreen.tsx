import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { VicePrincipalHeader } from '../components/VicePrincipalHeader';
import { ScreenShell } from '../components/ScreenShell';
import { Card } from '../components/ui';
import type { VicePrincipalStackParamList } from '../navigation/types';
import { useAuthStore } from '@/store';
import { spacing, textStyle, useThemedStyles, useVicePrincipalTheme } from '../theme';
import type { VicePrincipalColorScheme } from '../theme/colors';

type Step = 'send' | 'otp' | 'password';

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(local.length - 2, 2))}@${domain}`;
}

export function ChangePasswordScreen() {
  const { colors } = useVicePrincipalTheme();
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<NativeStackNavigationProp<VicePrincipalStackParamList>>();
  const user = useAuthStore((s) => s.user);
  const sendOtp = useAuthStore((s) => s.sendChangePasswordOtp);
  const changePassword = useAuthStore((s) => s.changePasswordWithOtp);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [step, setStep] = useState<Step>('send');
  const [sentTo, setSentTo] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const otpRefs = useRef<(TextInput | null)[]>([]);

  const email = user?.email ?? sentTo;

  const handleSendOtp = async () => {
    try {
      const target = await sendOtp();
      setSentTo(target);
      setStep('otp');
      Alert.alert('OTP sent', `A 6-digit code was sent to ${maskEmail(target)}.`);
    } catch {
      Alert.alert('Could not send OTP', 'Please try again in a moment.');
    }
  };

  const onOtpDigit = (index: number, char: string) => {
    const digits = otp.padEnd(6, ' ').split('');
    digits[index] = char.slice(-1);
    const next = digits.join('').replace(/\s/g, '').slice(0, 6);
    setOtp(next);
    if (char && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleVerifyOtp = () => {
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Enter the full 6-digit code.');
      return;
    }
    setStep('password');
  };

  const handleUpdatePassword = async () => {
    if (password.length < 8) {
      Alert.alert('Weak password', 'Use at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Mismatch', 'New password and confirmation must match.');
      return;
    }

    try {
      await changePassword(otp, password);
      Alert.alert('Password updated', 'Your password has been changed successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not update password';
      Alert.alert('Update failed', message);
    }
  };

  const handleResend = async () => {
    try {
      const target = await sendOtp();
      setSentTo(target);
      setOtp('');
      Alert.alert('OTP resent', `A new code was sent to ${maskEmail(target)}.`);
    } catch {
      Alert.alert('Could not resend OTP', 'Please try again.');
    }
  };

  return (
    <ScreenShell
      scroll={false}
      header={<VicePrincipalHeader variant="back" title="Change Password" onBack={() => navigation.goBack()} />}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {step === 'send' ? (
          <Card style={styles.card}>
            <MaterialIcons name="lock-reset" size={36} color={colors.primary} style={styles.cardIcon} />
            <Text style={styles.cardTitle}>Verify your identity</Text>
            <Text style={styles.cardSub}>
              We will send a one-time password to your registered email
              {email ? ` (${maskEmail(email)})` : ''}.
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleSendOtp} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.primaryBtnText}>Send OTP</Text>}
            </TouchableOpacity>
          </Card>
        ) : null}
        {step === 'otp' ? (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Enter OTP</Text>
            <Text style={styles.cardSub}>Code sent to {maskEmail(sentTo || email)}</Text>
            <View style={styles.otpRow}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <TextInput
                  key={i}
                  ref={(r) => { otpRefs.current[i] = r; }}
                  style={[styles.otpBox, otp[i] ? styles.otpBoxFilled : null]}
                  value={otp[i] ?? ''}
                  onChangeText={(t) => onOtpDigit(i, t)}
                  keyboardType="number-pad"
                  maxLength={1}
                />
              ))}
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleVerifyOtp}>
              <Text style={styles.primaryBtnText}>Verify OTP</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleResend} style={styles.resendBtn}>
              <Text style={styles.resendText}>Resend code</Text>
            </TouchableOpacity>
          </Card>
        ) : null}
        {step === 'password' ? (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Set new password</Text>
            <TextInput style={styles.otpBox} placeholder="New password" secureTextEntry value={password} onChangeText={setPassword} placeholderTextColor={colors.outline} />
            <TextInput style={styles.otpBox} placeholder="Confirm password" secureTextEntry value={confirm} onChangeText={setConfirm} placeholderTextColor={colors.outline} />
            <TouchableOpacity style={styles.primaryBtn} onPress={handleUpdatePassword} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.primaryBtnText}>Update Password</Text>}
            </TouchableOpacity>
          </Card>
        ) : null}
      </ScrollView>
    </ScreenShell>
  );
}

function createStyles(colors: VicePrincipalColorScheme) {
  return StyleSheet.create({
    content: { padding: spacing.gutter, gap: 12, paddingBottom: 32 },
    card: { gap: 12 },
    cardIcon: { alignSelf: 'center' },
    cardTitle: { ...textStyle('titleLg'), fontWeight: '700', textAlign: 'center', color: colors.onSurface },
    cardSub: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant, textAlign: 'center' },
    otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
    otpBox: {
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderRadius: 10,
      padding: 10,
      ...textStyle('bodyMd'),
      color: colors.onSurface,
      backgroundColor: colors.surfaceContainerLow,
      minWidth: 44,
      textAlign: 'center',
    },
    otpBoxFilled: { borderColor: colors.primaryContainer },
    primaryBtn: { backgroundColor: colors.primaryContainer, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    primaryBtnText: { ...textStyle('bodyMd'), color: colors.onPrimary, fontWeight: '700' },
    resendBtn: { alignItems: 'center', paddingVertical: 8 },
    resendText: { ...textStyle('labelMd'), color: colors.primary, fontWeight: '600' },
  });
}
