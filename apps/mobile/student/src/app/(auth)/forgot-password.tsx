import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  forgotPasswordEmailSchema,
  forgotPasswordPhoneSchema,
  normalizeIndianPhone,
  type ForgotPasswordEmailForm,
  type ForgotPasswordPhoneForm,
} from '@/utils/validation';
import { authService } from '@/services/api';
import { useAuthStore } from '@/store';

type ResetMethod = 'email' | 'phone';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const setResetContact = useAuthStore((s) => s.setResetContact);
  const [method, setMethod] = useState<ResetMethod>('email');
  const [loading, setLoading] = useState(false);

  const emailForm = useForm<ForgotPasswordEmailForm>({
    resolver: zodResolver(forgotPasswordEmailSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: { email: '' },
  });

  const phoneForm = useForm<ForgotPasswordPhoneForm>({
    resolver: zodResolver(forgotPasswordPhoneSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: { phone: '' },
  });

  const sendOtp = async (
    payload: { email?: string; phone?: string },
    contact: { method: ResetMethod; email?: string; phone?: string }
  ) => {
    setLoading(true);
    try {
      await authService.forgotPassword(payload);
      setResetContact(contact);
      Alert.alert('OTP Sent', 'A verification code has been sent. Please check your messages.');
      router.push('/(auth)/otp');
    } catch {
      Alert.alert('Request Failed', 'Could not send verification code. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const onEmailSubmit = (data: ForgotPasswordEmailForm) =>
    sendOtp({ email: data.email.trim() }, { method: 'email', email: data.email.trim() });

  const onPhoneSubmit = (data: ForgotPasswordPhoneForm) => {
    const normalized = normalizeIndianPhone(data.phone);
    const displayPhone = data.phone.trim() || `+91 ${normalized}`;
    sendOtp({ phone: normalized }, { method: 'phone', phone: displayPhone });
  };

  const onEmailInvalid = () => {
    const msg = emailForm.formState.errors.email?.message;
    if (msg) Alert.alert('Validation', msg);
  };

  const onPhoneInvalid = () => {
    const msg = phoneForm.formState.errors.phone?.message;
    if (msg) Alert.alert('Validation', msg);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.nav, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity style={styles.navBtn} onPress={() => router.back()} accessibilityLabel="Go back">
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: theme.colors.text }]}>FORGOT PASSWORD</Text>
          <View style={styles.navBtn} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="always">
          <View style={[styles.iconWrap, { backgroundColor: `${theme.colors.primary}1a` }]}>
            <MaterialIcons name="lock-reset" size={48} color={theme.colors.primary} />
          </View>
          <Text style={[styles.title, { color: theme.colors.text }]}>Reset your password</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Choose how you'd like to receive your verification code. We'll guide you through creating a new password.
          </Text>

          <View style={[styles.tabs, { backgroundColor: `${theme.colors.primary}0d` }]}>
            {(['email', 'phone'] as ResetMethod[]).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.tab, method === m && { backgroundColor: theme.colors.card }]}
                onPress={() => setMethod(m)}
              >
                <MaterialIcons
                  name={m === 'email' ? 'email' : 'phone-android'}
                  size={18}
                  color={method === m ? theme.colors.primary : theme.colors.textMuted}
                />
                <Text
                  style={{
                    color: method === m ? theme.colors.text : theme.colors.textMuted,
                    fontWeight: method === m ? '700' : '500',
                    fontSize: 13,
                  }}
                >
                  {m === 'email' ? 'Email' : 'Mobile'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {method === 'email' ? (
            <View key="email-form">
              <Controller
                control={emailForm.control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Email Address"
                    icon="email"
                    placeholder="user@school.com"
                    value={value ?? ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={emailForm.formState.isSubmitted ? emailForm.formState.errors.email?.message : undefined}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    editable
                  />
                )}
              />
              <Button
                title="SEND OTP"
                onPress={emailForm.handleSubmit(onEmailSubmit, onEmailInvalid)}
                loading={loading}
                flat
                style={{ marginTop: 24 }}
              />
            </View>
          ) : (
            <View key="phone-form">
              <Controller
                control={phoneForm.control}
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Mobile Number"
                    icon="phone"
                    placeholder="9876543210"
                    value={value ?? ''}
                    onChangeText={(text) => onChange(text)}
                    onBlur={onBlur}
                    error={phoneForm.formState.isSubmitted ? phoneForm.formState.errors.phone?.message : undefined}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                    maxLength={14}
                    editable
                  />
                )}
              />
              <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
                Enter your 10-digit Indian mobile number. OTP will be sent via SMS.
              </Text>
              <Button
                title="SEND OTP"
                onPress={phoneForm.handleSubmit(onPhoneSubmit, onPhoneInvalid)}
                loading={loading}
                flat
                style={{ marginTop: 24 }}
              />
            </View>
          )}

          <TouchableOpacity style={styles.backLogin} onPress={() => router.replace('/(auth)/login')}>
            <MaterialIcons name="arrow-back" size={18} color={theme.colors.primary} />
            <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>Back to Login</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  nav: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 8, borderBottomWidth: 1 },
  navBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  navTitle: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  scroll: { padding: 24, paddingBottom: 48, flexGrow: 1 },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  tabs: { flexDirection: 'row', padding: 4, borderRadius: 12, marginBottom: 24 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 10 },
  hint: { fontSize: 12, marginTop: 8, lineHeight: 18 },
  backLogin: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 32 },
});
