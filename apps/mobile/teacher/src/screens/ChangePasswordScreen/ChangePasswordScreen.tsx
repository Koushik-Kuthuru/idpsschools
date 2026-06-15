import React from 'react';
import { View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppButton, AppHeader, AppInput, ScreenLayout } from '@/components';
import type { RootStackParamList } from '@/types';
import { styles } from './ChangePasswordScreen.styles';
import type { ChangePasswordScreenProps } from './ChangePasswordScreen.types';

const schema = z
  .object({
    current: z.string().min(1, 'Required'),
    password: z.string().min(8, 'At least 8 characters'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: 'Passwords must match', path: ['confirm'] });

type Form = z.infer<typeof schema>;

export function ChangePasswordScreen(_props: ChangePasswordScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { control, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { current: '', password: '', confirm: '' },
  });

  return (
    <ScreenLayout scroll header={<AppHeader variant="back" title="Change Password" />}>
      <View style={styles.body}>
        <Controller
          control={control}
          name="current"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInput label="Current Password" icon="lock" showPasswordToggle value={value} onChangeText={onChange} onBlur={onBlur} error={errors.current?.message} />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInput label="New Password" icon="lock" showPasswordToggle value={value} onChangeText={onChange} onBlur={onBlur} error={errors.password?.message} />
          )}
        />
        <Controller
          control={control}
          name="confirm"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInput label="Confirm Password" icon="lock" showPasswordToggle value={value} onChangeText={onChange} onBlur={onBlur} error={errors.confirm?.message} />
          )}
        />
        <AppButton label="Update Password" onPress={handleSubmit(() => navigation.goBack())} />
      </View>
    </ScreenLayout>
  );
}
