"use client";

import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { clientCacheKey } from "@/lib/clientCache";
import { useCachedQuery } from "@/hooks/useCachedQuery";
import { supabase } from "@/lib/supabase/client";
import {
  assignmentsFromKeys,
  studentMatchesClassScope,
  type ClassAssignment,
} from "@/lib/teacherClassScope";

type ScopePayload = {
  isUnrestricted: boolean;
  classKeys: string[];
};

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type ScopeState = {
  loading: boolean;
  error: string | null;
  isUnrestricted: boolean;
  classKeys: string[];
  assignments: ClassAssignment[];
  matchesStudent: (student: { classId?: string; grade?: string; section?: string }) => boolean;
};

export function useTeacherClassScope(schoolId: string): ScopeState {
  const { user, role } = useAuth();

  const query = useCachedQuery<ScopePayload>({
    cacheKey: clientCacheKey("portal-teacher-scope", schoolId, user?.uid),
    enabled: Boolean(schoolId && user?.uid) && role !== "super_admin",
    fetcher: async () => {
      const res = await fetch(
        `/api/portal/teacher-scope?schoolId=${encodeURIComponent(schoolId)}`,
        { headers: await authHeaders() }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to load your class assignments");
      }
      if (data.isUnrestricted) {
        return { isUnrestricted: true, classKeys: [] as string[] };
      }
      return {
        isUnrestricted: false,
        classKeys: (data.classKeys ?? []) as string[],
      };
    },
  });

  return useMemo(() => {
    if (role === "super_admin") {
      return {
        loading: false,
        error: null,
        isUnrestricted: true,
        classKeys: [],
        assignments: [],
        matchesStudent: () => true,
      };
    }

    if (!schoolId || !user?.uid) {
      return {
        loading: false,
        error: null,
        isUnrestricted: false,
        classKeys: [],
        assignments: [],
        matchesStudent: () => false,
      };
    }

    const classKeys = query.data?.classKeys ?? [];
    const isUnrestricted = query.data?.isUnrestricted ?? false;
    const allowed = new Set(classKeys);

    return {
      loading: query.loading,
      error: query.error,
      isUnrestricted,
      classKeys,
      assignments: assignmentsFromKeys(classKeys),
      matchesStudent: (student) => isUnrestricted || studentMatchesClassScope(student, allowed),
    };
  }, [role, schoolId, user?.uid, query.data, query.loading, query.error]);
}
