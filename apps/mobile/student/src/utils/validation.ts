import { z } from 'zod';

/** Normalized digits only: optional 91 prefix + 10-digit Indian mobile */
export function normalizeIndianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

export function isValidIndianPhone(phone: string): boolean {
  const normalized = normalizeIndianPhone(phone);
  return /^[6-9]\d{9}$/.test(normalized);
}

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .trim()
    .pipe(z.string().email('Invalid email')),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

export const forgotPasswordEmailSchema = z.object({
  email: z.string().min(1, 'Email is required').trim().email('Enter a valid email address'),
});

export const forgotPasswordPhoneSchema = z.object({
  phone: z
    .string()
    .min(1, 'Mobile number is required')
    .refine((v) => isValidIndianPhone(v), 'Enter a valid 10-digit Indian mobile number'),
});

export const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must contain only numbers'),
});

const strongPassword = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Include at least one uppercase letter')
  .regex(/[0-9]/, 'Include at least one number')
  .regex(/[^A-Za-z0-9]/, 'Include at least one special character');

export const resetPasswordSchema = z
  .object({
    password: strongPassword,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const changePasswordSchema = resetPasswordSchema.extend({
  currentPassword: z.string().min(1, 'Current password is required'),
});

export type LoginForm = z.infer<typeof loginSchema>;
export type ForgotPasswordEmailForm = z.infer<typeof forgotPasswordEmailSchema>;
export type ForgotPasswordPhoneForm = z.infer<typeof forgotPasswordPhoneSchema>;
export type OtpForm = z.infer<typeof otpSchema>;
export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

/** @deprecated Use forgotPasswordEmailSchema */
export const forgotPasswordSchema = forgotPasswordEmailSchema;
export type ForgotPasswordForm = ForgotPasswordEmailForm;

export function getPasswordStrength(password: string): { score: number; label: string } {
  let score = 0;
  if (password.length >= 8) score += 25;
  if (/[A-Z]/.test(password)) score += 25;
  if (/[0-9]/.test(password)) score += 25;
  if (/[^A-Za-z0-9]/.test(password)) score += 25;
  const label = score >= 75 ? 'Strong' : score >= 50 ? 'Medium' : 'Weak';
  return { score, label };
}

export function getPasswordRequirements(password: string) {
  return [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
    { label: 'One special character', met: /[^A-Za-z0-9]/.test(password) },
  ];
}
