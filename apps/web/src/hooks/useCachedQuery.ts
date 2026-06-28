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
      const next = await fetcherRef.current();
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
    }

    let cancelled = false;

    (async () => {
      const hasCached = cached !== null;
      if (!hasCached) setLoading(true);
      else setRefreshing(true);

      setError(null);
      try {
        const next = await fetcherRef.current();
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
