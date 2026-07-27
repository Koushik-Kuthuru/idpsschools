"use client";

import { supabase } from "@/lib/supabase/client";
import { portalAuthStorage } from "@/lib/auth/portalAuthStorage";

export type AdminFetchInit = RequestInit & {
  /** Skip Supabase refreshSession on 401 (background polls). */
  skipAuthRefresh?: boolean;
};

const REFRESH_FAIL_COOLDOWN_MS = 45_000;
let lastRefreshNetworkFailAt = 0;
let refreshInFlight: Promise<string | null> | null = null;

function isNetworkFetchError(err: unknown): boolean {
  if (err == null) return false;
  if (typeof err === "string") {
    const message = err.toLowerCase();
    return (
      message.includes("failed to fetch") ||
      message.includes("networkerror") ||
      message.includes("fetch failed") ||
      message.includes("network request failed") ||
      message.includes("load failed")
    );
  }

  const maybe = err as { name?: unknown; message?: unknown; cause?: unknown; status?: unknown };
  const name = String(maybe.name ?? "");
  const message = String(maybe.message ?? err).toLowerCase();
  if (
    name === "TypeError" ||
    name === "AbortError" ||
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("fetch failed") ||
    message.includes("network request failed") ||
    message.includes("load failed") ||
    message.includes("auth retryable") ||
    message.includes("err_network")
  ) {
    return true;
  }

  return isNetworkFetchError(maybe.cause);
}

function supabaseAuthStorageKeys(): string[] {
  const keys = new Set<string>();
  try {
    const host = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
    const ref = host.split(".")[0];
    if (ref) keys.add(`sb-${ref}-auth-token`);
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    for (const storage of [localStorage, sessionStorage]) {
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) keys.add(key);
      }
    }
  }
  return [...keys];
}

function tokenFromAuthJson(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as {
      access_token?: string;
      currentSession?: { access_token?: string };
    };
    return (
      parsed.access_token?.trim() ||
      parsed.currentSession?.access_token?.trim() ||
      null
    );
  } catch {
    return null;
  }
}

/** Read access_token from portal auth storage without touching the network. */
function readStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    for (const key of supabaseAuthStorageKeys()) {
      const token = tokenFromAuthJson(portalAuthStorage.getItem(key));
      if (token) return token;
    }
  } catch {
    /* storage blocked */
  }
  return null;
}

async function resolveAccessToken(): Promise<string | null> {
  // Prefer stored JWT — same-origin admin routes also accept cookies, so a
  // missing token is fine; never let Supabase Auth network blips crash polls.
  const stored = readStoredAccessToken();
  if (stored) return stored;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const current = sessionData.session?.access_token?.trim() || null;
    if (current) return current;
  } catch (err) {
    if (!isNetworkFetchError(err)) {
      console.warn("adminApi getSession failed:", err);
    }
  }

  return null;
}

/**
 * Refresh only when needed. Cooldown after network failures so polls don't
 * spam Supabase Auth and flood the Next.js console overlay with TypeError.
 */
async function tryRefreshAccessToken(): Promise<string | null> {
  if (Date.now() - lastRefreshNetworkFailAt < REFRESH_FAIL_COOLDOWN_MS) {
    return readStoredAccessToken();
  }

  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        if (isNetworkFetchError(error)) {
          lastRefreshNetworkFailAt = Date.now();
        }
        return readStoredAccessToken();
      }
      return data.session?.access_token?.trim() || readStoredAccessToken();
    } catch (err) {
      // Supabase may throw TypeError("Failed to fetch") when Auth is unreachable.
      lastRefreshNetworkFailAt = Date.now();
      if (!isNetworkFetchError(err)) {
        console.warn("adminApi refreshSession failed:", err);
      }
      return readStoredAccessToken();
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/** Attach Bearer token for authenticated `/api/admin/*` calls. */
export async function getAdminAuthHeaders(
  extra?: HeadersInit
): Promise<Record<string, string>> {
  const token = await resolveAccessToken();
  const headers: Record<string, string> = {
    ...(extra ? Object.fromEntries(new Headers(extra).entries()) : {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function adminFetch(input: string, init?: AdminFetchInit): Promise<Response> {
  const { skipAuthRefresh = false, ...requestInit } = init ?? {};
  const headers = await getAdminAuthHeaders(requestInit.headers);
  const body = requestInit.body;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const buildInit = (authHeaders: Record<string, string>): RequestInit => {
    const nextHeaders: Record<string, string> = { ...authHeaders };
    // Let the browser set multipart boundary for FormData; only default JSON for other bodies.
    if (body && !isFormData && !nextHeaders["Content-Type"] && !nextHeaders["content-type"]) {
      nextHeaders["Content-Type"] = "application/json";
    }
    return {
      ...requestInit,
      credentials: "include",
      cache: requestInit.cache ?? "no-store",
      headers: nextHeaders,
    };
  };

  let response: Response;
  try {
    response = await fetch(input, buildInit(headers));
  } catch (err) {
    if (isNetworkFetchError(err)) {
      throw new Error(
        `Network unavailable while calling ${input}. Check that the app is reachable and try again.`
      );
    }
    throw err;
  }

  if (response.status !== 401 || skipAuthRefresh) return response;

  const token = await tryRefreshAccessToken();
  if (!token) return response;

  const retryHeaders = {
    ...headers,
    Authorization: `Bearer ${token}`,
  };
  if (retryHeaders.Authorization === headers.Authorization) return response;

  try {
    return await fetch(input, buildInit(retryHeaders));
  } catch (err) {
    if (isNetworkFetchError(err)) return response;
    throw err;
  }
}
