"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { readClientCache, writeClientCache } from "@/lib/clientCache";

type UseCachedQueryOptions<T> = {
  cacheKey: string;
  enabled?: boolean;
  fetcher: () => Promise<T>;
  staleWhileRevalidate?: boolean;
};

type UseCachedQueryResult<T> = {
  data: T | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setData: (value: T | null) => void;
};

/** Share one in-flight request across hook instances with the same cacheKey. */
const sharedInflight = new Map<string, Promise<unknown>>();

async function runSharedFetcher<T>(cacheKey: string, fetcher: () => Promise<T>): Promise<T> {
  const existing = sharedInflight.get(cacheKey) as Promise<T> | undefined;
  if (existing) return existing;

  const promise = fetcher().finally(() => {
    sharedInflight.delete(cacheKey);
  });
  sharedInflight.set(cacheKey, promise);
  return promise;
}

export function useCachedQuery<T>({
  cacheKey,
  enabled = true,
  fetcher,
  staleWhileRevalidate = true,
}: UseCachedQueryOptions<T>): UseCachedQueryResult<T> {
  const cachedInitial = typeof window !== "undefined" ? readClientCache<T>(cacheKey) : null;
  const [data, setData] = useState<T | null>(cachedInitial);
  const [loading, setLoading] = useState(enabled && cachedInitial === null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refresh = useCallback(async () => {
    if (!enabled) return;

    const hasCached = readClientCache<T>(cacheKey) !== null || data !== null;
    if (!hasCached) {
      setLoading(true);
    } else if (staleWhileRevalidate) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const next = await runSharedFetcher(cacheKey, () => fetcherRef.current());
      setData(next);
      writeClientCache(cacheKey, next);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load data";
      setError(message);
      if (!hasCached) setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cacheKey, data, enabled, staleWhileRevalidate]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const cached = readClientCache<T>(cacheKey);
    if (cached !== null) {
      setData(cached);
      setLoading(false);
    } else {
      // Year/filter key changed and there is no cache for the new key —
      // clear stale data from the previous key immediately.
      setData(null);
      setLoading(true);
    }

    let cancelled = false;

    (async () => {
      const hasCached = cached !== null;
      if (!hasCached) setLoading(true);
      else setRefreshing(true);

      setError(null);
      try {
        const next = await runSharedFetcher(cacheKey, () => fetcherRef.current());
        if (cancelled) return;
        setData(next);
        writeClientCache(cacheKey, next);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Failed to load data";
        setError(message);
        if (!hasCached) setData(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cacheKey, enabled]);

  return { data, loading, refreshing, error, refresh, setData };
}
