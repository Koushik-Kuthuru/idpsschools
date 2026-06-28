"use client";

import { clientCacheKey } from "@/lib/clientCache";
import { useCachedQuery } from "@/hooks/useCachedQuery";
import { supabase } from "@/lib/supabase/client";

type PortalStudentsPayload = {
  students: Record<string, unknown>[];
};

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function usePortalStudents(schoolId: string, academicYear?: string | null) {
  const cacheKey = clientCacheKey("portal-students", schoolId, academicYear ?? "current");

  return useCachedQuery<PortalStudentsPayload>({
    cacheKey,
    enabled: Boolean(schoolId),
    fetcher: async () => {
      const params = new URLSearchParams({ schoolId });
      if (academicYear) params.set("academicYear", academicYear);
      const res = await fetch(`/api/portal/students?${params.toString()}`, {
        headers: await authHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to load students");
      }
      return { students: (data.students ?? []) as Record<string, unknown>[] };
    },
  });
}
