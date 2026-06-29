"use client";

import { useMemo } from "react";
import { clientCacheKey } from "@/lib/clientCache";
import { sortGrades } from "@/lib/gradeOrder";
import { useCachedQuery } from "@/hooks/useCachedQuery";

export type AdminStudentListItem = {
  id: string;
  name: string;
  className: string;
  section: string;
  roll: string;
  admissionNo: string;
  status: "Active" | "Inactive";
  academicYear: string;
  parentPhone: string | null;
  fatherName: string;
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
  academicYearName: string | null | undefined
): UseBranchStudentsResult {
  const cacheKey = clientCacheKey("students-v2", schoolId, academicYearName ?? "current");

  const query = useCachedQuery<StudentsPayload>({
    cacheKey,
    enabled: Boolean(schoolId),
    fetcher: async () => {
      const params = new URLSearchParams({ schoolId });
      if (academicYearName) params.set("academicYear", academicYearName);

      const res = await fetch(`/api/admin/students?${params.toString()}`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to load students");
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
