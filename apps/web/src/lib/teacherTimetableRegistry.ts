import type { SupabaseClient } from "@supabase/supabase-js";

export const TEACHER_TIMETABLE_REGISTRY_PREFIX = "__teacher_timetable_registry__:";

export type TeacherTimetableSummaryRow = {
  sr?: number;
  classLabel: string;
  subject: string;
  periodCount: number;
};

export type TeacherTimetableEntry = {
  teacherName: string;
  sourceFile?: string;
  dayLoads?: Record<string, number>;
  summary: TeacherTimetableSummaryRow[];
  totalPeriods?: number;
};

export type TeacherTimetableRegistry = {
  academicYear: string;
  count?: number;
  seededAt?: string;
  teachers: TeacherTimetableEntry[];
};

export async function loadTeacherTimetableRegistry(
  admin: SupabaseClient<any>,
  branchId: string,
  academicYear: string
): Promise<TeacherTimetableRegistry | null> {
  const { data, error } = await admin
    .from("notices")
    .select("content")
    .eq("branch_id", branchId)
    .eq("title", `${TEACHER_TIMETABLE_REGISTRY_PREFIX}${academicYear}`)
    .maybeSingle();

  if (error?.code === "PGRST205" || !data?.content) return null;
  try {
    const parsed = JSON.parse(String(data.content)) as TeacherTimetableRegistry;
    if (!Array.isArray(parsed.teachers) || parsed.teachers.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}
