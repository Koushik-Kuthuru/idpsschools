import type { SupabaseClient } from "@supabase/supabase-js";
import { compareGrades } from "@/lib/gradeOrder";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";
import { listBranchAcademicYears } from "@/lib/branchAcademicYears";

export type BranchClassRecord = {
  id: string;
  grade: string;
  section: string;
  academicYear: string;
  strength: number;
  status: "Active" | "Inactive";
  classTeacherId?: string | null;
};

export async function resolveAcademicYearName(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  academicYearName?: string | null
): Promise<string | null> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return null;

  let yearName = academicYearName?.trim() || null;
  if (!yearName) {
    const years = await listBranchAcademicYears(admin, branchId);
    yearName = years.find((y) => y.is_current)?.name ?? years[0]?.name ?? null;
  }
  return yearName;
}

export async function loadBranchClassRecords(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  academicYearName?: string | null
): Promise<BranchClassRecord[]> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return [];

  const yearName = await resolveAcademicYearName(admin, schoolSlug, academicYearName);
  if (!yearName) return [];

  const { data, error } = await admin
    .from("classes")
    .select("id, class_name, section, academic_year, total_students, class_teacher_id")
    .eq("branch_id", branchId)
    .eq("academic_year", yearName)
    .order("class_name", { ascending: true });

  if (error || !data?.length) return [];

  const records = data.map((row) => ({
    id: row.id,
    grade: String(row.class_name ?? "").trim() || "Unknown",
    section: String(row.section ?? "").trim().toUpperCase() || "—",
    academicYear: String(row.academic_year ?? yearName),
    strength: Number(row.total_students ?? 0),
    status: "Active" as const,
    classTeacherId: row.class_teacher_id ? String(row.class_teacher_id) : null,
  }));

  return records.sort((a, b) => {
    const byGrade = compareGrades(a.grade, b.grade);
    if (byGrade !== 0) return byGrade;
    return a.section.localeCompare(b.section, undefined, { sensitivity: "base" });
  });
}
