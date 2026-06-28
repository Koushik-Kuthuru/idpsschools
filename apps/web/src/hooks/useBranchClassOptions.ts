"use client";

import { useCallback, useMemo } from "react";
import { useAcademicYearOptional } from "@/contexts/AcademicYearContext";
import { useBranchClasses } from "@/hooks/useBranchClasses";
import {
  uniqueGradesFromClasses,
  uniqueSectionsFromClasses,
  sectionsForGrade as sectionsForGradeFromClasses,
} from "@/lib/classSectionOptions";

type UseBranchClassOptionsResult = {
  grades: string[];
  sections: string[];
  sectionsByClass: Record<string, string[]>;
  sectionsForGrade: (grade: string) => string[];
  classes: ReturnType<typeof useBranchClasses>["classes"];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  academicYear: string | null;
};

/** Grades & sections from branch DB for the active academic year (sorted Nursery → XII). */
export function useBranchClassOptions(schoolId: string): UseBranchClassOptionsResult {
  const academicYearCtx = useAcademicYearOptional();
  const { classes, loading, error, refresh } = useBranchClasses(
    schoolId,
    academicYearCtx?.currentYear?.name
  );

  const classLike = useMemo(
    () => classes.map((c) => ({ grade: c.grade, section: c.section })),
    [classes]
  );

  const grades = useMemo(() => uniqueGradesFromClasses(classLike), [classLike]);
  const sections = useMemo(() => uniqueSectionsFromClasses(classLike), [classLike]);

  const sectionsByClass = useMemo(() => {
    const mapped: Record<string, string[]> = {};
    for (const grade of grades) {
      mapped[grade] = sectionsForGradeFromClasses(classLike, grade);
    }
    return mapped;
  }, [classLike, grades]);

  const lookupSectionsForGrade = useCallback(
    (grade: string) => sectionsByClass[grade] ?? [],
    [sectionsByClass]
  );

  return {
    grades,
    sections,
    sectionsByClass,
    sectionsForGrade: lookupSectionsForGrade,
    classes,
    loading: loading && classes.length === 0,
    error,
    refresh,
    academicYear: academicYearCtx?.currentYear?.name ?? null,
  };
}
