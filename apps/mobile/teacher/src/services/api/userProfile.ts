import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMockAccountByEmail, getMockUserByEmail } from './mockData';
import type { StaffUser } from '@/types';

export const CURRENT_USER_EMAIL_KEY = 'current_user_email';

const userProfileKey = (email: string) => `user_profile_${email.trim().toLowerCase()}`;
const userPasswordKey = (email: string) => `user_password_${email.trim().toLowerCase()}`;

export async function getCurrentUserEmail(): Promise<string | null> {
  return AsyncStorage.getItem(CURRENT_USER_EMAIL_KEY);
}

export async function setCurrentUserEmail(email: string): Promise<void> {
  await AsyncStorage.setItem(CURRENT_USER_EMAIL_KEY, email.trim().toLowerCase());
}

export async function clearCurrentUserEmail(): Promise<void> {
  await AsyncStorage.removeItem(CURRENT_USER_EMAIL_KEY);
}

export async function getMergedUserProfile(email: string): Promise<StaffUser> {
  const base = getMockUserByEmail(email);
  if (!base) throw new Error('User not found');

  const raw = await AsyncStorage.getItem(userProfileKey(email));
  if (!raw) return { ...base };

  try {
    const stored = JSON.parse(raw) as Partial<StaffUser>;
    return { ...base, ...stored };
  } catch {
    return { ...base };
  }
}

export async function getMergedProfileForSession(): Promise<StaffUser> {
  const email = await getCurrentUserEmail();
  if (!email) throw new Error('No active session');
  return getMergedUserProfile(email);
}

export async function saveUserProfile(user: StaffUser): Promise<StaffUser> {
  await AsyncStorage.setItem(userProfileKey(user.email), JSON.stringify(user));
  return user;
}

export async function updateUserAvatar(email: string, uri: string): Promise<StaffUser> {
  const current = await getMergedUserProfile(email);
  return saveUserProfile({ ...current, avatarUrl: uri });
}

export async function updateUserName(email: string, name: string): Promise<StaffUser> {
  const current = await getMergedUserProfile(email);
  return saveUserProfile({ ...current, name: name.trim() });
}

export async function getUserPassword(email: string): Promise<string> {
  const stored = await AsyncStorage.getItem(userPasswordKey(email));
  if (stored) return stored;
  const account = getMockAccountByEmail(email);
  return account?.password ?? '';
}

export async function updateUserPassword(email: string, password: string): Promise<void> {
  await AsyncStorage.setItem(userPasswordKey(email), password);
}
