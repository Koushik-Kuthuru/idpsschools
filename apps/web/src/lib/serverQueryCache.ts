type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const store = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

const DEFAULT_TTL_MS = 45_000;

export function serverCacheKey(...parts: (string | number | null | undefined)[]): string {
  return parts.map((p) => String(p ?? "")).join("|");
}

export function readServerCache<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value as T;
}

export function writeServerCache<T>(key: string, value: T, ttlMs = DEFAULT_TTL_MS): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function invalidateServerCache(prefix?: string): void {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(prefix) || key.includes(prefix)) store.delete(key);
  }
}

/** Dedupe concurrent identical work (e.g. 4× departments on layout mount). */
export async function withServerCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = DEFAULT_TTL_MS
): Promise<T> {
  const cached = readServerCache<T>(key);
  // Treat null/undefined as a miss so failed lookups are not sticky.
  if (cached !== null && cached !== undefined) return cached;

  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const promise = (async () => {
    try {
      const value = await fetcher();
      // Never persist empty failure sentinels — only cache real values.
      if (value !== null && value !== undefined) {
        writeServerCache(key, value, ttlMs);
      }
      return value;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}
