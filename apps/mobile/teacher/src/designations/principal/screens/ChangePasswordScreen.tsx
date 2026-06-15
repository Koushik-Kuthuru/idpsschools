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
import { PrincipalHeader } from '../components/PrincipalHeader';
import { ScreenShell } from '../components/ScreenShell';
import { Card } from '../components/ui';
import type { PrincipalColorScheme } from '@/designations/principal/theme/colors';
import type { PrincipalStackParamList } from '../navigation/types';
import { useAuthStore } from '@/store';
import { spacing, textStyle, usePrincipalTheme, useThemedStyles } from '@/designations/principal/theme';

type Step = 'send' | 'otp' | 'password';

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(local.length - 2, 2))}@${domain}`;
}

export function ChangePasswordScreen() {
  const { colors } = usePrincipalTheme();
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<NativeStackNavigationProp<PrincipalStackParamList>>();
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
      header={
        <PrincipalHeader
          title="Change Password"
          onBack={() => navigation.goBack()}
        />
      }
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.steps}>
          {(['send', 'otp', 'password'] as Step[]).map((s, i) => {
            const stepIndex = step === 'send' ? 0 : step === 'otp' ? 1 : 2;
            return (
              <View key={s} style={styles.stepItem}>
                <View
                  style={[
                    styles.stepDot,
                    i < stepIndex && styles.stepDotDone,
                    i === stepIndex && styles.stepDotActive,
                  ]}
                >
                  <Text style={styles.stepNum}>{i + 1}</Text>
                </View>
                {i < 2 ? <View style={styles.stepLine} /> : null}
              </View>
            );
          })}
        </View>
        <Text style={styles.stepLabels}>Send OTP · Verify · Set Password</Text>

        {step === 'send' ? (
          <Card style={styles.card}>
            <MaterialIcons name="lock-reset" size={36} color={colors.primary} style={styles.cardIcon} />
            <Text style={styles.cardTitle}>Verify your identity</Text>
            <Text style={styles.cardSub}>
              We will send a one-time password to your registered email
              {email ? ` (${maskEmail(email)})` : ''} to confirm this change.
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleSendOtp} disabled={isLoading} activeOpacity={0.8}>
              {isLoading ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={styles.primaryBtnText}>Send OTP</Text>
              )}
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
                  selectTextOnFocus
                />
              ))}
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleVerifyOtp} activeOpacity={0.8}>
              <Text style={styles.primaryBtnText}>Verify OTP</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleResend} disabled={isLoading} style={styles.resendBtn}>
              <Text style={styles.resendText}>Resend code</Text>
            </TouchableOpacity>
          </Card>
        ) : null}

        {step === 'password' ? (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Set new password</Text>
            <Text style={styles.cardSub}>Use at least 8 characters with numbers and symbols.</Text>
            <View style={styles.inputWrap}>
              <MaterialIcons name="lock" size={20} color={colors.onSurfaceVariant} />
              <TextInput
                style={styles.input}
                placeholder="New password"
                placeholderTextColor={colors.outline}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                <MaterialIcons name={showPassword ? 'visibility-off' : 'visibility'} size={20} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            <View style={styles.inputWrap}>
              <MaterialIcons name="lock" size={20} color={colors.onSurfaceVariant} />
              <TextInput
                style={styles.input}
                placeholder="Confirm password"
                placeholderTextColor={colors.outline}
                secureTextEntry={!showConfirm}
                value={confirm}
                onChangeText={setConfirm}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowConfirm((v) => !v)} hitSlop={8}>
                <MaterialIcons name={showConfirm ? 'visibility-off' : 'visibility'} size={20} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleUpdatePassword} disabled={isLoading} activeOpacity={0.8}>
              {isLoading ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={styles.primaryBtnText}>Update Password</Text>
              )}
            </TouchableOpacity>
          </Card>
        ) : null}
      </ScrollView>
    </ScreenShell>
  );
}

function createStyles(colors: PrincipalColorScheme) {
  return StyleSheet.create({
  content: { padding: spacing.gutter, paddingBottom: 32, gap: 12 },
  steps: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  stepItem: { flexDirection: 'row', alignItems: 'center' },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerLowest,
  },
  stepDotActive: { borderColor: colors.primaryContainer, backgroundColor: colors.primaryContainer },
  stepDotDone: { borderColor: colors.primaryContainer, backgroundColor: `${colors.primaryContainer}33` },
  stepNum: { ...textStyle('chip10'), fontWeight: '700', color: colors.onSurface },
  stepLine: { width: 36, height: 2, backgroundColor: colors.outlineVariant, marginHorizontal: 4 },
  stepLabels: { ...textStyle('chip10'), color: colors.onSurfaceVariant, textAlign: 'center', marginBottom: 8 },
  card: { alignItems: 'stretch', gap: 12 },
  cardIcon: { alignSelf: 'center', marginBottom: 4 },
  cardTitle: { ...textStyle('titleLg'), fontWeight: '700', textAlign: 'center' },
  cardSub: { ...textStyle('bodyMd'), color: colors.onSurfaceVariant, textAlign: 'center', lineHeight: 22 },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: 8 },
  otpBox: {
    width: 44,
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: colors.onSurface,
    backgroundColor: colors.surfaceContainerLow,
  },
  otpBoxFilled: { borderColor: colors.primaryContainer },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surfaceContainerLow,
  },
  input: { ...textStyle('bodyMd'), flex: 1, padding: 0 },
  primaryBtn: {
    marginTop: 4,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
  },
  primaryBtnText: { ...textStyle('bodyMd'), color: colors.onPrimary, fontWeight: '700' },
  resendBtn: { alignItems: 'center', paddingVertical: 8 },
  resendText: { ...textStyle('labelMd'), color: colors.primary, fontWeight: '600' },
});
}
