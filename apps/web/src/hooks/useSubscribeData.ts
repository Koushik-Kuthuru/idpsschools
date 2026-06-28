"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { hasDbQueryCache } from "@/lib/dbQueryCache";
import { subscribeData } from "@/lib/db-client";

type SnapshotDoc = {
  id: string;
  data: () => Record<string, unknown>;
};

type QuerySnapshot = {
  docs: SnapshotDoc[];
  empty: boolean;
  size: number;
  forEach: (cb: (doc: SnapshotDoc) => void) => void;
};

type SingleSnapshot = {
  id: string;
  data: () => Record<string, unknown> | null;
  exists: () => boolean;
};

type UseSubscribeDataOptions<T> = {
  enabled?: boolean;
  map: (snapshot: QuerySnapshot | SingleSnapshot) => T;
};

type UseSubscribeDataResult<T> = {
  data: T;
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

export function useSubscribeData<T>(
  queryOrDoc: unknown,
  initialData: T,
  { enabled = true, map }: UseSubscribeDataOptions<T>
): UseSubscribeDataResult<T> {
  const hasCache = enabled && hasDbQueryCache(queryOrDoc);
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(enabled && !hasCache);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef(map);
  mapRef.current = map;
  const [refreshToken, setRefreshToken] = useState(0);

  const refresh = useCallback(() => {
    setRefreshToken((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!enabled || !queryOrDoc) {
      setLoading(false);
      return;
    }

    let received = hasDbQueryCache(queryOrDoc);
    if (!received) setLoading(true);
    setError(null);

    const unsubscribe = subscribeData(
      queryOrDoc,
      (snapshot: QuerySnapshot | SingleSnapshot) => {
        try {
          setData(mapRef.current(snapshot));
          setLoading(false);
          received = true;
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to load data");
          if (!received) setLoading(false);
        }
      },
      (err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load data");
        if (!received) setLoading(false);
      }
    );

    return unsubscribe;
  }, [enabled, queryOrDoc, refreshToken]);

  return { data, loading, error, refresh };
}
