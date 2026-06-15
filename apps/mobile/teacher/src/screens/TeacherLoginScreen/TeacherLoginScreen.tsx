import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  type LayoutChangeEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton, AppIcon, AppInput } from '@/components';
import { stitchImages } from '@/assets/images';
import { SCHOOL_NAME } from '@/constants/school';
import { useAuthStore } from '@/store';
import { colors, textStyle } from '@/theme';
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
  const scrollRef = useRef<ScrollView>(null);
  const cardOffsetY = useRef(0);
  const fieldOffsets = useRef<Record<string, number>>({});

  const scrollToField = (key: string) => {
    const y = fieldOffsets.current[key];
    if (y == null) return;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 32), animated: true });
  };

  const trackCardLayout = (event: LayoutChangeEvent) => {
    cardOffsetY.current = event.nativeEvent.layout.y;
  };

  const trackFieldLayout = (key: string) => (event: LayoutChangeEvent) => {
    fieldOffsets.current[key] = cardOffsetY.current + event.nativeEvent.layout.y;
  };

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
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
      const message = 'Invalid email or password. Please try again.';
      setLoginError(message);
      Alert.alert('Login Failed', message);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <Image source={{ uri: stitchImages.loginLogo }} style={styles.logo} contentFit="contain" />
          </View>
          <Text style={[textStyle('headlineMd'), styles.school]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
            {SCHOOL_NAME}
          </Text>
          <Text style={[textStyle('labelLg'), styles.title]}>Management ERP Login</Text>
        </View>
        <View style={styles.card} onLayout={trackCardLayout}>
          <View onLayout={trackFieldLayout('email')}>
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
                  onFocus={() => scrollToField('email')}
                  error={errors.email?.message}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  returnKeyType="next"
                />
              )}
            />
          </View>
          <View onLayout={trackFieldLayout('password')}>
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
                  onFocus={() => scrollToField('password')}
                  showPasswordToggle
                  error={errors.password?.message}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit(onSubmit)}
                />
              )}
            />
          </View>
          <TouchableOpacity style={styles.forgot} onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={[textStyle('labelLg'), styles.forgotText]}>Forgot Password?</Text>
          </TouchableOpacity>
          {loginError ? (
            <Text style={[textStyle('labelSm'), styles.loginError]}>{loginError}</Text>
          ) : null}
          <AppButton label="LOGIN" icon="login" onPress={handleSubmit(onSubmit)} loading={isLoading} />
        </View>
        <View style={styles.footer}>
          <View style={styles.securityRow}>
            <AppIcon name="security" size={18} color={colors.outline} filled />
            <Text style={[textStyle('labelSm'), styles.securityText]}>Authorized personnel only</Text>
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
