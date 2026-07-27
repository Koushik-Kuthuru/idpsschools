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
import type { StaffScopeMode } from "@/lib/resolveStaffDataScope";

type ScopePayload = {
  isUnrestricted: boolean;
  mode: StaffScopeMode;
  classKeys: string[];
  busNos: string[];
  routes: string[];
  displayName?: string | null;
};

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function normalizeBusToken(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

export type TeacherClassScopeState = {
  loading: boolean;
  error: string | null;
  isUnrestricted: boolean;
  mode: StaffScopeMode;
  classKeys: string[];
  busNos: string[];
  routes: string[];
  assignments: ClassAssignment[];
  displayName: string | null;
  matchesStudent: (student: {
    classId?: string;
    grade?: string;
    className?: string;
    section?: string;
    busNo?: string;
    route?: string;
  }) => boolean;
};

export function useTeacherClassScope(schoolId: string): TeacherClassScopeState {
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
        return {
          isUnrestricted: true,
          mode: "unrestricted" as StaffScopeMode,
          classKeys: [] as string[],
          busNos: [] as string[],
          routes: [] as string[],
        };
      }
      return {
        isUnrestricted: false,
        mode: (data.mode ?? "none") as StaffScopeMode,
        classKeys: (data.classKeys ?? []) as string[],
        busNos: (data.busNos ?? []) as string[],
        routes: (data.routes ?? []) as string[],
        displayName: (data.displayName ?? null) as string | null,
      };
    },
  });

  return useMemo(() => {
    if (role === "super_admin") {
      return {
        loading: false,
        error: null,
        isUnrestricted: true,
        mode: "unrestricted" as StaffScopeMode,
        classKeys: [],
        busNos: [],
        routes: [],
        assignments: [],
        displayName: user?.displayName ?? null,
        matchesStudent: () => true,
      };
    }

    if (!schoolId || !user?.uid) {
      return {
        loading: false,
        error: null,
        isUnrestricted: false,
        mode: "none" as StaffScopeMode,
        classKeys: [],
        busNos: [],
        routes: [],
        assignments: [],
        displayName: null,
        matchesStudent: () => false,
      };
    }

    const classKeys = query.data?.classKeys ?? [];
    const busNos = query.data?.busNos ?? [];
    const routes = query.data?.routes ?? [];
    const mode = query.data?.mode ?? "none";
    const isUnrestricted = query.data?.isUnrestricted ?? false;
    const displayName = query.data?.displayName ?? user?.displayName ?? null;
    const allowed = new Set(classKeys);

    const matchesStudent = (student: {
      classId?: string;
      grade?: string;
      className?: string;
      section?: string;
      busNo?: string;
      route?: string;
    }) => {
      if (isUnrestricted) return true;
      if (mode === "none") return false;
      if (mode === "transport") {
        const busNo = normalizeBusToken(student.busNo);
        const route = String(student.route ?? "").trim();
        if (busNo && busNos.some((value) => normalizeBusToken(value) === busNo)) return true;
        if (route && routes.includes(route)) return true;
        return false;
      }
      const grade = String(student.classId ?? student.grade ?? student.className ?? "").trim();
      const section = String(student.section ?? "").trim();
      return studentMatchesClassScope({ classId: grade, grade, section }, allowed);
    };

    return {
      loading: query.loading,
      error: query.error,
      isUnrestricted,
      mode,
      classKeys,
      busNos,
      routes,
      assignments: assignmentsFromKeys(classKeys),
      displayName,
      matchesStudent,
    };
  }, [role, schoolId, user?.uid, user?.displayName, query.data, query.loading, query.error]);
}
