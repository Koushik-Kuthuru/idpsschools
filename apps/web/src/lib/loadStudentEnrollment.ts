import { supabase, getSchoolUuidFromSlug } from "@/lib/supabase/client";
import { getActiveAcademicYear } from "@/lib/academicYear";

export type StudentEnrollment = {
  grade: string;
  section: string;
  className: string;
  rollNumber: string;
  academicYearName: string;
};

/** Load student's class for the current (or latest) academic year from enrollments. */
export async function loadStudentEnrollment(
  schoolSlug: string,
  userId: string
): Promise<StudentEnrollment | null> {
  const schoolUuid = await getSchoolUuidFromSlug(schoolSlug);
  if (!schoolUuid || !userId) return null;

  const academicYear = await getActiveAcademicYear(schoolSlug);
  if (!academicYear) return null;

  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id")
    .eq("school_id", schoolUuid)
    .eq("user_id", userId)
    .maybeSingle();

  if (studentError || !student?.id) return null;

  const { data: enrollment, error: enrollError } = await supabase
    .from("student_section_enrollments")
    .select("roll_number, sections(name, grades(name))")
    .eq("school_id", schoolUuid)
    .eq("student_id", student.id)
    .eq("academic_year_id", academicYear.id)
    .maybeSingle();

  if (enrollError || !enrollment) return null;

  const section = enrollment.sections as { name?: string; grades?: { name?: string } | { name?: string }[] } | null;
  const grades = section?.grades;
  const gradeName = Array.isArray(grades) ? grades[0]?.name : grades?.name;
  const grade = String(gradeName ?? "").trim();
  const sectionName = String(section?.name ?? "").trim();

  return {
    grade,
    section: sectionName,
    className: grade && sectionName ? `${grade}-${sectionName}` : grade || sectionName,
    rollNumber: String(enrollment.roll_number ?? ""),
    academicYearName: academicYear.name,
  };
}
