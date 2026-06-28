"use client";

import { clientCacheKey } from "@/lib/clientCache";
import { useCachedQuery } from "@/hooks/useCachedQuery";
import { mapStaffDoc, type StaffDisplayRecord } from "@/lib/staffRecord";

type StaffKind = "teaching" | "non_teaching" | "all";

type StaffPayload = {
  staff: StaffDisplayRecord[];
};

type UseBranchStaffResult = {
  staff: StaffDisplayRecord[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useBranchStaff(
  schoolId: string,
  kind: StaffKind = "all",
  academicYearName?: string | null
): UseBranchStaffResult {
  const cacheKey = clientCacheKey("staff", schoolId, kind, academicYearName ?? "current");

  const query = useCachedQuery<StaffPayload>({
    cacheKey,
    enabled: Boolean(schoolId),
    fetcher: async () => {
      const params = new URLSearchParams({ schoolId, kind });
      if (academicYearName) params.set("academicYear", academicYearName);

      const res = await fetch(`/api/admin/staff?${params.toString()}`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to load staff");
      }

      const rows = (data.staff ?? []) as Record<string, unknown>[];
      const staff = rows.map((row) => mapStaffDoc(String(row.id ?? ""), row));

      return { staff };
    },
  });

  return {
    staff: query.data?.staff ?? [],
    loading: query.loading,
    refreshing: query.refreshing,
    error: query.error,
    refresh: query.refresh,
  };
}
