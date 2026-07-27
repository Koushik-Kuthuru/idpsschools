"use client";

import { useAcademicYearOptional } from "@/contexts/AcademicYearContext";
import { DEFAULT_TERM_KEY } from "./timetablePeriodGrid";

/** Academic year used for timetable doc IDs (falls back to imported default). */
export function useTimetableTermKey(_schoolId?: string) {
  const academicYearCtx = useAcademicYearOptional();
  return academicYearCtx?.currentYear?.name ?? DEFAULT_TERM_KEY;
}
