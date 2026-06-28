"use client";

import { clientCacheKey } from "@/lib/clientCache";
import type { BranchClassRecord } from "@/lib/loadBranchClasses";
import { useCachedQuery } from "@/hooks/useCachedQuery";

type UseBranchClassesResult = {
  classes: BranchClassRecord[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useBranchClasses(
  schoolId: string,
  academicYearName: string | null | undefined
): UseBranchClassesResult {
  const cacheKey = clientCacheKey("classes", schoolId, academicYearName ?? "current");

  const query = useCachedQuery<BranchClassRecord[]>({
    cacheKey,
    enabled: Boolean(schoolId),
    fetcher: async () => {
      const params = new URLSearchParams({ schoolId });
      if (academicYearName) params.set("academicYear", academicYearName);

      const res = await fetch(`/api/admin/classes?${params.toString()}`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to load classes");
      }

      return (data.classes ?? []) as BranchClassRecord[];
    },
  });

  return {
    classes: query.data ?? [],
    loading: query.loading,
    refreshing: query.refreshing,
    error: query.error,
    refresh: query.refresh,
  };
}
