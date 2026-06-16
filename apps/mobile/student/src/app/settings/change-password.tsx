import { useState, useMemo } from 'react';
import { ScrollView, View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { changePasswordSchema, type ChangePasswordForm, getPasswordStrength } from '@/utils/validation';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button } from '@/components/ui/Button';
import { cardShadow } from '@/constants/shadows';

export default function ChangePasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [logoutDevices, setLogoutDevices] = useState(false);
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, watch, formState: { errors } } = useForm<ChangePasswordForm & { logoutDevices?: boolean }>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', password: '', confirmPassword: '' },
  });

  const password = watch('password');
  const strength = getPasswordStrength(password);

  const requirements = useMemo(
    () => [
      { label: 'At least 8 characters', met: password.length >= 8 },
      { label: 'Mix of letters & numbers', met: /[A-Za-z]/.test(password) && /[0-9]/.test(password) },
      { label: 'Special character', met: /[^A-Za-z0-9]/.test(password) },
    ],
    [password],
  );

  const onSubmit = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Success', 'Password updated successfully', [{ text: 'OK', onPress: () => router.back() }]);
    }, 800);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <ScreenHeader title="Change password" fallbackRoute="/settings" />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[styles.heroCard, cardShadow]}>
          <View style={styles.heroIcon}>
            <Ionicons name="shield-checkmark" size={28} color="#144835" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>ACCOUNT SECURITY</Text>
            <Text style={styles.heroTitle}>Update password</Text>
            <Text style={styles.heroSub}>Use a strong password you don't use elsewhere</Text>
          </View>
        </View>

        <SectionHeader title="Password details" />
        <View style={[styles.formCard, cardShadow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <PasswordField label="Current password" control={control} name="currentPassword" error={errors.currentPassword?.message} show={showCurrent} onToggle={() => setShowCurrent(!showCurrent)} theme={theme} />
          <PasswordField label="New password" control={control} name="password" error={errors.password?.message} show={showNew} onToggle={() => setShowNew(!showNew)} theme={theme} placeholder="Enter new password" />

          <View style={[styles.reqBox, { backgroundColor: `${theme.colors.primary}08`, borderColor: theme.colors.border }]}>
            <Text style={[styles.reqTitle, { color: theme.colors.textMuted }]}>Security requirements</Text>
            {requirements.map((r) => (
              <View key={r.label} style={styles.reqRow}>
                <Ionicons name={r.met ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={r.met ? theme.colors.primary : theme.colors.textMuted} />
                <Text style={{ color: r.met ? theme.colors.primary : theme.colors.textSecondary, fontSize: 13, fontWeight: r.met ? '600' : '400' }}>{r.label}</Text>
              </View>
            ))}
          </View>

          <PasswordField label="Confirm password" control={control} name="confirmPassword" error={errors.confirmPassword?.message} show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} theme={theme} placeholder="Re-enter new password" />

          <View style={styles.strengthBlock}>
            <View style={styles.strengthHeader}>
              <Text style={{ color: theme.colors.text, fontWeight: '600' }}>Password strength</Text>
              <Text style={{ color: theme.colors.primary, fontWeight: '800' }}>{strength.label}</Text>
            </View>
            <View style={[styles.strengthTrack, { backgroundColor: theme.colors.border }]}>
              <View style={[styles.strengthFill, { width: `${strength.score}%`, backgroundColor: theme.colors.primary }]} />
            </View>
          </View>

          <TouchableOpacity style={styles.checkRow} onPress={() => setLogoutDevices(!logoutDevices)} activeOpacity={0.75}>
            <Ionicons name={logoutDevices ? 'checkbox' : 'square-outline'} size={22} color={theme.colors.primary} />
            <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '500' }}>Sign out all devices after change</Text>
          </TouchableOpacity>
        </View>

        <Button title="Update password" onPress={handleSubmit(onSubmit)} loading={loading} style={{ marginTop: 4 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function PasswordField({
  label,
  control,
  name,
  error,
  show,
  onToggle,
  theme,
  placeholder,
}: {
  label: string;
  control: ReturnType<typeof useForm<ChangePasswordForm>>['control'];
  name: keyof ChangePasswordForm;
  error?: string;
  show: boolean;
  onToggle: () => void;
  theme: ReturnType<typeof useTheme>;
  placeholder?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={[styles.inputWrap, { borderColor: error ? theme.colors.red500 : theme.colors.border, backgroundColor: theme.colors.background }]}>
            <TextInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry={!show}
              placeholder={placeholder}
              placeholderTextColor={theme.colors.textMuted}
              style={[styles.input, { color: theme.colors.text }]}
            />
            <TouchableOpacity onPress={onToggle} style={styles.eyeBtn}>
              <Ionicons name={show ? 'eye-outline' : 'eye-off-outline'} size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}
      />
      {error ? <Text style={[styles.error, { color: theme.colors.red500 }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 32 },
  heroCard: {
    backgroundColor: '#144835',
    borderRadius: 16,
    padding: 20,
    marginTop: 4,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#a2c144', alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1 },
  heroEyebrow: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 4 },
  heroSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4, lineHeight: 17 },
  formCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, height: 52 },
  input: { flex: 1, paddingHorizontal: 14, fontSize: 15, height: '100%' },
  eyeBtn: { paddingHorizontal: 14 },
  error: { fontSize: 12, marginTop: 4 },
  reqBox: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  reqTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase' },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  strengthBlock: { marginBottom: 16 },
  strengthHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  strengthTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  strengthFill: { height: '100%', borderRadius: 4 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
