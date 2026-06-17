import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { FieldErrors } from 'react-hook-form';
import { AppButton, AppInput } from '@/components';
import { stitchImages } from '@/assets/images';
import { useAuthStore } from '@/store';
import { colors } from '@/theme';
import { styles } from './TeacherLoginScreen.styles';
import type { TeacherLoginScreenProps } from './TeacherLoginScreen.types';

const loginSchema = z.object({
  email: z.string().min(1, 'Employee ID or email is required'),
  password: z.string().min(1, 'Please enter the password'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function TeacherLoginScreen({ navigation, route }: TeacherLoginScreenProps) {
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [loginError, setLoginError] = useState('');

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (route.params?.passwordUpdated) {
      Alert.alert('Password Updated', 'Please sign in with your new password.');
    }
  }, [route.params?.passwordUpdated]);

  const onSubmit = async (data: LoginForm) => {
    setLoginError('');
    try {
      await login(data.email.trim(), data.password);
      navigation.navigate('VerifyOtp', { email: data.email.trim(), flow: 'login' });
    } catch {
      const message = 'Invalid Employee ID or password.';
      setLoginError(message);
      Alert.alert('Login Failed', message);
    }
  };

  const onInvalid = (formErrors: FieldErrors<LoginForm>) => {
    const firstError = formErrors.email?.message ?? formErrors.password?.message;
    if (firstError) Alert.alert('Validation', String(firstError));
  };

  const pageBg = colors.surfaceContainerLowest;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: pageBg }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={[styles.flex, { backgroundColor: pageBg }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <View style={[styles.brandIcon, { backgroundColor: `${colors.primary}1a` }]}>
            <Text style={[styles.brandText, { color: colors.primary }]}>IDPS</Text>
          </View>
          <Text style={[styles.brandName, { color: colors.slate900 }]}>ERP</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={[styles.logoCircle, { backgroundColor: `${colors.primary}0d` }]}>
              <Image
                source={{ uri: stitchImages.loginLogo }}
                style={styles.logo}
                contentFit="contain"
                accessibilityLabel="School logo"
              />
            </View>
            <Text style={[styles.welcome, { color: colors.slate900 }]}>Welcome Back!</Text>
            <Text style={[styles.welcomeSub, { color: colors.slate500 }]}>
              Sign in to the staff portal dashboard
            </Text>
          </View>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Employee ID / Email"
                icon="badge"
                placeholder="Enter your ID"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            )}
          />

          <View style={styles.fieldGap} />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Password"
                icon="lock"
                placeholder="••••••••"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                showPasswordToggle
                error={errors.password?.message}
                autoComplete="password"
                returnKeyType="done"
                onSubmitEditing={handleSubmit(onSubmit, onInvalid)}
              />
            )}
          />

          <View style={styles.actions}>
            <TouchableOpacity style={styles.forgot} onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot Password?</Text>
              <MaterialIcons name="east" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {loginError ? <Text style={styles.loginError}>{loginError}</Text> : null}

          <AppButton
            label="SIGN IN"
            icon="east"
            onPress={handleSubmit(onSubmit, onInvalid)}
            loading={isLoading}
            flat
          />
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: pageBg }]}>
          <View style={styles.dividerRow}>
            <View style={[styles.divider, { backgroundColor: colors.slate100 }]} />
            <Text style={[styles.dividerText, { color: colors.slate400, backgroundColor: pageBg }]}>
              STAFF PORTAL
            </Text>
            <View style={[styles.divider, { backgroundColor: colors.slate100 }]} />
          </View>
          <Text style={[styles.contact, { color: colors.slate500 }]}>
            Need access? <Text style={{ color: colors.primary, fontWeight: '600' }}>Contact Admin</Text>
          </Text>
        </View>

        <View style={[styles.accentBar, { backgroundColor: colors.primary }]} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
