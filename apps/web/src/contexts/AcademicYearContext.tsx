"use client";

import { adminFetch } from "@/lib/adminApi";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { setActiveAcademicYear } from "@/lib/activeAcademicYear";
import {
  clearSchoolClientCaches,
  clientCacheKey,
  readClientCache,
  writeClientCache,
} from "@/lib/clientCache";
import { useAuth } from "@/contexts/AuthContext";

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

function formatAcademicYearError(data: unknown, status: number): string {
  const payload = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const code = String(payload.code ?? "").toUpperCase();
  const raw = String(payload.error ?? payload.message ?? "").trim();

  if (
    status === 401 ||
    code === "INVALID_CREDENTIALS" ||
    raw.toLowerCase().includes("invalid credentials")
  ) {
    return "Your session expired. Please log out and sign in again.";
  }

  return raw || "Failed to load academic years";
}

function markYearCurrent(years: AcademicYearRecord[], academicYearId: string): AcademicYearRecord[] {
  return years.map((year) => ({
    ...year,
    is_current: year.id === academicYearId,
  }));
}

export function AcademicYearProvider({
  schoolSlug,
  children,
}: {
  schoolSlug: string;
  children: React.ReactNode;
}) {
  const { loading: authLoading } = useAuth();
  const cacheKey = clientCacheKey("academic-years", schoolSlug);
  const cached = typeof window !== "undefined" ? readClientCache<CachedYearsPayload>(cacheKey) : null;

  const [years, setYears] = useState<AcademicYearRecord[]>(cached?.years ?? []);
  const [loading, setLoading] = useState(!cached && Boolean(schoolSlug));
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!schoolSlug || authLoading) return;

    const hasCached = (readClientCache<CachedYearsPayload>(cacheKey)?.years?.length ?? 0) > 0;
    if (!hasCached) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const res = await adminFetch(`/api/admin/academic-years?schoolId=${encodeURIComponent(schoolSlug)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(formatAcademicYearError(data, res.status));
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
  }, [authLoading, cacheKey, schoolSlug]);

  useEffect(() => {
    const stored = readClientCache<CachedYearsPayload>(cacheKey);
    if (stored?.years?.length) {
      setYears(stored.years);
      setLoading(false);
    }
    if (!authLoading) {
      void refresh();
    }
  }, [authLoading, cacheKey, refresh]);

  const createYear = useCallback(
    async (input: {
      name: string;
      start_date?: string;
      end_date?: string;
      setAsCurrent?: boolean;
    }) => {
      setError(null);
      const res = await adminFetch("/api/admin/academic-years", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId: schoolSlug, ...input }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(formatAcademicYearError(data, res.status));
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

      const selected = years.find((year) => year.id === academicYearId) ?? null;
      if (!selected) {
        setError("Academic year not found");
        return null;
      }

      // Optimistic UI: flip current year immediately so lists refetch for the new year.
      const optimisticYears = markYearCurrent(years, academicYearId);
      setYears(optimisticYears);
      writeClientCache(cacheKey, { years: optimisticYears });
      setActiveAcademicYear(schoolSlug, selected.name);
      clearSchoolClientCaches(schoolSlug);

      const res = await adminFetch("/api/admin/academic-years/current", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId: schoolSlug, academicYearId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(formatAcademicYearError(data, res.status));
        await refresh();
        return null;
      }

      const confirmed = data.year as AcademicYearRecord | undefined;
      if (confirmed?.id) {
        const nextYears = markYearCurrent(optimisticYears, confirmed.id).map((year) =>
          year.id === confirmed.id ? { ...year, ...confirmed, is_current: true } : year
        );
        setYears(nextYears);
        writeClientCache(cacheKey, { years: nextYears });
        if (confirmed.name) setActiveAcademicYear(schoolSlug, confirmed.name);
        return confirmed;
      }

      await refresh();
      return selected;
    },
    [cacheKey, refresh, schoolSlug, years]
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

const EMPTY_ACADEMIC_YEAR_CONTEXT: AcademicYearContextValue = {
  years: [],
  currentYear: null,
  loading: false,
  refreshing: false,
  error: null,
  refresh: async () => {},
  createYear: async () => null,
  setCurrentYear: async () => null,
};

export function useAcademicYear() {
  const ctx = useContext(AcademicYearContext);
  // Allow prerender/orphan routes without a hard crash.
  return ctx ?? EMPTY_ACADEMIC_YEAR_CONTEXT;
}

/** Safe hook when provider may be absent (e.g. super-admin). */
export function useAcademicYearOptional() {
  return useContext(AcademicYearContext);
}
