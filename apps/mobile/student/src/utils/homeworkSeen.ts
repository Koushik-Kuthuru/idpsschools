import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/config';

export async function getSeenHomeworkIds(): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.HOMEWORK_SEEN);
  if (!raw) return new Set();
  try {
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export async function markHomeworkIdsSeen(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const seen = await getSeenHomeworkIds();
  ids.forEach((id) => seen.add(id));
  await AsyncStorage.setItem(STORAGE_KEYS.HOMEWORK_SEEN, JSON.stringify([...seen]));
}
