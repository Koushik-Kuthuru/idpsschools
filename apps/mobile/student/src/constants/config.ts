import type { ImageSourcePropType } from 'react-native';
import { resolveApiBaseUrl } from '@/lib/resolveApiBaseUrl';

export const APP_NAME = 'IDPS STUDENT';
export const APP_SUBTITLE = 'Student Portal';
export const SCHOOL_NAME = 'International Delhi Public School';
export const SCHOOL_LOGO = require('../../assets/images/idps-logo.png') as ImageSourcePropType;
export const SCHOOL_LOGO_URI = `${resolveApiBaseUrl()}/idps-logo.png`;
export const API_BASE_URL = resolveApiBaseUrl();
export const MOCK_API_DELAY = 600;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  THEME: 'theme',
  OFFLINE_QUEUE: 'offline_queue',
  NOTIFICATIONS_READ: 'notifications_read',
  HOMEWORK_SEEN: 'homework_seen',
  FEES_STATE: 'fees_state',
  SCHOOL_ID: 'school_id',
  SELECTED_BRANCH: 'selected_branch',
  SELECTED_BRANCH_NAME: 'selected_branch_name',
  APP_SETTINGS: 'app_settings',
  /** Student-selected academic year override (e.g. 2025-26). Empty = school current year. */
  SELECTED_ACADEMIC_YEAR: 'selected_academic_year',
} as const;
