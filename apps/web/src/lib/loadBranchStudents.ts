import type { SupabaseClient } from "@supabase/supabase-js";
import { displayAdmissionNo } from "@/lib/admissionNo";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";
import { listBranchAcademicYears } from "@/lib/branchAcademicYears";
import {
  fetchAllPaginated,
  loadAllStudentProfiles,
  loadStudentProfileData,
  mergeStudentEnrollment,
  resolveFatherName,
  resolveStudentYearEnrollment,
  saveStudentProfileData,
  splitParentNames,
  splitStudentUpdatePayload,
  type StudentProfileData,
  type StudentYearEnrollment,
} from "@/lib/studentProfileStore";

export type BranchStudentRow = {
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

export type BranchTransportStudentRow = BranchStudentRow & {
  usesTransport: boolean;
  busNo: string;
  route: string;
  stoppage: string;
  driverName: string;
  driverMobile: string;
  /** Monthly transport fee amounts (Jan–Dec), from profile transportDetails.fees */
  transportFees: number[];
};

function transportDetailsFromProfile(profile: Record<string, unknown>) {
  const td = (profile.transportDetails ?? {}) as Record<string, unknown>;
  const feesRaw = td.fees;
  const transportFees = Array.isArray(feesRaw)
    ? feesRaw.map((v) => Number(v) || 0)
    : [];
  return {
    usesTransport: String(td.facility ?? "").toUpperCase() === "YES",
    busNo: String(td.busNo ?? "").trim() || "—",
    route: String(td.route ?? "").trim() || "—",
    stoppage: String(td.stoppage ?? "").trim() || "—",
    driverName: String(td.driverName ?? "").trim() || "—",
    driverMobile: String(td.driverMobile ?? "").trim() || "—",
    transportFees,
  };
}

export type BranchStudentDetail = Record<string, unknown> & {
  id: string;
  name: string;
  studentName: string;
  firstName: string;
  lastName: string;
  classId: string;
  grade: string;
  section: string;
  admissionNo: string;
  admission_number: string;
  rollNumber: string;
  status: "Active" | "Inactive";
};

function genderLabel(raw: string | null | undefined): string {
  const g = String(raw ?? "").trim().toLowerCase();
  if (g === "male" || g === "m") return "Male";
  if (g === "female" || g === "f") return "Female";
  return String(raw ?? "").trim() || "";
}

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

export function shapeBranchStudentDetail(
  row: Record<string, unknown>,
  enrollment?: StudentYearEnrollment | null,
  academicYear?: string
): BranchStudentDetail {
  const classes = row.classes as
    | { class_name?: string; section?: string; academic_year?: string }
    | { class_name?: string; section?: string; academic_year?: string }[]
    | null;
  const cls = Array.isArray(classes) ? classes[0] : classes;

  const fullName = String(row.full_name ?? row.name ?? "").trim();
  const parts = fullName.split(/\s+/);
  const admissionNo = displayAdmissionNo(String(row.admission_no ?? row.admission_number ?? ""));
  const className =
    String(enrollment?.className ?? cls?.class_name ?? row.classId ?? "").trim() || "—";
  const section =
    String(enrollment?.section ?? cls?.section ?? row.section ?? "")
      .trim()
      .toUpperCase() || "—";
  const parentPhone = row.parent_phone ? String(row.parent_phone) : null;
  const parentName = row.parent_name ? String(row.parent_name) : null;
  const id = String(row.id);
  const portalUsername = `std_${(admissionNo || id.slice(0, 6)).toLowerCase().replace(/[^a-z0-9_]/g, "")}`;

  return {
    id,
    name: fullName || admissionNo || "Unnamed",
    studentName: fullName || admissionNo || "Unnamed",
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
    classId: className,
    grade: className,
    section,
    admissionNo,
    admission_number: admissionNo,
    admissionNumber: admissionNo,
    rollNumber: admissionNo,
    status: row.is_active === false ? "Inactive" : "Active",
    dob: row.dob ? String(row.dob) : "",
    gender: genderLabel(row.gender as string | null),
    parentName,
    fatherName: parentName ?? "",
    parentPhone,
    mobileNumber: parentPhone,
    permMobile: parentPhone,
    fatherMobile1: parentPhone,
    address: row.address ? String(row.address) : "",
    photo_url: row.photo_url ? String(row.photo_url) : "",
    photo: row.photo_url ? String(row.photo_url) : "",
    academicYear: academicYear ?? String(cls?.academic_year ?? row.academicYear ?? ""),
    is_active: row.is_active !== false,
    username: portalUsername,
    portalPassword: portalUsername,
  };
}

export function mergeStudentForUi(
  row: Record<string, unknown>,
  profile: StudentProfileData,
  academicYear?: string,
  enrollment?: StudentYearEnrollment | null
): BranchStudentDetail {
  const yearEnrollment =
    enrollment ?? (academicYear ? resolveStudentYearEnrollment(profile, academicYear) : null);
  const base = shapeBranchStudentDetail(row, yearEnrollment, academicYear);
  const fromParents = splitParentNames(String(base.parentName ?? ""));

  const photos = profile.photos as Record<string, string> | undefined;
  const yearFields = yearEnrollment ?? {};

  const merged: BranchStudentDetail = {
    ...base,
    ...profile,
    ...yearFields,
    fatherName: String(yearFields.fatherName ?? profile.fatherName ?? fromParents.fatherName ?? ""),
    motherName: String(yearFields.motherName ?? profile.motherName ?? fromParents.motherName ?? ""),
    fatherMobile1: String(yearFields.fatherMobile1 ?? profile.fatherMobile1 ?? base.fatherMobile1 ?? ""),
    motherMobile1: String(yearFields.motherMobile1 ?? profile.motherMobile1 ?? ""),
    permAddress: String(yearFields.permAddress ?? profile.permAddress ?? base.address ?? ""),
    address: String(base.address ?? yearFields.permAddress ?? profile.permAddress ?? ""),
    photo: String(photos?.student ?? profile.photo ?? base.photo_url ?? ""),
    username: String(profile.username ?? yearFields.username ?? base.username ?? ""),
    portalPassword: String(profile.portalPassword ?? yearFields.portalPassword ?? base.portalPassword ?? ""),
    aadharNo: String(yearFields.aadharNo ?? profile.aadharNo ?? ""),
    studentName: base.studentName,
    name: base.name,
    classId: base.classId,
    grade: base.grade,
    section: base.section,
    admissionNo: base.admissionNo,
    status: base.status,
    dob: base.dob,
    gender: base.gender,
    academicYear: academicYear ?? base.academicYear,
  };

  return merged;
}

function shapeBranchStudentListRow(
  row: Record<string, unknown>,
  enrollment: StudentYearEnrollment,
  yearName: string,
  profile: StudentProfileData = {}
): BranchStudentRow {
  const fatherName = resolveFatherName(profile, enrollment, row.parent_name ? String(row.parent_name) : null) || "—";

  return {
    id: String(row.id),
    name: String(row.full_name ?? "").trim() || displayAdmissionNo(String(row.admission_no ?? "")) || "Unnamed",
    className: String(enrollment.className ?? "").trim() || "—",
    section: String(enrollment.section ?? "").trim() || "—",
    roll: displayAdmissionNo(String(row.admission_no ?? "")) || "—",
    admissionNo: displayAdmissionNo(String(row.admission_no ?? "")) || "—",
    status: row.is_active === false ? "Inactive" : "Active",
    academicYear: yearName,
    parentPhone: row.parent_phone ? String(row.parent_phone) : null,
    fatherName,
  };
}

export async function updateBranchStudent(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  studentId: string,
  payload: Record<string, unknown>
): Promise<BranchStudentDetail | null> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId || !studentId) return null;

  const existingProfile = await loadStudentProfileData(admin, branchId, studentId);
  const { core, profile } = splitStudentUpdatePayload(payload);
  const mergedProfile = { ...existingProfile, ...profile };

  if (Object.keys(core).length > 0) {
    const { error } = await admin
      .from("students")
      .update(core)
      .eq("id", studentId)
      .eq("branch_id", branchId);
    if (error) throw new Error(error.message);
  }

  if (Object.keys(mergedProfile).length > 0) {
    await saveStudentProfileData(admin, branchId, studentId, mergedProfile);
  }

  const academicYear =
    typeof payload.academicYear === "string" ? payload.academicYear : undefined;
  return loadBranchStudentById(admin, schoolSlug, studentId, academicYear);
}

export async function loadBranchStudentById(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  studentId: string,
  academicYearName?: string | null
): Promise<BranchStudentDetail | null> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId || !studentId) return null;

  const yearName = await resolveYearName(admin, branchId, academicYearName);
  if (!yearName) return null;

  const { data, error } = await admin
    .from("students")
    .select(
      "id, admission_no, full_name, dob, gender, is_active, parent_name, parent_phone, address, photo_url, branch_id, classes(class_name, section, academic_year)"
    )
    .eq("id", studentId)
    .eq("branch_id", branchId)
    .maybeSingle();

  if (error || !data) return null;

  const profile = await loadStudentProfileData(admin, branchId, studentId);
  const enrollment = resolveStudentYearEnrollment(profile, yearName);
  if (!enrollment) return null;

  return mergeStudentForUi(data as Record<string, unknown>, profile, yearName, enrollment);
}

export async function loadBranchStudents(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  academicYearName?: string | null
): Promise<BranchStudentRow[]> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return [];

  const yearName = await resolveYearName(admin, branchId, academicYearName);
  if (!yearName) return [];

  const [students, profiles] = await Promise.all([
    fetchAllPaginated<{
      id: string;
      admission_no: string;
      full_name: string;
      is_active: boolean;
      parent_phone: string | null;
      parent_name: string | null;
    }>(admin, "students", "id, admission_no, full_name, is_active, parent_phone, parent_name", (query) =>
      query.eq("branch_id", branchId).order("full_name", { ascending: true })
    ),
    loadAllStudentProfiles(admin, branchId),
  ]);

  if (!students.length) return [];

  const results: BranchStudentRow[] = [];

  for (const row of students) {
    const profile = profiles.get(String(row.id)) ?? {};
    const enrollment = resolveStudentYearEnrollment(profile, yearName);
    if (!enrollment) continue;

    results.push(shapeBranchStudentListRow(row as Record<string, unknown>, enrollment, yearName, profile));
  }

  return results;
}

export async function loadBranchTransportStudents(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  academicYearName?: string | null
): Promise<BranchTransportStudentRow[]> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return [];

  const yearName = await resolveYearName(admin, branchId, academicYearName);
  if (!yearName) return [];

  const [students, profiles] = await Promise.all([
    fetchAllPaginated<{
      id: string;
      admission_no: string;
      full_name: string;
      is_active: boolean;
      parent_phone: string | null;
      parent_name: string | null;
    }>(admin, "students", "id, admission_no, full_name, is_active, parent_phone, parent_name", (query) =>
      query.eq("branch_id", branchId).order("full_name", { ascending: true })
    ),
    loadAllStudentProfiles(admin, branchId),
  ]);

  if (!students.length) return [];

  const results: BranchTransportStudentRow[] = [];

  for (const row of students) {
    const profile = profiles.get(String(row.id)) ?? {};
    const enrollment = resolveStudentYearEnrollment(profile, yearName);
    if (!enrollment) continue;

    const base = shapeBranchStudentListRow(row as Record<string, unknown>, enrollment, yearName, profile);
    const transport = transportDetailsFromProfile(profile);

    results.push({
      ...base,
      ...transport,
    });
  }

  return results;
}

export async function loadBranchClasses(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  academicYearName?: string | null
): Promise<{ className: string; section: string }[]> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return [];

  const yearName = await resolveYearName(admin, branchId, academicYearName);
  if (!yearName) return [];

  const { data, error } = await admin
    .from("classes")
    .select("class_name, section")
    .eq("branch_id", branchId)
    .eq("academic_year", yearName)
    .order("class_name");

  if (error || !data?.length) return [];

  return data.map((row) => ({
    className: String(row.class_name ?? "").trim(),
    section: String(row.section ?? "").trim(),
  }));
}

export { mergeStudentEnrollment, resolveStudentYearEnrollment };
