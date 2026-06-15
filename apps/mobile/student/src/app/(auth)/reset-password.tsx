import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/charts/ProgressChart';
import {
  resetPasswordSchema,
  type ResetPasswordForm,
  getPasswordStrength,
  getPasswordRequirements,
} from '@/utils/validation';
import { authService } from '@/services/api';

export default function ResetPasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, watch, formState: { errors } } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const password = watch('password');
  const strength = getPasswordStrength(password);
  const requirements = useMemo(() => getPasswordRequirements(password), [password]);

  const onSubmit = async (data: ResetPasswordForm) => {
    setLoading(true);
    try {
      await authService.resetPassword(data.password);
      router.replace('/(auth)/reset-success');
    } catch {
      Alert.alert('Error', 'Could not reset password. Please try again.');
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
          <Text style={[styles.navTitle, { color: theme.colors.text }]}>CREATE NEW PASSWORD</Text>
          <View style={styles.navBtn} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: theme.colors.text }]}>Create a new password</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Your new password must be different from previously used passwords for your IDPS account.
          </Text>

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <Input
                  label="New Password"
                  icon="lock"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  isPassword
                  showPassword={showPass}
                  onTogglePassword={() => setShowPass(!showPass)}
                />
                <View style={styles.strengthRow}>
                  <View style={{ flex: 1 }}>
                    <ProgressBar percent={strength.score} height={6} />
                  </View>
                  <Text style={[styles.strengthLabel, { color: theme.colors.primary }]}>{strength.label}</Text>
                </View>
              </>
            )}
          />

          <View style={{ height: 16 }} />
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Confirm Password"
                icon="lock-outline"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.confirmPassword?.message}
                isPassword
                showPassword={showConfirm}
                onTogglePassword={() => setShowConfirm(!showConfirm)}
              />
            )}
          />

          <View style={[styles.requirements, { backgroundColor: `${theme.colors.primary}0d`, borderColor: `${theme.colors.primary}1a` }]}>
            <Text style={[styles.reqTitle, { color: theme.colors.text }]}>Password must contain:</Text>
            {requirements.map((r) => (
              <View key={r.label} style={styles.reqRow}>
                <MaterialIcons
                  name={r.met ? 'check-circle' : 'radio-button-unchecked'}
                  size={16}
                  color={r.met ? theme.colors.primary : theme.colors.textMuted}
                />
                <Text style={{ color: r.met ? theme.colors.primary : theme.colors.textSecondary, fontSize: 12 }}>{r.label}</Text>
              </View>
            ))}
          </View>

          <Button title="UPDATE PASSWORD" onPress={handleSubmit(onSubmit)} loading={loading} style={{ marginTop: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  nav: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 8, borderBottomWidth: 1 },
  navBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  navTitle: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  content: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 22, marginBottom: 24 },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8, marginBottom: 8 },
  strengthLabel: { fontSize: 12, fontWeight: '700', minWidth: 56 },
  requirements: { padding: 16, borderRadius: 12, borderWidth: 1, marginTop: 16 },
  reqTitle: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
});
