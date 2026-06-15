import { useState, useMemo } from 'react';
import { ScrollView, View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { changePasswordSchema, type ChangePasswordForm, getPasswordStrength } from '@/utils/validation';
import { Button } from '@/components/ui/Button';

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

  const requirements = useMemo(() => [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Mix of letters & numbers', met: /[A-Za-z]/.test(password) && /[0-9]/.test(password) },
    { label: 'Special character', met: /[^A-Za-z0-9]/.test(password) },
  ], [password]);

  const onSubmit = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Success', 'Password updated successfully', [{ text: 'OK', onPress: () => router.back() }]);
    }, 800);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Change Password</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.replace('/(tabs)/profile')}>
          <MaterialIcons name="close" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
          Ensure your account is secure by using a strong password that you don't use elsewhere.
        </Text>

        <PasswordField label="Current Password" control={control} name="currentPassword" error={errors.currentPassword?.message} show={showCurrent} onToggle={() => setShowCurrent(!showCurrent)} theme={theme} />
        <PasswordField label="New Password" control={control} name="password" error={errors.password?.message} show={showNew} onToggle={() => setShowNew(!showNew)} theme={theme} placeholder="Enter new password" />

        <View style={[styles.reqBox, { backgroundColor: `${theme.colors.primary}0d` }]}>
          <Text style={[styles.reqTitle, { color: theme.colors.textMuted }]}>SECURITY REQUIREMENTS</Text>
          {requirements.map((r) => (
            <View key={r.label} style={styles.reqRow}>
              <MaterialIcons name={r.met ? 'check-circle' : 'radio-button-unchecked'} size={18} color={r.met ? theme.colors.primary : theme.colors.textMuted} />
              <Text style={{ color: r.met ? theme.colors.primary : theme.colors.textSecondary, fontSize: 14, fontWeight: r.met ? '600' : '400' }}>{r.label}</Text>
            </View>
          ))}
        </View>

        <PasswordField label="Confirm Password" control={control} name="confirmPassword" error={errors.confirmPassword?.message} show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} theme={theme} placeholder="Re-enter new password" />

        <View style={styles.strengthBlock}>
          <View style={styles.strengthHeader}>
            <Text style={{ color: theme.colors.text, fontWeight: '500' }}>Password strength</Text>
            <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>{strength.label}</Text>
          </View>
          <View style={[styles.strengthTrack, { backgroundColor: theme.colors.slate200 }]}>
            <View style={[styles.strengthFill, { width: `${strength.score}%`, backgroundColor: theme.colors.primary }]} />
          </View>
        </View>

        <TouchableOpacity style={styles.checkRow} onPress={() => setLogoutDevices(!logoutDevices)}>
          <MaterialIcons name={logoutDevices ? 'check-box' : 'check-box-outline-blank'} size={24} color={theme.colors.primary} />
          <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '500' }}>Logout all devices after change</Text>
        </TouchableOpacity>

        <Button title="Update Password" onPress={handleSubmit(onSubmit)} loading={loading} style={{ marginTop: 8 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function PasswordField({ label, control, name, error, show, onToggle, theme, placeholder }: {
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
          <View style={[styles.inputWrap, { borderColor: error ? theme.colors.red500 : theme.colors.slate200, backgroundColor: theme.colors.card }]}>
            <TextInputStyled value={value} onChangeText={onChange} onBlur={onBlur} secureTextEntry={!show} placeholder={placeholder} theme={theme} />
            <TouchableOpacity onPress={onToggle} style={styles.eyeBtn}>
              <MaterialIcons name={show ? 'visibility' : 'visibility-off'} size={22} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

function TextInputStyled({ value, onChangeText, onBlur, secureTextEntry, placeholder, theme }: {
  value: string;
  onChangeText: (t: string) => void;
  onBlur: () => void;
  secureTextEntry?: boolean;
  placeholder?: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      onBlur={onBlur}
      secureTextEntry={secureTextEntry}
      placeholder={placeholder}
      placeholderTextColor={theme.colors.textMuted}
      style={[styles.input, { color: theme.colors.text }]}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 8, borderBottomWidth: 1 },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scroll: { padding: 16, paddingBottom: 100 },
  hint: { fontSize: 14, lineHeight: 22, marginBottom: 20 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, height: 56 },
  input: { flex: 1, paddingHorizontal: 16, fontSize: 16, height: '100%' },
  eyeBtn: { paddingHorizontal: 14 },
  error: { color: '#ef4444', fontSize: 12, marginTop: 4 },
  reqBox: { padding: 16, borderRadius: 12, marginBottom: 16 },
  reqTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  strengthBlock: { marginBottom: 16 },
  strengthHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  strengthTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  strengthFill: { height: '100%', borderRadius: 4 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
});
