import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton, AppHeader, AppInput } from '@/components';
import { useAuthStore } from '@/store';
import { textStyle } from '@/theme';
import { styles } from './ResetPasswordScreen.styles';
import type { ResetPasswordScreenProps } from './ResetPasswordScreen.types';

const schema = z
  .object({
    password: z.string().min(8, 'At least 8 characters'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: 'Passwords must match', path: ['confirm'] });

type Form = z.infer<typeof schema>;

function strengthScore(pw: string) {
  let s = 0;
  if (pw.length >= 8) s += 25;
  if (/[A-Z]/.test(pw)) s += 25;
  if (/[0-9]/.test(pw)) s += 25;
  if (/[^A-Za-z0-9]/.test(pw)) s += 25;
  return s;
}

export function ResetPasswordScreen({ navigation }: ResetPasswordScreenProps) {
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const isLoading = useAuthStore((s) => s.isLoading);
  const { control, handleSubmit, watch, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirm: '' },
  });

  const password = watch('password');
  const score = strengthScore(password);
  const fillStyle = useMemo(
    () => StyleSheet.create({ fill: { width: `${score}%` } }).fill,
    [score],
  );
  const fillVariant =
    score < 50 ? styles.meterFillWeak : score < 75 ? styles.meterFillMid : styles.meterFillStrong;
  const label = score < 50 ? 'Weak' : score < 75 ? 'Fair' : 'Strong';

  const onSubmit = async (data: Form) => {
    try {
      await resetPassword(data.password);
      navigation.navigate('TeacherLogin', { passwordUpdated: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not update password';
      Alert.alert('Update Failed', message);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <AppHeader variant="back" title="Reset Password" showBack />
      <View style={styles.body}>
        <Text style={[textStyle('bodyMd'), styles.subtitle]}>Create a new secure password for your account.</Text>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInput
              label="New Password"
              icon="lock"
              showPasswordToggle
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
            />
          )}
        />
        <View>
          <View style={styles.strengthRow}>
            <Text style={[textStyle('labelSm'), styles.strengthText]}>Password strength</Text>
            <Text style={[textStyle('labelSm'), styles.strengthText]}>{label}</Text>
          </View>
          <View style={styles.meterTrack}>
            <View style={[fillVariant, fillStyle]} />
          </View>
          <Text style={[textStyle('labelSm'), styles.meterLabel]}>Use 8+ chars with numbers and symbols</Text>
        </View>
        <Controller
          control={control}
          name="confirm"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInput
              label="Confirm Password"
              icon="lock"
              showPasswordToggle
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.confirm?.message}
            />
          )}
        />
        <AppButton label="Update Password" onPress={handleSubmit(onSubmit)} loading={isLoading} />
      </View>
    </SafeAreaView>
  );
}
