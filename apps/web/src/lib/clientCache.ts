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
    // Treat empty arrays as a miss so dropdowns refetch after a bad cache write.
    if (Array.isArray(parsed.data) && parsed.data.length === 0) {
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
  // Never persist empty collections — a failed/empty fetch would stick for 24h
  // and leave dropdowns stuck on "All" only.
  if (Array.isArray(data) && data.length === 0) {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
    return;
  }
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

/** Drop cached list payloads for a school so year switches refetch cleanly. */
export function clearSchoolClientCaches(schoolSlug: string): void {
  if (typeof window === "undefined" || !schoolSlug) return;
  const needle = `:${schoolSlug}`;
  const prefixes = [
    "students-v4:",
    "students-v3:",
    "students-v2:",
    "classes:",
    "subjects:",
    "staff:",
    "teaching-staff:",
    "non-teaching-staff:",
    "fees:",
    "fee-payments:",
    "transport:",
    "transport-students:",
    "transport-students-v2:",
    "marks:",
    "timetable:",
    "departments:",
    "portal-users:",
  ];
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      // Keep academic-years cache — year switch updates it optimistically.
      if (key.startsWith("academic-years:")) continue;
      if (!key.includes(needle) && !key.includes(`:${schoolSlug}:`)) continue;
      if (prefixes.some((prefix) => key.startsWith(prefix))) {
        keys.push(key);
      }
    }
    for (const key of keys) localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function hasClientCache(key: string): boolean {
  return readClientCache(key) !== null;
}
