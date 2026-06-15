import React, { useRef } from 'react';

import { View, Text, TextInput, Alert } from 'react-native';

import { useForm, Controller } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';

import { z } from 'zod';

import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton, AppHeader } from '@/components';

import { useAuthStore } from '@/store';

import { textStyle } from '@/theme';

import { styles } from './VerifyOtpScreen.styles';

import type { VerifyOtpScreenProps } from './VerifyOtpScreen.types';



const otpSchema = z.object({

  otp: z.string().length(6, 'Enter the 6-digit code'),

});



type OtpForm = z.infer<typeof otpSchema>;



export function VerifyOtpScreen({ navigation, route }: VerifyOtpScreenProps) {

  const verifyOtp = useAuthStore((s) => s.verifyOtp);

  const verifyResetOtp = useAuthStore((s) => s.verifyResetOtp);

  const isLoading = useAuthStore((s) => s.isLoading);

  const refs = useRef<(TextInput | null)[]>([]);

  const flow = route.params?.flow ?? 'login';

  const isResetFlow = flow === 'reset';



  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<OtpForm>({

    resolver: zodResolver(otpSchema),

    defaultValues: { otp: '' },

  });



  const otp = watch('otp');



  const onDigit = (index: number, char: string) => {

    const digits = otp.padEnd(6, ' ').split('');

    digits[index] = char.slice(-1);

    const next = digits.join('').replace(/\s/g, '').slice(0, 6);

    setValue('otp', next, { shouldValidate: true });

    if (char && index < 5) refs.current[index + 1]?.focus();

  };



  const onSubmit = async (data: OtpForm) => {

    try {

      if (isResetFlow) {

        await verifyResetOtp(data.otp);

        navigation.navigate('ResetPassword');

        return;

      }

      await verifyOtp(data.otp);

    } catch {

      Alert.alert('Invalid OTP', 'Please enter a valid 6-digit code and try again.');

    }

  };



  const email = route.params?.email ?? 'your email';



  return (

    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>

      <AppHeader

        variant="back"

        title={isResetFlow ? 'Verify Reset OTP' : 'Verify OTP'}

        showBack

      />

      <View style={styles.body}>

        <Text style={[textStyle('bodyMd'), styles.subtitle]}>

          {isResetFlow

            ? `Enter the 6-digit reset code sent to ${email}`

            : `Enter the 6-digit code sent to ${email}`}

        </Text>

        <Controller

          control={control}

          name="otp"

          render={() => (

            <View style={styles.otpRow}>

              {[0, 1, 2, 3, 4, 5].map((i) => (

                <TextInput

                  key={i}

                  ref={(r) => { refs.current[i] = r; }}

                  style={[styles.otpBox, otp[i] ? styles.otpBoxFocused : null]}

                  value={otp[i] ?? ''}

                  onChangeText={(t) => onDigit(i, t)}

                  keyboardType="number-pad"

                  maxLength={1}

                  selectTextOnFocus

                />

              ))}

            </View>

          )}

        />

        {errors.otp ? <Text style={[textStyle('labelSm'), styles.errorText]}>{errors.otp.message}</Text> : null}

        <AppButton

          label={isResetFlow ? 'Verify OTP' : 'Verify & Continue'}

          onPress={handleSubmit(onSubmit)}

          loading={isLoading}

        />

        <View style={styles.resend}>

          <Text style={[textStyle('labelLg'), styles.resendText]}>Resend code</Text>

        </View>

      </View>

    </SafeAreaView>

  );

}


