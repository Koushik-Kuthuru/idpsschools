import { supabase, getSchoolUuidFromSlug } from "@/lib/supabase/client";
import { getActiveAcademicYear } from "@/lib/academicYear";
import { classScopeKey, teacherKeysFromDoc } from "@/lib/teacherClassScope";

type SectionRow = {
  name?: string | null;
  grades?: { name?: string | null } | { name?: string | null }[] | null;
};

type AssignmentRow = {
  sections?: SectionRow | SectionRow[] | null;
};

function addSectionKeys(keys: Set<string>, gradeRaw: unknown, sectionRaw: unknown) {
  const grade = String(gradeRaw ?? "").trim();
  const section = String(sectionRaw ?? "").trim();
  if (grade && section) keys.add(classScopeKey(grade, section));
}

function gradeFromSectionRow(section: SectionRow | null | undefined): string {
  if (!section?.grades) return "";
  const grades = section.grades;
  if (Array.isArray(grades)) return String(grades[0]?.name ?? "").trim();
  return String(grades.name ?? "").trim();
}

async function loadFromSupabaseSchema(schoolSlug: string, userUid: string): Promise<Set<string>> {
  const keys = new Set<string>();
  const schoolUuid = await getSchoolUuidFromSlug(schoolSlug);
  if (!schoolUuid) return keys;

  const academicYear = await getActiveAcademicYear(schoolSlug);

  let homeroomQuery = supabase
    .from("sections")
    .select("name, grades(name)")
    .eq("school_id", schoolUuid)
    .eq("class_teacher_id", userUid);

  if (academicYear?.id) {
    homeroomQuery = homeroomQuery.eq("academic_year_id", academicYear.id);
  }

  const { data: homeroomSections, error: homeroomError } = await homeroomQuery;

  if (homeroomError) {
    console.warn("Teacher scope: sections query failed", homeroomError.message);
  } else {
    (homeroomSections as SectionRow[] | null)?.forEach((row) => {
      addSectionKeys(keys, gradeFromSectionRow(row), row.name);
    });
  }

  let assignmentQuery = supabase
    .from("teacher_subject_assignments")
    .select("sections(name, grades(name))")
    .eq("school_id", schoolUuid)
    .eq("teacher_id", userUid);

  if (academicYear?.id) {
    assignmentQuery = assignmentQuery.eq("academic_year_id", academicYear.id);
  }

  const { data: teachingAssignments, error: assignmentError } = await assignmentQuery;

  if (assignmentError) {
    console.warn("Teacher scope: teacher_subject_assignments query failed", assignmentError.message);
  } else {
    (teachingAssignments as AssignmentRow[] | null)?.forEach((row) => {
      const section = Array.isArray(row.sections) ? row.sections[0] : row.sections;
      addSectionKeys(keys, gradeFromSectionRow(section ?? undefined), section?.name);
    });
  }

  return keys;
}

function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const code = error.code ?? "";
  const message = error.message ?? "";
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    message.includes("Could not find the table") ||
    message.includes("does not exist")
  );
}

async function loadFromLegacyTable(
  schoolSlug: string,
  table: string,
  onRow: (row: Record<string, unknown>) => void
): Promise<void> {
  const { data, error } = await supabase.from(table).select("*").eq("school_id", schoolSlug);
  if (error) {
    if (!isMissingTableError(error)) {
      console.warn(`Teacher scope: ${table} query failed`, error.message);
    }
    return;
  }
  (data ?? []).forEach((row) => onRow(row as Record<string, unknown>));
}

async function loadFromLegacyClasses(schoolSlug: string, userUid: string): Promise<Set<string>> {
  const keys = new Set<string>();
  await loadFromLegacyTable(schoolSlug, "classes", (data) => {
    const teacherId = data.classTeacherId ?? data.class_teacher_id;
    if (teacherId && String(teacherId) === userUid) {
      addSectionKeys(keys, data.grade ?? data.name, data.section);
    }
  });
  return keys;
}

async function loadFromLegacyStaffProfiles(
  schoolSlug: string,
  userUid: string,
  userEmail: string | null
): Promise<Set<string>> {
  const keys = new Set<string>();
  const normalizedEmail = String(userEmail ?? "").toLowerCase();

  for (const collection of ["teaching_staff", "teachers"] as const) {
    let matched = false;
    await loadFromLegacyTable(schoolSlug, collection, (data) => {
      const rowId = String(data.id ?? "");
      const authUid = data.authUid ?? data.auth_uid ?? data.userId ?? data.user_id;
      const email = String(data.email ?? data.loginEmail ?? "").toLowerCase();
      const isCurrentTeacher =
        rowId === userUid ||
        (authUid && String(authUid) === userUid) ||
        (email && normalizedEmail && email === normalizedEmail);

      if (isCurrentTeacher) {
        matched = true;
        teacherKeysFromDoc(data).forEach((k) => keys.add(k));
      }
    });
    if (matched) break;
  }

  return keys;
}

export async function loadTeacherClassKeys(
  schoolSlug: string,
  userUid: string,
  userEmail: string | null
): Promise<string[]> {
  const keys = new Set<string>();

  const fromSchema = await loadFromSupabaseSchema(schoolSlug, userUid);
  fromSchema.forEach((k) => keys.add(k));

  const fromLegacyClasses = await loadFromLegacyClasses(schoolSlug, userUid);
  fromLegacyClasses.forEach((k) => keys.add(k));

  const fromLegacyStaff = await loadFromLegacyStaffProfiles(schoolSlug, userUid, userEmail);
  fromLegacyStaff.forEach((k) => keys.add(k));

  return Array.from(keys);
}
