import { useEffect, useState, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOfflineStore } from '@/store';

const CACHE_PREFIX = 'offline_cache:';
const PENDING_QUEUE_KEY = 'offline_pending_queue';

export interface PendingAction {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export function useNetworkStatus() {
  const setOffline = useOfflineStore((s) => s.setOffline);
  const [isConnected, setIsConnected] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const refreshPendingCount = useCallback(async () => {
    const raw = await AsyncStorage.getItem(PENDING_QUEUE_KEY);
    const queue: PendingAction[] = raw ? JSON.parse(raw) : [];
    setPendingCount(queue.length);
  }, []);

  const syncPending = useCallback(async () => {
    const raw = await AsyncStorage.getItem(PENDING_QUEUE_KEY);
    const queue: PendingAction[] = raw ? JSON.parse(raw) : [];
    if (queue.length === 0) return;

    setIsSyncing(true);
    await new Promise((r) => setTimeout(r, 1200));
    await AsyncStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify([]));
    setPendingCount(0);
    setIsSyncing(false);
  }, []);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state: NetInfoState) => {
      const connected = !!(state.isConnected && state.isInternetReachable !== false);
      setIsConnected(connected);
      setOffline(!connected);
      if (connected) void syncPending();
    });
    void refreshPendingCount();
    return () => unsub();
  }, [setOffline, syncPending, refreshPendingCount]);

  const cacheScreen = useCallback(async (key: string, data: unknown) => {
    await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify({ data, cachedAt: new Date().toISOString() }));
  }, []);

  const getCachedScreen = useCallback(async <T,>(key: string): Promise<T | null> => {
    const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;
    return JSON.parse(raw).data as T;
  }, []);

  const queueAction = useCallback(async (action: Omit<PendingAction, 'id' | 'createdAt'>) => {
    const raw = await AsyncStorage.getItem(PENDING_QUEUE_KEY);
    const queue: PendingAction[] = raw ? JSON.parse(raw) : [];
    queue.push({ ...action, id: Date.now().toString(), createdAt: new Date().toISOString() });
    await AsyncStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(queue));
    setPendingCount(queue.length);
  }, []);

  return { isConnected, isSyncing, pendingCount, syncPending, cacheScreen, getCachedScreen, queueAction, refreshPendingCount };
}
