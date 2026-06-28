import { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { loginSchema, type LoginForm } from '@/utils/validation';
import type { FieldErrors } from 'react-hook-form';
import { useAuthStore } from '@/store';

const LOGO_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBNfSxRmmVCjqEMXCEtb8FoX6yTQbN3_YBDN9PNu9kJE4Jq9znHo3pMqH82l7cYDwD_Mx8dhmNyc0Yd8q2HpYNr57ctYyC76LiYmiH1k73JuDX8i6RUE7b4hai38DMKMQtdirR7RVJpbIr-GLTE-TVJnGqD_Vh9BxEPcGzDYjTT_-alDZMoQc-KWh1Dix8D83-6Y_heqq625PbH9TttSi6--N1pTjkb_VVxSrt0MFEDFvEVm5fuZmTOPyvF4zxFMN0EcUQ9tfSjfYif';

export default function LoginScreen() {
  const theme = useTheme();
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      await login(data.email.trim(), data.password);
      router.replace('/(tabs)');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert(
        'Login Failed',
        message.includes('credentials') || message.includes('Invalid')
          ? 'Invalid Student ID or password.'
          : `Could not sign in: ${message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const onInvalid = (formErrors: FieldErrors<LoginForm>) => {
    const firstError = formErrors.email?.message ?? formErrors.password?.message;
    if (firstError) Alert.alert('Validation', String(firstError));
  };

  const pageBg = theme.colors.card;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: pageBg }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={[styles.flex, { backgroundColor: pageBg }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <View style={[styles.brandIcon, { backgroundColor: `${theme.colors.primary}1a` }]}>
            <Text style={[styles.brandText, { color: theme.colors.primary }]}>IDPS</Text>
          </View>
          <Text style={[styles.brandName, { color: theme.colors.text }]}>ERP</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={[styles.logoCircle, { backgroundColor: `${theme.colors.primary}0d` }]}>
              <Image source={{ uri: LOGO_URI }} style={styles.logo} resizeMode="contain" accessibilityLabel="School logo" />
            </View>
            <Text style={[styles.welcome, { color: theme.colors.text }]}>🎓 Welcome Back!</Text>
            <Text style={[styles.welcomeSub, { color: theme.colors.textSecondary }]}>
              Sign in to continue to your dashboard
            </Text>
          </View>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Student ID"
                icon="person"
                placeholder="e.g. STU001"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                accessibilityLabel="Email or username"
              />
            )}
          />

          <View style={styles.fieldGap} />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Password"
                icon="lock"
                placeholder="••••••••"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                isPassword
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword(!showPassword)}
                autoComplete="password"
                accessibilityLabel="Password"
              />
            )}
          />

          <View style={styles.actions}>
            <Controller
              control={control}
              name="rememberMe"
              render={({ field: { onChange, value } }) => (
                <TouchableOpacity
                  style={styles.remember}
                  onPress={() => onChange(!value)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: !!value }}
                >
                  <MaterialIcons name={value ? 'check-box' : 'check-box-outline-blank'} size={22} color={theme.colors.primary} />
                  <Text style={[styles.rememberText, { color: theme.colors.textSecondary }]}>Remember me</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.forgot}
              onPress={() => router.push('/(auth)/forgot-password')}
              accessibilityLabel="Forgot password"
            >
              <Text style={[styles.forgotText, { color: theme.colors.primary }]}>Forgot Password?</Text>
              <MaterialIcons name="east" size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          <Button
            title="SIGN IN"
            onPress={handleSubmit(onSubmit, onInvalid)}
            loading={loading}
            icon="east"
            flat
            style={{ marginTop: 8 }}
          />
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: pageBg }]}>
          <View style={styles.dividerRow}>
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <Text style={[styles.dividerText, { color: theme.colors.textMuted, backgroundColor: pageBg }]}>
              HELP & SUPPORT
            </Text>
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          </View>
          <Text style={[styles.contact, { color: theme.colors.textSecondary }]}>
            Don't have account? <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>Contact Admin</Text>
          </Text>
        </View>

        <View style={[styles.accentBar, { backgroundColor: theme.colors.primary }]} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, width: '100%' },
  flex: { flex: 1, width: '100%' },
  scroll: { flex: 1, width: '100%' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  brandIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  brandText: { fontSize: 10, fontWeight: '700' },
  brandName: { fontSize: 16, fontWeight: '700' },
  content: {
    paddingHorizontal: 32,
    paddingBottom: 16,
    flexGrow: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  hero: { alignItems: 'center', marginBottom: 28, paddingTop: 8 },
  logoCircle: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  logo: { width: 80, height: 80 },
  welcome: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  welcomeSub: { fontSize: 14, textAlign: 'center' },
  fieldGap: { height: 16 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  remember: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rememberText: { fontSize: 14 },
  forgot: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  forgotText: { fontSize: 14, fontWeight: '500' },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 20,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  divider: { flex: 1, height: 1 },
  dividerText: { paddingHorizontal: 12, fontSize: 10, letterSpacing: 2 },
  contact: { textAlign: 'center', fontSize: 14 },
  accentBar: { height: 4, width: '100%', opacity: 0.6 },
});
