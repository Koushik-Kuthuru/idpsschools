"use client";

import { adminFetch } from "@/lib/adminApi";
import { useMemo } from "react";
import { clientCacheKey } from "@/lib/clientCache";
import { sortGrades } from "@/lib/gradeOrder";
import { useCachedQuery } from "@/hooks/useCachedQuery";
import { useAuth } from "@/contexts/AuthContext";
import type { StudentListCohort } from "@/lib/loadBranchStudents";

function formatStudentsError(data: unknown, status: number, fallback: string): string {
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

  return raw || fallback;
}

export type AdminStudentListItem = {
  id: string;
  name: string;
  className: string;
  section: string;
  gender: string;
  roll: string;
  admissionNo: string;
  status: "Active" | "Inactive";
  academicYear: string;
  parentPhone: string | null;
  fatherName: string;
  motherName?: string;
  dob?: string;
  permanentAddress?: string;
  correspondingAddress?: string;
  admissionDate?: string;
  admissionClass?: string;
  previousAcademicYear?: string;
  nsoDate?: string;
  nsoRemark?: string;
};

type StudentsPayload = {
  students: AdminStudentListItem[];
  classOptions: string[];
  sectionOptions: string[];
};

type UseBranchStudentsResult = {
  students: AdminStudentListItem[];
  classOptions: string[];
  sectionOptions: string[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useBranchStudents(
  schoolId: string,
  academicYearName: string | null | undefined,
  cohort: StudentListCohort = "enrolled"
): UseBranchStudentsResult {
  const { loading: authLoading } = useAuth();
  const cacheKey = clientCacheKey("students-v6", schoolId, academicYearName ?? "current", cohort);

  const query = useCachedQuery<StudentsPayload>({
    cacheKey,
    enabled: Boolean(schoolId && !authLoading),
    fetcher: async () => {
      const params = new URLSearchParams({ schoolId, cohort });
      if (academicYearName) params.set("academicYear", academicYearName);

      const res = await adminFetch(`/api/admin/students?${params.toString()}`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(formatStudentsError(data, res.status, "Failed to load students"));
      }

      const rows = (data.students ?? []) as AdminStudentListItem[];
      const classRows = (data.classes ?? []) as { className: string; section: string }[];
      const grades = sortGrades([...new Set(classRows.map((c) => c.className).filter(Boolean))]);
      const sections = [...new Set(classRows.map((c) => c.section.toUpperCase()).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b)
      );

      return { students: rows, classOptions: grades, sectionOptions: sections };
    },
  });

  const students = query.data?.students ?? [];
  const classOptions = useMemo(() => query.data?.classOptions ?? [], [query.data?.classOptions]);
  const sectionOptions = useMemo(() => query.data?.sectionOptions ?? [], [query.data?.sectionOptions]);

  return {
    students,
    classOptions,
    sectionOptions,
    loading: query.loading,
    refreshing: query.refreshing,
    error: query.error,
    refresh: query.refresh,
  };
}
