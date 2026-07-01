import type { SupabaseClient } from "@supabase/supabase-js";
import { listBranchAcademicYears } from "@/lib/branchAcademicYears";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";
import {
  profileTitle,
  resolveStaffYearProfile,
  STAFF_PROFILE_NOTICE_PREFIX,
  type StaffProfileData,
} from "@/lib/staffProfileStore";

export { STAFF_PROFILE_NOTICE_PREFIX, baseEmployeeId } from "@/lib/staffProfileStore";

export type { StaffProfileData };

export async function loadStaffProfileData(
  admin: SupabaseClient<any>,
  branchId: string,
  staffId: string
): Promise<StaffProfileData> {
  const { data, error } = await admin
    .from("notices")
    .select("content")
    .eq("branch_id", branchId)
    .eq("title", profileTitle(staffId))
    .maybeSingle();

  if (error || !data?.content) return {};

  try {
    const parsed = JSON.parse(String(data.content));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export async function saveStaffProfileData(
  admin: SupabaseClient<any>,
  branchId: string,
  staffId: string,
  profile: StaffProfileData
): Promise<void> {
  const title = profileTitle(staffId);
  const content = JSON.stringify(profile ?? {});

  const { data: existing, error: loadError } = await admin
    .from("notices")
    .select("id")
    .eq("branch_id", branchId)
    .eq("title", title)
    .maybeSingle();

  if (loadError) throw new Error(loadError.message);

  if (existing?.id) {
    const { error } = await admin.from("notices").update({ content }).eq("id", existing.id);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await admin.from("notices").insert({
    branch_id: branchId,
    title,
    content,
    target: "system",
    posted_on: new Date().toISOString().slice(0, 10),
  });

  if (error) throw new Error(error.message);
}

export function shapeStaffRowForUi(
  row: Record<string, unknown>,
  profile: StaffProfileData,
  yearProfile: StaffProfileData,
  kind: "teaching" | "non_teaching",
  academicYear: string
): Record<string, unknown> {
  const fullName = String(row.full_name ?? "").trim() || "Unnamed";
  const parts = fullName.split(/\s+/);
  const department = String(
    yearProfile.department ?? row.department ?? (kind === "teaching" ? "TEACHING" : "General")
  );
  const designation = String(yearProfile.designation ?? row.designation ?? "Staff");
  const classes = String(yearProfile.classes ?? "").trim();
  const subjects = String(yearProfile.subjects ?? row.subject ?? "").trim();
  const username = String(profile.username ?? row.employee_id ?? "").trim();
  const portalPassword = String(yearProfile.portalPassword ?? yearProfile.password ?? "").trim();

  const extended = {
    empCode: profile.empCode,
    fatherName: profile.fatherName,
    motherName: profile.motherName,
    maritalStatus: profile.maritalStatus,
    fatherOccupation: profile.fatherOccupation,
    motherOccupation: profile.motherOccupation,
    spouseName: profile.spouseName,
    spouseContact: profile.spouseContact,
    childrenCount: profile.childrenCount,
    permanentAddress: profile.permanentAddress,
    correspondenceAddress: profile.correspondenceAddress,
    aadharNo: profile.aadharNo,
    panNo: profile.panNo,
    qualification: profile.qualification ?? (row.qualification ? String(row.qualification) : undefined),
    confirmationDate: profile.confirmationDate,
    trainedStatus: profile.trainedStatus,
    availingTransport: profile.availingTransport,
    busNo: profile.busNo,
    route: profile.route,
    stop: profile.stop,
    spouseOrganisation: profile.spouseOrganisation,
    lockerNo: profile.lockerNo,
    lockerKey: profile.lockerKey,
    schoolWing: profile.schoolWing,
    previousSchool: profile.previousSchool,
    bloodGroup: profile.bloodGroup,
    computerKnowledge: profile.computerKnowledge,
    experienceMonths: profile.experienceMonths,
    relatives: profile.relatives,
    probationMonths: profile.probationMonths,
    employmentStatus: profile.employmentStatus,
    remarks: profile.remarks,
    resigningDate: profile.resigningDate,
    noticePeriodDays: profile.noticePeriodDays,
    emergencyPerson: profile.emergencyPerson,
    emergencyContact: profile.emergencyContact,
    gender: profile.gender ?? row.gender,
    dob: profile.dob ?? (row.dob ? String(row.dob) : undefined),
  };

  const qualificationValue = extended.qualification;

  return {
    id: row.id,
    employeeId: String(row.employee_id ?? row.id),
    employee_id: row.employee_id,
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
    name: fullName,
    department,
    departmentId: department,
    designation,
    phone: row.phone ? String(row.phone) : "",
    mobile: row.phone ? String(row.phone) : "",
    email: row.email ? String(row.email) : "",
    dob: row.dob ? String(row.dob) : "",
    subject: subjects || String(row.subject ?? ""),
    subjects: subjects ? subjects.split(",").map((s) => s.trim()).filter(Boolean) : [],
    classes,
    classTeacher: String(yearProfile.classTeacher ?? ""),
    username,
    portalPassword,
    status: row.is_active === false ? "Inactive" : "Active",
    joiningDate: row.join_date ? String(row.join_date) : "",
    joinDate: row.join_date ? String(row.join_date) : "",
    employmentType: String(profile.employmentStatus ?? "Full-Time"),
    academicYear,
    staffKind: kind,
    qualifications: qualificationValue ? [String(qualificationValue)] : [],
    ...Object.fromEntries(
      Object.entries(extended).filter(([, value]) => value !== undefined && value !== null && value !== "")
    ),
  };
}

async function loadStaffTableForYear(
  admin: SupabaseClient<any>,
  branchId: string,
  table: "teachers" | "non_teaching_staff",
  kind: "teaching" | "non_teaching",
  yearName: string
): Promise<Record<string, unknown>[]> {
  const { data, error } = await admin
    .from(table)
    .select("*")
    .eq("branch_id", branchId)
    .order("full_name", { ascending: true });

  if (error) throw new Error(error.message);

  const results: Record<string, unknown>[] = [];

  for (const row of data ?? []) {
    const profile = await loadStaffProfileData(admin, branchId, String(row.id));
    const yearProfile = resolveStaffYearProfile(profile, yearName);
    if (!yearProfile) continue;

    results.push(
      shapeStaffRowForUi(row as Record<string, unknown>, profile, yearProfile, kind, yearName)
    );
  }

  return results;
}

export async function loadBranchStaffRecords(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  kind: "teaching" | "non_teaching" | "all" = "all",
  academicYearName?: string | null
): Promise<Record<string, unknown>[]> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return [];

  let yearName = academicYearName?.trim() || null;
  if (!yearName) {
    const years = await listBranchAcademicYears(admin, branchId);
    yearName = years.find((y) => y.is_current)?.name ?? years[0]?.name ?? "2022-23";
  }

  const results: Record<string, unknown>[] = [];

  if (kind === "teaching" || kind === "all") {
    results.push(...(await loadStaffTableForYear(admin, branchId, "teachers", "teaching", yearName)));
  }

  if (kind === "non_teaching" || kind === "all") {
    results.push(
      ...(await loadStaffTableForYear(admin, branchId, "non_teaching_staff", "non_teaching", yearName))
    );
  }

  return results.sort((a, b) =>
    String(a.name ?? "").localeCompare(String(b.name ?? ""), undefined, { sensitivity: "base" })
  );
}

export type BranchStaffDetail = {
  staff: Record<string, unknown>;
  profile: StaffProfileData;
  staffKind: "teaching" | "non_teaching";
};

export async function loadBranchStaffRecordById(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  staffId: string,
  options?: {
    academicYearName?: string | null;
    kind?: "teaching" | "non_teaching";
  }
): Promise<BranchStaffDetail | null> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return null;

  let yearName = options?.academicYearName?.trim() || null;
  if (!yearName) {
    const years = await listBranchAcademicYears(admin, branchId);
    yearName = years.find((y) => y.is_current)?.name ?? years[0]?.name ?? "2022-23";
  }

  const tables: Array<{ table: "teachers" | "non_teaching_staff"; kind: "teaching" | "non_teaching" }> =
    options?.kind === "non_teaching"
      ? [{ table: "non_teaching_staff", kind: "non_teaching" }]
      : options?.kind === "teaching"
        ? [{ table: "teachers", kind: "teaching" }]
        : [
            { table: "teachers", kind: "teaching" },
            { table: "non_teaching_staff", kind: "non_teaching" },
          ];

  for (const { table, kind } of tables) {
    const { data, error } = await admin
      .from(table)
      .select("*")
      .eq("branch_id", branchId)
      .eq("id", staffId)
      .maybeSingle();

    if (error || !data) continue;

    const profile = await loadStaffProfileData(admin, branchId, staffId);
    const yearProfile = resolveStaffYearProfile(profile, yearName) ?? {};

    return {
      staff: shapeStaffRowForUi(
        data as Record<string, unknown>,
        profile,
        yearProfile,
        kind,
        yearName
      ),
      profile: { ...profile, ...yearProfile },
      staffKind: kind,
    };
  }

  return null;
}
