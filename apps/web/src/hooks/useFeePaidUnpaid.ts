"use client";

import { adminFetch } from "@/lib/adminApi";
import { useCachedQuery } from "@/hooks/useCachedQuery";
import { clientCacheKey } from "@/lib/clientCache";
import { useAuth } from "@/contexts/AuthContext";
import type {
  FeePaidUnpaidRow,
  FeePaidUnpaidTotals,
} from "@/lib/feePaidUnpaidRegistry";

type FeePaidUnpaidPayload = {
  academicYear: string;
  paid: FeePaidUnpaidRow[];
  unpaid: FeePaidUnpaidRow[];
  paidTotals: FeePaidUnpaidTotals;
  unpaidTotals: FeePaidUnpaidTotals;
  source: "registry" | "profiles" | "empty";
};

const EMPTY: FeePaidUnpaidPayload = {
  academicYear: "",
  paid: [],
  unpaid: [],
  paidTotals: {
    lastYearDue: 0,
    lastYearDuePaid: 0,
    feeDue: 0,
    feePaid: 0,
    balance: 0,
    students: 0,
  },
  unpaidTotals: {
    lastYearDue: 0,
    lastYearDuePaid: 0,
    feeDue: 0,
    feePaid: 0,
    balance: 0,
    students: 0,
  },
  source: "empty",
};

export function useFeePaidUnpaid(
  schoolId: string,
  academicYearName: string | null | undefined
) {
  const { loading: authLoading } = useAuth();
  const cacheKey = clientCacheKey("fee-paid-unpaid-v1", schoolId, academicYearName ?? "current");

  const query = useCachedQuery<FeePaidUnpaidPayload>({
    cacheKey,
    enabled: Boolean(schoolId && !authLoading),
    fetcher: async () => {
      const params = new URLSearchParams({ schoolId });
      if (academicYearName) params.set("academicYear", academicYearName);
      const res = await adminFetch(`/api/admin/fees/paid-unpaid?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(String(data.error ?? "Failed to load fee paid/unpaid"));
      }
      return data as FeePaidUnpaidPayload;
    },
  });

  return {
    ...(query.data ?? EMPTY),
    loading: query.loading,
    refreshing: query.refreshing,
    error: query.error,
    refresh: query.refresh,
  };
}
