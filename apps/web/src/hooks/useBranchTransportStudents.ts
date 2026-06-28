"use client";

import { useMemo } from "react";
import { clientCacheKey } from "@/lib/clientCache";
import { useCachedQuery } from "@/hooks/useCachedQuery";
import type { BranchTransportStudentRow } from "@/lib/loadBranchStudents";

type TransportStudentsPayload = {
  students: BranchTransportStudentRow[];
};

type UseBranchTransportStudentsResult = {
  students: BranchTransportStudentRow[];
  usingTransport: BranchTransportStudentRow[];
  notUsingTransport: BranchTransportStudentRow[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useBranchTransportStudents(
  schoolId: string,
  academicYearName: string | null | undefined
): UseBranchTransportStudentsResult {
  const cacheKey = clientCacheKey("transport-students", schoolId, academicYearName ?? "current");

  const query = useCachedQuery<TransportStudentsPayload>({
    cacheKey,
    enabled: Boolean(schoolId),
    fetcher: async () => {
      const params = new URLSearchParams({ schoolId });
      if (academicYearName) params.set("academicYear", academicYearName);

      const res = await fetch(`/api/admin/transport/students?${params.toString()}`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to load transport students");
      }

      return { students: (data.students ?? []) as BranchTransportStudentRow[] };
    },
  });

  const students = query.data?.students ?? [];

  const usingTransport = useMemo(
    () => students.filter((s) => s.usesTransport),
    [students]
  );

  const notUsingTransport = useMemo(
    () => students.filter((s) => !s.usesTransport),
    [students]
  );

  return {
    students,
    usingTransport,
    notUsingTransport,
    loading: query.loading,
    refreshing: query.refreshing,
    error: query.error,
    refresh: query.refresh,
  };
}
