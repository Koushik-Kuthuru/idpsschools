import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './client';
import { STORAGE_KEYS } from '@/constants/config';

async function schoolParams() {
  const sessionSchool = await AsyncStorage.getItem(STORAGE_KEYS.SCHOOL_ID);
  const selectedBranch = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_BRANCH);
  const schoolId = sessionSchool?.trim() || selectedBranch?.trim() || 'idpscherukupalli';
  return new URLSearchParams({ schoolId });
}

/** Student Settings override — when set, all portal GETs/POSTs scope data to this year. */
export async function getSelectedAcademicYear(): Promise<string | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_ACADEMIC_YEAR);
  const year = raw?.trim() || '';
  return year || null;
}

async function withAcademicYear(search: URLSearchParams, params?: Record<string, string>) {
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  if (!search.get('academicYear')) {
    const year = await getSelectedAcademicYear();
    if (year) search.set('academicYear', year);
  }
  return search;
}

export async function portalGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const search = await withAcademicYear(await schoolParams(), params);
  const { data } = await apiClient.get<T>(`${path}?${search.toString()}`);
  return data;
}

export async function portalPost<T>(path: string, body: unknown, params?: Record<string, string>): Promise<T> {
  const search = await withAcademicYear(await schoolParams(), params);
  const year = search.get('academicYear');
  const payload =
    year && body && typeof body === 'object' && !Array.isArray(body) && !('academicYear' in (body as object))
      ? { ...(body as Record<string, unknown>), academicYear: year }
      : body;
  const { data } = await apiClient.post<T>(`${path}?${search.toString()}`, payload);
  return data;
}
