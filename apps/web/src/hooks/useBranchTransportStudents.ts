"use client";

import { adminFetch } from "@/lib/adminApi";
import { useMemo } from "react";
import { clientCacheKey } from "@/lib/clientCache";
import { useCachedQuery } from "@/hooks/useCachedQuery";
import { supabase } from "@/lib/supabase/client";
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

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useBranchTransportStudents(
  schoolId: string,
  academicYearName: string | null | undefined
): UseBranchTransportStudentsResult {
  // v2: includes paidFees / feePaid / balance per academic year.
  const cacheKey = clientCacheKey("transport-students-v2", schoolId, academicYearName ?? "current");

  const query = useCachedQuery<TransportStudentsPayload>({
    cacheKey,
    enabled: Boolean(schoolId),
    fetcher: async () => {
      const params = new URLSearchParams({ schoolId });
      if (academicYearName) params.set("academicYear", academicYearName);

      const res = await adminFetch(`/api/admin/transport/students?${params.toString()}`, {
        headers: await authHeaders(),
      });
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
