import { useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { authService } from '@/services/api';
import { useAuthStore } from '@/store';
import { useOtpResend } from '@/hooks/useOtpResend';

export default function OtpScreen() {
  const theme = useTheme();
  const router = useRouter();
  const resetEmail = useAuthStore((s) => s.resetEmail);
  const resetPhone = useAuthStore((s) => s.resetPhone);
  const resetMethod = useAuthStore((s) => s.resetMethod);
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  const destination = resetMethod === 'phone' ? resetPhone || '' : resetEmail || '';

  const { secondsLeft, canResend, resending, resend } = useOtpResend(async () => {
    await authService.resendOtp(
      resetMethod === 'phone' ? { phone: resetPhone } : { email: resetEmail }
    );
    Alert.alert('OTP Sent', 'A new verification code has been sent.');
  });

  const handleChange = (text: string, index: number) => {
    const digit = text.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    if (digit && index < 5) inputs.current[index + 1]?.focus();
    if (!digit && index > 0) inputs.current[index - 1]?.focus();
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otp = digits.join('');
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter all 6 digits');
      return;
    }
    setLoading(true);
    try {
      await authService.verifyOtp(otp);
      router.push('/(auth)/reset-password');
    } catch {
      Alert.alert('Invalid OTP', 'The code is incorrect. Please try again.');
      setDigits(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.nav, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: theme.colors.text }]}>
            {resetMethod === 'phone' ? 'VERIFY MOBILE' : 'VERIFY EMAIL'}
          </Text>
          <View style={styles.navBtn} />
        </View>

        <View style={styles.content}>
          <View style={[styles.iconWrap, { backgroundColor: `${theme.colors.primary}1a` }]}>
            <MaterialIcons name={resetMethod === 'phone' ? 'sms' : 'mark-email-read'} size={40} color={theme.colors.primary} />
          </View>
          <Text style={[styles.title, { color: theme.colors.text }]}>Verification Code</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            OTP has been sent to{' '}
            <Text style={{ fontWeight: '600', color: theme.colors.text }}>{destination}</Text>
          </Text>

          <View style={styles.otpRow}>
            {digits.map((d, i) => (
              <TextInput
                key={i}
                ref={(r) => { inputs.current[i] = r; }}
                style={[
                  styles.otpInput,
                  {
                    borderColor: d ? theme.colors.primary : theme.colors.slate200,
                    backgroundColor: theme.colors.card,
                    color: theme.colors.text,
                  },
                ]}
                value={d}
                onChangeText={(t) => handleChange(t, i)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                accessibilityLabel={`OTP digit ${i + 1}`}
              />
            ))}
          </View>

          <View style={styles.resendBlock}>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>Didn't receive OTP?</Text>
            {canResend ? (
              <TouchableOpacity onPress={resend} disabled={resending}>
                <Text style={{ color: theme.colors.primary, fontWeight: '700', fontSize: 14 }}>
                  {resending ? 'Sending...' : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.timerRow}>
                <MaterialIcons name="timer" size={18} color={theme.colors.primary} />
                <Text style={{ color: theme.colors.primary, fontWeight: '600', fontSize: 14 }}>Resend ({secondsLeft}s)</Text>
              </View>
            )}
          </View>

          <Button title="VERIFY" onPress={handleVerify} loading={loading} icon="arrow-forward" style={{ marginTop: 24 }} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  nav: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 8, borderBottomWidth: 1 },
  navBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  navTitle: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  content: { padding: 24, alignItems: 'center', flex: 1 },
  iconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginTop: 24, marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 32, lineHeight: 22, paddingHorizontal: 8 },
  otpRow: { flexDirection: 'row', gap: 10 },
  otpInput: { width: 48, height: 56, borderWidth: 2, borderRadius: 10, textAlign: 'center', fontSize: 20, fontWeight: '700' },
  resendBlock: { alignItems: 'center', gap: 8, marginTop: 28 },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
