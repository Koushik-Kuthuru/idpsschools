"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { setActiveAcademicYear } from "@/lib/activeAcademicYear";
import { clientCacheKey, readClientCache, writeClientCache } from "@/lib/clientCache";

export type AcademicYearRecord = {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  created_at?: string;
};

type CachedYearsPayload = { years: AcademicYearRecord[] };

type AcademicYearContextValue = {
  years: AcademicYearRecord[];
  currentYear: AcademicYearRecord | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createYear: (input: {
    name: string;
    start_date?: string;
    end_date?: string;
    setAsCurrent?: boolean;
  }) => Promise<AcademicYearRecord | null>;
  setCurrentYear: (academicYearId: string) => Promise<AcademicYearRecord | null>;
};

const AcademicYearContext = createContext<AcademicYearContextValue | null>(null);

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function AcademicYearProvider({
  schoolSlug,
  children,
}: {
  schoolSlug: string;
  children: React.ReactNode;
}) {
  const cacheKey = clientCacheKey("academic-years", schoolSlug);
  const cached = typeof window !== "undefined" ? readClientCache<CachedYearsPayload>(cacheKey) : null;

  const [years, setYears] = useState<AcademicYearRecord[]>(cached?.years ?? []);
  const [loading, setLoading] = useState(!cached && Boolean(schoolSlug));
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!schoolSlug) return;

    const hasCached = (readClientCache<CachedYearsPayload>(cacheKey)?.years?.length ?? 0) > 0;
    if (!hasCached) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/academic-years?schoolId=${encodeURIComponent(schoolSlug)}`, {
        headers: await authHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message =
          data.error ||
          data.message ||
          (typeof data === "object" && data !== null && "code" in data
            ? String((data as { code?: string }).code)
            : null) ||
          "Failed to load academic years";
        setError(message);
        if (!hasCached) setYears([]);
        return;
      }
      const nextYears = (data.years ?? []) as AcademicYearRecord[];
      setYears(nextYears);
      writeClientCache(cacheKey, { years: nextYears });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load academic years");
      if (!hasCached) setYears([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cacheKey, schoolSlug]);

  useEffect(() => {
    const stored = readClientCache<CachedYearsPayload>(cacheKey);
    if (stored?.years?.length) {
      setYears(stored.years);
      setLoading(false);
    }
    void refresh();
  }, [cacheKey, refresh]);

  const createYear = useCallback(
    async (input: {
      name: string;
      start_date?: string;
      end_date?: string;
      setAsCurrent?: boolean;
    }) => {
      setError(null);
      const res = await fetch("/api/admin/academic-years", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ schoolId: schoolSlug, ...input }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to create academic year");
        return null;
      }
      await refresh();
      return data.year as AcademicYearRecord;
    },
    [refresh, schoolSlug]
  );

  const setCurrentYear = useCallback(
    async (academicYearId: string) => {
      setError(null);
      const res = await fetch("/api/admin/academic-years/current", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ schoolId: schoolSlug, academicYearId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to set active academic year");
        return null;
      }
      await refresh();
      return data.year as AcademicYearRecord;
    },
    [refresh, schoolSlug]
  );

  const currentYear = useMemo(
    () => years.find((y) => y.is_current) ?? years[0] ?? null,
    [years]
  );

  useEffect(() => {
    if (schoolSlug && currentYear?.name) {
      setActiveAcademicYear(schoolSlug, currentYear.name);
    }
  }, [schoolSlug, currentYear?.name]);

  const value = useMemo(
    () => ({ years, currentYear, loading, refreshing, error, refresh, createYear, setCurrentYear }),
    [years, currentYear, loading, refreshing, error, refresh, createYear, setCurrentYear]
  );

  return <AcademicYearContext.Provider value={value}>{children}</AcademicYearContext.Provider>;
}

export function useAcademicYear() {
  const ctx = useContext(AcademicYearContext);
  if (!ctx) {
    throw new Error("useAcademicYear must be used within AcademicYearProvider");
  }
  return ctx;
}

/** Safe hook when provider may be absent (e.g. super-admin). */
export function useAcademicYearOptional() {
  return useContext(AcademicYearContext);
}
