const REMEMBER_ME_KEY = "idps_portal_remember_me";
const REMEMBERED_LOGIN_KEY = "idps_portal_remembered_login";

export function isRememberMeEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(REMEMBER_ME_KEY) !== "false";
}

export function setRememberMePreference(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(REMEMBER_ME_KEY, enabled ? "true" : "false");
}

export function readRememberedLogin(): string {
  if (typeof window === "undefined" || !isRememberMeEnabled()) return "";
  return localStorage.getItem(REMEMBERED_LOGIN_KEY)?.trim() ?? "";
}

export function writeRememberedLogin(identifier: string): void {
  if (typeof window === "undefined") return;
  const value = identifier.trim();
  if (!value) return;
  localStorage.setItem(REMEMBERED_LOGIN_KEY, value);
}

export function clearRememberedLogin(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(REMEMBERED_LOGIN_KEY);
}

function preferredStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return isRememberMeEnabled() ? localStorage : sessionStorage;
}

function fallbackStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return isRememberMeEnabled() ? sessionStorage : localStorage;
}

/** Supabase Auth storage — localStorage when "Remember me", else sessionStorage (tab session). */
export const portalAuthStorage = {
  getItem(key: string): string | null {
    const preferred = preferredStorage();
    const preferredValue = preferred?.getItem(key) ?? null;
    if (preferredValue) return preferredValue;

    // Recover sessions stranded after remember-me preference flips.
    const fallback = fallbackStorage();
    const fallbackValue = fallback?.getItem(key) ?? null;
    if (fallbackValue && preferred) {
      preferred.setItem(key, fallbackValue);
      fallback?.removeItem(key);
    }
    return fallbackValue;
  },
  setItem(key: string, value: string): void {
    const preferred = preferredStorage();
    preferred?.setItem(key, value);
    // Avoid split-brain tokens across both storages.
    fallbackStorage()?.removeItem(key);
  },
  removeItem(key: string): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
};

export function clearSupabaseAuthStorage(): void {
  if (typeof window === "undefined") return;
  for (const storage of [localStorage, sessionStorage]) {
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
        keys.push(key);
      }
    }
    for (const key of keys) storage.removeItem(key);
  }
}
