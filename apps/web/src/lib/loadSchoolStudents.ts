import { supabase, getSchoolUuidFromSlug } from "@/lib/supabase/client";
import { getActiveAcademicYear } from "@/lib/academicYear";

export type SchoolStudentRow = {
  id: string;
  name: string;
  grade: string;
  section: string;
  className: string;
  roll: string;
  admissionNo: string;
  status: "Active" | "Inactive";
  email: string | null;
};

type EnrollmentRow = {
  roll_number: string | null;
  students: {
    id: string;
    admission_number: string | null;
    status: string | null;
    users: { full_name: string | null; email: string | null } | { full_name: string | null; email: string | null }[] | null;
  } | null;
  sections: {
    name: string | null;
    grades: { name: string | null } | { name: string | null }[] | null;
  } | null;
};

function gradeFromRow(sections: EnrollmentRow["sections"]): string {
  if (!sections?.grades) return "";
  const g = sections.grades;
  if (Array.isArray(g)) return String(g[0]?.name ?? "").trim();
  return String(g.name ?? "").trim();
}

function userFromStudent(students: EnrollmentRow["students"]) {
  if (!students?.users) return { full_name: null, email: null };
  const u = students.users;
  if (Array.isArray(u)) return u[0] ?? { full_name: null, email: null };
  return u;
}

/** Load all students enrolled in the current academic year for a school slug. */
export async function loadSchoolStudents(schoolSlug: string): Promise<SchoolStudentRow[]> {
  const schoolUuid = await getSchoolUuidFromSlug(schoolSlug);
  if (!schoolUuid) return [];

  const academicYear = await getActiveAcademicYear(schoolSlug);

  let query = supabase
    .from("student_section_enrollments")
    .select(
      `
      roll_number,
      students!inner (
        id,
        admission_number,
        status,
        users ( full_name, email )
      ),
      sections!inner (
        name,
        grades ( name )
      )
    `
    )
    .eq("school_id", schoolUuid);

  if (academicYear?.id) {
    query = query.eq("academic_year_id", academicYear.id);
  }

  const { data, error } = await query;

  if (error) {
    console.warn("loadSchoolStudents:", error.message);
    return loadSchoolStudentsFallback(schoolUuid, schoolSlug);
  }

  const rows = ((data ?? []) as unknown as EnrollmentRow[]).map((row) => {
    const student = row.students!;
    const user = userFromStudent(student);
    const grade = gradeFromRow(row.sections);
    const section = String(row.sections?.name ?? "").trim();
    const rawStatus = String(student.status ?? "active").toLowerCase();

    return {
      id: student.id,
      name: String(user.full_name ?? "Unnamed").trim(),
      grade,
      section,
      className: grade,
      roll: String(row.roll_number ?? "—"),
      admissionNo: String(student.admission_number ?? "—"),
      status: (rawStatus === "inactive" ? "Inactive" : "Active") as "Active" | "Inactive",
      email: user.email ?? null,
    };
  });

  if (rows.length === 0) {
    return loadSchoolStudentsFallback(schoolUuid, schoolSlug);
  }

  return rows;
}

async function loadSchoolStudentsFallback(schoolUuid: string, schoolSlug: string): Promise<SchoolStudentRow[]> {
  const { data, error } = await supabase
    .from("students")
    .select("id, admission_number, status, users ( full_name, email )")
    .eq("school_id", schoolUuid)
    .eq("status", "active");

  if (error || !data?.length) {
    if (error) console.warn("loadSchoolStudentsFallback:", error.message);
    return [];
  }

  return data.map((row) => {
    const users = row.users as { full_name?: string; email?: string } | { full_name?: string; email?: string }[] | null;
    const user = Array.isArray(users) ? users[0] : users;
    const rawStatus = String(row.status ?? "active").toLowerCase();
    return {
      id: row.id,
      name: String(user?.full_name ?? "Unnamed").trim(),
      grade: "—",
      section: "—",
      className: "—",
      roll: "—",
      admissionNo: String(row.admission_number ?? "—"),
      status: (rawStatus === "inactive" ? "Inactive" : "Active") as "Active" | "Inactive",
      email: user?.email ?? null,
    };
  });
}
