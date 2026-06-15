/** @deprecated Import from userProfile.ts */
export {
  CURRENT_USER_EMAIL_KEY,
  clearCurrentUserEmail,
  getCurrentUserEmail,
  getMergedProfileForSession,
  getMergedUserProfile,
  getUserPassword,
  saveUserProfile,
  setCurrentUserEmail,
  updateUserAvatar,
  updateUserPassword,
} from './userProfile';

import {
  getMergedProfileForSession,
  getUserPassword,
  saveUserProfile,
  updateUserAvatar,
  updateUserPassword,
} from './userProfile';
import { MOCK_USER_ACCOUNTS } from './mockData';

/** @deprecated Use getMergedUserProfile(email) */
export async function getMergedTeacherProfile() {
  return getMergedProfileForSession();
}

/** @deprecated Use saveUserProfile */
export async function saveTeacherProfile(user: Parameters<typeof saveUserProfile>[0]) {
  return saveUserProfile(user);
}

/** @deprecated Use updateUserAvatar(email, uri) */
export async function updateTeacherAvatar(uri: string) {
  const user = await getMergedProfileForSession();
  return updateUserAvatar(user.email, uri);
}

/** @deprecated Use getUserPassword(email) */
export async function getTeacherPassword() {
  const email = MOCK_USER_ACCOUNTS[0].email;
  return getUserPassword(email);
}

/** @deprecated Use updateUserPassword(email, password) */
export async function updateTeacherPassword(password: string) {
  const user = await getMergedProfileForSession();
  return updateUserPassword(user.email, password);
}
