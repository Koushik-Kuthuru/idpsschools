import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  SplashScreen,
  TeacherLoginScreen,
  ForgotPasswordScreen,
  VerifyOtpScreen,
  ResetPasswordScreen,
} from '@/screens';
import type { AuthStackParamList } from '@/types/navigation';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' as const }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="TeacherLogin" component={TeacherLoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}
