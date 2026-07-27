"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "@/lib/supabase/client";
import { clientCacheKey, removeClientCache, writeClientCache } from "@/lib/clientCache";
import { getPortalLoginPath } from "@/lib/auth/roles";
import {
  clearRememberedLogin,
  clearSupabaseAuthStorage,
  setRememberMePreference,
  writeRememberedLogin,
} from "@/lib/auth/portalAuthStorage";

const AUTH_CACHE_KEY = clientCacheKey("portal", "profile");
const AUTH_NETWORK_TIMEOUT_MS = 5_000;
const AUTH_BOOTSTRAP_MAX_MS = 10_000;

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      }
    );
  });
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phone?: string;
  designation?: string;
  department?: string;
  employeeId?: string;
  /** Student: current academic year class */
  grade?: string;
  section?: string;
  className?: string;
  rollNumber?: string;
  academicYearName?: string;
}

interface AuthContextType {
  user: User | null;
  role: string | null;
  schoolId: string | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
    options?: { schoolId?: string; prefer?: "student" | "staff"; rememberMe?: boolean }
  ) => Promise<void>;
  logout: (redirectTo?: string) => Promise<void>;
  updateProfile: (details: Partial<User>) => Promise<void>;
  devLogin?: (role: string, schoolId: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  schoolId: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
  devLogin: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Start null on both server and first client paint to avoid hydration skew;
  // hydrate from session cookies / storage in an effect.
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const profileRequestRef = useRef(0);
  const lastTokenRef = useRef<string | null>(null);
  const signingOutRef = useRef(false);
  const bootstrappedRef = useRef(false);

  const applyProfile = useCallback(
    (nextUser: User | null, nextRole: string | null, nextSchoolId: string | null) => {
      setUser(nextUser);
      setRole(nextRole);
      setSchoolId(nextSchoolId);
      if (nextUser) {
        writeClientCache(AUTH_CACHE_KEY, {
          user: nextUser,
          role: nextRole,
          schoolId: nextSchoolId,
        });
      } else {
        removeClientCache(AUTH_CACHE_KEY);
      }
    },
    []
  );

  const fetchProfile = useCallback(
    async (accessToken: string, options?: { force?: boolean }) => {
      if (
        !options?.force &&
        accessToken &&
        lastTokenRef.current === accessToken &&
        profileRequestRef.current > 0
      ) {
        // Deduplicate overlapping getSession + onAuthStateChange INITIAL_SESSION.
        return;
      }
      if (accessToken) lastTokenRef.current = accessToken;
      const requestId = ++profileRequestRef.current;

      try {
        const res = await fetch("/api/portal/me", {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
          credentials: "include",
          cache: "no-store",
        });

        if (requestId !== profileRequestRef.current) return;

        if (!res.ok) {
          console.warn("Portal profile unavailable:", res.status);
          if (accessToken) {
            const authUser = await withTimeout(
              supabase.auth.getUser(accessToken).then(({ data }) => data.user ?? null),
              AUTH_NETWORK_TIMEOUT_MS,
              null
            );
            if (authUser && requestId === profileRequestRef.current) {
              applyProfile(
                {
                  uid: authUser.id,
                  email: authUser.email ?? null,
                  displayName:
                    (authUser.user_metadata?.full_name as string | undefined) ??
                    authUser.email?.split("@")[0] ??
                    null,
                  photoURL: (authUser.user_metadata?.avatar_url as string | undefined) ?? null,
                },
                (authUser.user_metadata?.role as string | undefined) ?? "teacher",
                (authUser.user_metadata?.school_id as string | undefined) ?? null
              );
              return;
            }
          }
          applyProfile(null, null, null);
          return;
        }

        const data = await res.json();
        if (requestId !== profileRequestRef.current) return;
        applyProfile(data.user ?? null, data.role ?? null, data.schoolId ?? null);
      } catch (err) {
        // Transient HMR / offline / Supabase blips surface as TypeError: Failed to fetch.
        const message = err instanceof Error ? err.message : String(err);
        if (/failed to fetch|networkerror|fetch failed/i.test(message)) {
          console.warn("Portal profile temporarily unavailable (network).");
        } else {
          console.error("Failed to fetch profile", err);
        }
      } finally {
        if (requestId === profileRequestRef.current) {
          setLoading(false);
        }
      }
    },
    [applyProfile]
  );

  /** Rehydrate Supabase client storage from HttpOnly cookies after a full page reload. */
  const restoreSessionFromCookies = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/portal/auth/session", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) return null;

      const data = await res.json().catch(() => ({}));
      const accessToken = String(data.access_token ?? "").trim();
      const refreshToken = String(data.refresh_token ?? "").trim();
      if (!accessToken || !refreshToken) return null;

      if (typeof data.rememberMe === "boolean") {
        setRememberMePreference(data.rememberMe);
      }

      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) {
        console.warn("Failed to restore portal session:", error.message);
        return accessToken;
      }
      return accessToken;
    } catch (err) {
      console.warn("Cookie session restore failed:", err);
      return null;
    }
  }, []);

  useEffect(() => {
    let active = true;
    const safetyTimer = window.setTimeout(() => {
      if (!active) return;
      // Never leave portals stuck on "Loading…" if Auth/network hangs.
      setLoading(false);
    }, AUTH_BOOTSTRAP_MAX_MS);

    async function bootstrap() {
      let accessToken: string | null = null;

      try {
        accessToken = await withTimeout(
          supabase.auth.getSession().then(({ data }) => data.session?.access_token ?? null),
          AUTH_NETWORK_TIMEOUT_MS,
          null
        );
      } catch (err) {
        console.warn("Auth getSession failed during bootstrap:", err);
      }

      // Avoid blind refreshSession() when there is no local session — it often
      // hangs / throws TypeError: Failed to fetch and blocks the student portal.
      // Prefer HttpOnly cookie restore instead.
      if (!accessToken) {
        accessToken = await withTimeout(restoreSessionFromCookies(), AUTH_NETWORK_TIMEOUT_MS, null);
      }

      if (!active) return;

      bootstrappedRef.current = true;
      await fetchProfile(accessToken ?? "", { force: true });
    }

    void bootstrap().finally(() => {
      window.clearTimeout(safetyTimer);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") {
        // bootstrap() handles the first load.
        return;
      }

      if (event === "SIGNED_OUT") {
        if (signingOutRef.current) {
          lastTokenRef.current = null;
          applyProfile(null, null, null);
          setLoading(false);
          return;
        }

        // Transient SIGNED_OUT (storage race) — try cookie restore before logging out.
        void (async () => {
          const restored = await restoreSessionFromCookies();
          if (restored) {
            await fetchProfile(restored, { force: true });
            return;
          }
          lastTokenRef.current = null;
          applyProfile(null, null, null);
          setLoading(false);
        })();
        return;
      }

      if (session?.access_token) {
        void fetchProfile(session.access_token, { force: true });
        return;
      }

      // Null session without an explicit sign-out — try cookie restore before logging out.
      if (!signingOutRef.current) {
        void (async () => {
          const restored = await restoreSessionFromCookies();
          if (restored) {
            await fetchProfile(restored, { force: true });
            return;
          }
          lastTokenRef.current = null;
          applyProfile(null, null, null);
          setLoading(false);
        })();
        return;
      }

      lastTokenRef.current = null;
      applyProfile(null, null, null);
      setLoading(false);
    });

    return () => {
      active = false;
      window.clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [applyProfile, fetchProfile, restoreSessionFromCookies]);

  const login = useCallback(
    async (
      email: string,
      password: string,
      options?: { schoolId?: string; prefer?: "student" | "staff"; rememberMe?: boolean }
    ) => {
      const rememberMe = options?.rememberMe !== false;
      setRememberMePreference(rememberMe);
      if (rememberMe) {
        writeRememberedLogin(email);
      } else {
        clearRememberedLogin();
      }

      removeClientCache(AUTH_CACHE_KEY);
      lastTokenRef.current = null;
      signingOutRef.current = false;
      setLoading(true);

      if (typeof window !== "undefined") {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (
            key?.startsWith("academic-years:") ||
            key?.startsWith("students-v2:") ||
            key?.startsWith("classes:")
          ) {
            localStorage.removeItem(key);
          }
        }
      }

      // Clear stranded tokens so the new session writes cleanly to the preferred storage.
      clearSupabaseAuthStorage();

      const res = await fetch("/api/portal/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          identifier: email.trim(),
          password,
          schoolId: options?.schoolId ?? null,
          prefer: options?.prefer,
          rememberMe,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoading(false);
        const message = String(data.error ?? "Invalid login credentials");
        const err = new Error(message) as Error & { code?: string };
        if (res.status === 429 || message.toLowerCase().includes("too many")) {
          err.code = "auth/too-many-requests";
        } else {
          err.code = "invalid_credentials";
        }
        throw err;
      }

      // Preference must be set before setSession so tokens land in the right storage.
      setRememberMePreference(rememberMe);

      const { error } = await supabase.auth.setSession({
        access_token: String(data.access_token),
        refresh_token: String(data.refresh_token),
      });

      if (error) {
        setLoading(false);
        throw error;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) {
        setLoading(false);
        throw new Error("Session could not be established. Please try again.");
      }

      bootstrappedRef.current = true;
      await fetchProfile(accessToken, { force: true });
    },
    [fetchProfile]
  );

  const logout = useCallback(
    async (redirectTo?: string) => {
      const destination = redirectTo ?? getPortalLoginPath(schoolId, role);
      signingOutRef.current = true;

      try {
        await fetch("/api/portal/auth/logout", { method: "POST", credentials: "include" });
      } catch (err) {
        console.warn("Portal logout cookies:", err);
      }

      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch (err) {
        console.warn("Supabase signOut:", err);
      }

      clearSupabaseAuthStorage();
      removeClientCache(AUTH_CACHE_KEY);
      lastTokenRef.current = null;
      applyProfile(null, null, null);
      setLoading(false);

      if (typeof window !== "undefined") {
        window.location.assign(destination);
      }
    },
    [applyProfile, role, schoolId]
  );

  const devLogin = useCallback((roleMock: string, schoolIdMock: string) => {
    setUser({
      uid: "dev-mock-uid",
      email: `dev-${roleMock}@${schoolIdMock}.com`,
      displayName: `Dev ${roleMock}`,
      photoURL: null,
    });
    setRole(roleMock);
    setSchoolId(schoolIdMock);
    setLoading(false);
  }, []);

  const updateProfile = useCallback(
    async (details: Partial<User>) => {
      if (!user?.uid) throw new Error("No authenticated user found");

      const updates = {
        full_name: details.displayName !== undefined ? details.displayName : user.displayName,
        avatar_url: details.photoURL !== undefined ? details.photoURL : user.photoURL,
        phone: details.phone !== undefined ? details.phone : user.phone,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("users").update(updates).eq("id", user.uid);

      if (error) {
        throw error;
      }

      setUser((prev) =>
        prev
          ? {
              ...prev,
              displayName: updates.full_name,
              photoURL: updates.avatar_url,
              phone: updates.phone,
            }
          : null
      );
    },
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      role,
      schoolId,
      loading,
      login,
      logout,
      updateProfile,
      devLogin,
    }),
    [user, role, schoolId, loading, login, logout, updateProfile, devLogin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
