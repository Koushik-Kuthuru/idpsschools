const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

type CacheEnvelope<T> = {
  data: T;
  savedAt: number;
  ttlMs: number;
};

export function clientCacheKey(prefix: string, ...parts: (string | null | undefined)[]): string {
  return `${prefix}:${parts.filter(Boolean).join(":")}`;
}

export function readClientCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (!parsed || typeof parsed !== "object" || parsed.data === undefined) return null;
    const age = Date.now() - Number(parsed.savedAt ?? 0);
    if (age > Number(parsed.ttlMs ?? DEFAULT_TTL_MS)) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

export function writeClientCache<T>(key: string, data: T, ttlMs = DEFAULT_TTL_MS): void {
  if (typeof window === "undefined") return;
  try {
    const envelope: CacheEnvelope<T> = { data, savedAt: Date.now(), ttlMs };
    localStorage.setItem(key, JSON.stringify(envelope));
  } catch {
    // Quota exceeded or private mode — ignore
  }
}

export function removeClientCache(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function hasClientCache(key: string): boolean {
  return readClientCache(key) !== null;
}
