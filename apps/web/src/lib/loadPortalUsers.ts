import type { SupabaseClient } from "@supabase/supabase-js";
import { displayAdmissionNo } from "@/lib/admissionNo";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";
import { listBranchAcademicYears } from "@/lib/branchAcademicYears";
import { loadBranchStaffRecords, loadBranchStaffRecordById } from "@/lib/loadBranchStaff";
import { loadBranchStudentById } from "@/lib/loadBranchStudents";
import {
  loadStudentEnrollmentIndexForYear,
  loadStudentProfilesByIds,
  resolveStudentYearEnrollment,
} from "@/lib/studentProfileStore";
import {
  provisionStaffPortalUser,
  provisionStudentPortalUser,
  type ProvisionResult,
} from "@/lib/auth/provision";

export type PortalUserStaff = {
  id: string;
  name: string;
  userId: string;
  password: string;
  passwordLabel: string;
  hasCustomPassword: boolean;
  passwordChangedAt: string;
  designation: string;
  department: string;
  status: string;
  staffKind: "teaching" | "non_teaching";
  provisioned: boolean;
};

export type PortalUserStudent = {
  id: string;
  name: string;
  userId: string;
  password: string;
  admissionNo: string;
  className: string;
  section: string;
  status: string;
  provisioned: boolean;
};

async function resolveYearName(
  admin: SupabaseClient<any>,
  branchId: string,
  academicYearName?: string | null
): Promise<string | null> {
  let yearName = academicYearName?.trim() || null;
  if (!yearName) {
    const years = await listBranchAcademicYears(admin, branchId);
    yearName = years.find((y) => y.is_current)?.name ?? years[0]?.name ?? null;
  }
  return yearName;
}

export async function loadPortalStaffUsers(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  academicYearName?: string | null
): Promise<PortalUserStaff[]> {
  let rows = await loadBranchStaffRecords(admin, schoolSlug, "all", academicYearName);

  // If the selected year has no year-scoped staff profiles yet, fall back to the
  // branch current year so Portal Users is never falsely empty.
  if (!rows.length && academicYearName) {
    const branchId = await resolveBranchUuid(admin, schoolSlug);
    if (branchId) {
      const years = await listBranchAcademicYears(admin, branchId);
      const fallback =
        years.find((y) => y.is_current && y.name !== academicYearName)?.name ??
        years.find((y) => y.name !== academicYearName)?.name ??
        null;
      if (fallback) {
        rows = await loadBranchStaffRecords(admin, schoolSlug, "all", fallback);
      }
    }
  }

  return rows.map((row) => {
    const employeeId = String(row.employeeId ?? row.employee_id ?? row.id ?? "").trim();
    const username = String(row.username ?? employeeId).trim();
    const hasCustomPassword = Boolean(
      row.hasCustomPassword || row.portalPasswordHash || row.passwordChangedAt
    );
    const passwordChangedAt = String(row.passwordChangedAt ?? "").trim();
    const defaultPassword = String(row.portalPassword ?? username ?? employeeId).trim();
    const password = hasCustomPassword ? "" : defaultPassword;
    const changedLabel = passwordChangedAt
      ? `Custom · changed ${passwordChangedAt.slice(0, 10)}`
      : "Custom (staff-set)";
    const passwordLabel = hasCustomPassword ? changedLabel : password;

    return {
      id: String(row.id ?? employeeId),
      name: String(row.name ?? "Unnamed"),
      userId: username || employeeId,
      password,
      passwordLabel,
      hasCustomPassword,
      passwordChangedAt,
      designation: String(row.designation ?? "Staff"),
      department: String(row.department ?? "—"),
      status: String(row.status ?? "Active"),
      staffKind: (row.staffKind as "teaching" | "non_teaching") ?? "teaching",
      provisioned: Boolean(
        (row as Record<string, unknown>).authUid || hasCustomPassword || defaultPassword
      ),
    };
  });
}

export async function loadPortalStudentUsers(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  academicYearName?: string | null
): Promise<PortalUserStudent[]> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return [];

  const yearName = await resolveYearName(admin, branchId, academicYearName);
  if (!yearName) return [];

  // Slim enrollment index — never scan all student profile JSON (statement timeouts).
  const enrollments = await loadStudentEnrollmentIndexForYear(admin, branchId, yearName);
  if (!enrollments.size) return [];

  const enrolledIds = [...enrollments.keys()];
  const [students, profiles] = await Promise.all([
    (async () => {
      const byId = new Map<
        string,
        {
          id: string;
          admission_no: string;
          full_name: string;
          is_active: boolean;
          user_id?: string | null;
        }
      >();
      const BATCH = 80;
      for (let i = 0; i < enrolledIds.length; i += BATCH) {
        const chunk = enrolledIds.slice(i, i + BATCH);
        const { data, error } = await admin
          .from("students")
          .select("id, admission_no, full_name, is_active, user_id")
          .eq("branch_id", branchId)
          .in("id", chunk);
        if (error) throw new Error(error.message);
        for (const row of data ?? []) byId.set(String(row.id), row);
      }
      return byId;
    })(),
    loadStudentProfilesByIds(admin, branchId, enrolledIds),
  ]);

  const results: PortalUserStudent[] = [];

  for (const studentId of enrolledIds) {
    const row = students.get(studentId);
    if (!row) continue;

    const meta = enrollments.get(studentId);
    const profile = profiles.get(studentId) ?? {};
    const enrollment = resolveStudentYearEnrollment(profile, yearName);

    const admissionNo = displayAdmissionNo(String(row.admission_no ?? ""));
    const profileUsername = String(profile.username ?? enrollment?.username ?? "")
      .trim()
      .replace(/^std_/, "");
    const userId =
      String(row.user_id ?? "").trim() ||
      profileUsername ||
      admissionNo ||
      String(row.id).slice(0, 8);
    const password = String(
      profile.portalPassword ?? enrollment?.portalPassword ?? userId
    ).trim();

    results.push({
      id: String(row.id),
      name: String(row.full_name ?? "").trim() || admissionNo || "Unnamed",
      userId,
      password,
      admissionNo: admissionNo || "—",
      className: String(enrollment?.className ?? meta?.className ?? "").trim() || "—",
      section: String(enrollment?.section ?? meta?.section ?? "").trim() || "—",
      status: row.is_active === false ? "Inactive" : "Active",
      provisioned: Boolean(
        (profile as { authUid?: unknown }).authUid ||
          (profile as { portalProvisioned?: unknown }).portalProvisioned
      ),
    });
  }

  results.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  return results;
}

export async function resetPortalUserPassword(
  admin: SupabaseClient<any>,
  params: {
    schoolSlug: string;
    type: "staff" | "student";
    recordId: string;
    password?: string;
    academicYear?: string | null;
  }
): Promise<ProvisionResult> {
  if (params.type === "staff") {
    const detail = await loadBranchStaffRecordById(admin, params.schoolSlug, params.recordId, {
      academicYearName: params.academicYear,
    });
    if (!detail) {
      return { ok: false, configured: true, error: "Staff member not found" };
    }

    const employeeId = String(detail.staff.employeeId ?? detail.staff.employee_id ?? "").trim();
    if (!employeeId) {
      return { ok: false, configured: true, error: "Staff employee ID is missing" };
    }

    const password = String(params.password ?? "").trim() || employeeId;

    return provisionStaffPortalUser(admin, {
      type: "staff",
      schoolId: params.schoolSlug,
      displayName: String(detail.staff.name ?? employeeId),
      employeeId,
      roleTitle: String(detail.staff.designation ?? "Staff"),
      department: String(detail.staff.department ?? "General"),
      password,
      email: detail.staff.email ? String(detail.staff.email) : undefined,
      phone: detail.staff.phone ? String(detail.staff.phone) : undefined,
      category: detail.staffKind === "non_teaching" ? "nonTeaching" : "teaching",
    });
  }

  const student = await loadBranchStudentById(
    admin,
    params.schoolSlug,
    params.recordId,
    params.academicYear
  );
  if (!student) {
    return { ok: false, configured: true, error: "Student not found" };
  }

  const username = String(student.username ?? student.admissionNo ?? "")
    .trim()
    .replace(/^std_/, "");
  const defaultPassword = username || String(student.admissionNo ?? "").trim();
  const password = String(params.password ?? "").trim() || defaultPassword;

  if (!password) {
    return { ok: false, configured: true, error: "Could not derive a default password" };
  }

  return provisionStudentPortalUser(admin, {
    type: "student",
    schoolId: params.schoolSlug,
    displayName: String(student.name ?? student.studentName ?? username),
    username: username || defaultPassword,
    studentDocId: params.recordId,
    password,
    email: student.email ? String(student.email) : undefined,
  });
}
