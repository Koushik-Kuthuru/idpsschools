import type { SupabaseClient } from "@supabase/supabase-js";
import { displayAdmissionNo } from "@/lib/admissionNo";
import { datesFromYearName, listBranchAcademicYears } from "@/lib/branchAcademicYears";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";
import {
  fetchAllPaginated,
  loadAllStudentProfiles,
  loadStudentEnrollmentIndexForYear,
  loadStudentProfileData,
  loadStudentProfilesByIds,
  mergeStudentEnrollment,
  profileTitle,
  resolveFatherName,
  resolveStudentPhotoUrl,
  resolveStudentYearEnrollment,
  saveStudentProfileData,
  splitParentNames,
  splitStudentUpdatePayload,
  STUDENT_PROFILE_NOTICE_PREFIX,
  type StudentAttendanceDates,
  type StudentListEnrollmentMeta,
  type StudentProfileData,
  type StudentYearEnrollment,
} from "@/lib/studentProfileStore";
import { formatReportDate } from "@/lib/term1ReportCard";
import {
  loadNewAdmissionsRegistry,
  registryAdmissionDates,
  registryAdmissionNoSet,
} from "@/lib/newAdmissionsRegistry";
import {
  loadNsoRegistry,
  nsoRegistryAdmissionNoSet,
} from "@/lib/nsoRegistry";
import {
  cancelledRegistryAdmissionNoSet,
  loadCancelledAdmissionsRegistry,
} from "@/lib/cancelledAdmissionsRegistry";
import { invalidateServerCache, withServerCache } from "@/lib/serverQueryCache";
import { academicYearAprMarRange, calculateAttendanceStats } from "@/utils/attendance";

export type StudentListCohort = "enrolled" | "new-admissions" | "nso" | "cancelled";

export type BranchStudentRow = {
  id: string;
  name: string;
  className: string;
  section: string;
  gender: string;
  roll: string;
  admissionNo: string;
  status: "Active" | "Inactive" | "Cancelled";
  academicYear: string;
  parentPhone: string | null;
  fatherName: string;
  motherName?: string;
  dob?: string;
  permanentAddress?: string;
  correspondingAddress?: string;
  photoUrl?: string;
  /** School bus transport facility. */
  usesTransport?: boolean;
  /** Boarder / hostel student. */
  usesHostel?: boolean;
  /** Day scholar without school transport. */
  usesOwnTransport?: boolean;
  studentType?: string;
  admissionDate?: string;
  admissionClass?: string;
  /** Last enrolled year before leaving (NSO). */
  previousAcademicYear?: string;
  /** Official NSO date from school records. */
  nsoDate?: string;
  /** NSO reason: Discontinued, Shifted, Left, etc. */
  nsoRemark?: string;
  /** Daily attendance date lists (register / mark UI). */
  attendance?: {
    presentDates?: string[];
    absentDates?: string[];
    lateDates?: string[];
    holidayDates?: string[];
    lastUpdated?: string;
    importedFrom?: string;
  };
};

export type BranchTransportStudentRow = BranchStudentRow & {
  usesTransport: boolean;
  busNo: string;
  route: string;
  stoppage: string;
  driverName: string;
  driverMobile: string;
  /** Monthly transport fee dues (APR–MAR), from profile transportDetails.fees */
  transportFees: number[];
  /** Monthly transport fee collections (APR–MAR), from headwise fee details */
  transportPaidFees: number[];
  /** Snapshot paid amount from headwise / transport collection import, when present */
  transportFeePaid?: number;
  transportFeeBalance?: number;
};

function transportDetailsFromProfile(profile: Record<string, unknown>) {
  const td = (profile.transportDetails ?? {}) as Record<string, unknown>;
  const feesRaw = td.fees;
  const transportFees = Array.isArray(feesRaw)
    ? feesRaw.map((v) => Number(v) || 0)
    : [];
  const paidFeesRaw = td.paidFees;
  const transportPaidFees = Array.isArray(paidFeesRaw)
    ? paidFeesRaw.map((v) => Number(v) || 0)
    : [];
  const feePaidRaw = Number.parseInt(String(td.feePaid ?? ""), 10);
  const balanceRaw = Number.parseInt(String(td.balance ?? ""), 10);
  const usesTransport =
    String(td.facility ?? "").toUpperCase() === "YES" ||
    transportFees.some((v) => v > 0);
  return {
    usesTransport,
    busNo: String(td.busNo ?? "").trim() || "—",
    route: String(td.route ?? "").trim() || "—",
    stoppage: String(td.stoppage ?? "").trim() || "—",
    driverName: String(td.driverName ?? "").trim() || "—",
    driverMobile: String(td.driverMobile ?? "").trim() || "—",
    transportFees,
    transportPaidFees,
    transportFeePaid: Number.isFinite(feePaidRaw) ? feePaidRaw : undefined,
    transportFeeBalance: Number.isFinite(balanceRaw) ? balanceRaw : undefined,
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
  status: "Active" | "Inactive" | "Cancelled";
};

/** Resolve display status: Cancelled (admission cancelled) > Inactive > Active. */
export function resolveStudentDisplayStatus(
  row: { is_active?: boolean | null },
  profile?: StudentProfileData | null,
  enrollment?: StudentYearEnrollment | null,
  academicYear?: string | null
): "Active" | "Inactive" | "Cancelled" {
  const yearEnr =
    enrollment ??
    (profile && academicYear ? resolveStudentYearEnrollment(profile, academicYear) : null);
  const yearStatus = String(
    (yearEnr as Record<string, unknown> | null | undefined)?.status ??
      (yearEnr as Record<string, unknown> | null | undefined)?.admissionStatus ??
      ""
  )
    .trim()
    .toLowerCase();
  const profileStatus = String(
    (profile as Record<string, unknown> | null | undefined)?.status ??
      (profile as Record<string, unknown> | null | undefined)?.admissionStatus ??
      ""
  )
    .trim()
    .toLowerCase();
  const cancelledFlag = Boolean(
    (profile as Record<string, unknown> | null | undefined)?.admissionCancelled
  );

  if (
    cancelledFlag ||
    yearStatus === "cancelled" ||
    profileStatus === "cancelled"
  ) {
    return "Cancelled";
  }
  if (row.is_active === false || profileStatus === "inactive" || yearStatus === "inactive") {
    return "Inactive";
  }
  return "Active";
}

function genderLabel(raw: string | null | undefined): string {
  const g = String(raw ?? "").trim().toLowerCase();
  if (!g) return "";
  if (g === "male" || g === "m" || g === "boy" || g.startsWith("male")) return "Male";
  if (g === "female" || g === "f" || g === "girl" || g.startsWith("female")) return "Female";
  if (g === "other" || g === "o") return "Other";
  return String(raw ?? "").trim();
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
  const portalUsername = (admissionNo || id.slice(0, 6)).toLowerCase().replace(/[^a-z0-9_]/g, "");

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
    status: resolveStudentDisplayStatus(row, null, enrollment, academicYear),
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
  const fromParents = splitParentNames(String(base.parentName ?? row.parent_name ?? ""));

  const photos = profile.photos as Record<string, string> | undefined;
  const yearFields = yearEnrollment ?? {};

  const pick = (...values: unknown[]) => {
    for (const value of values) {
      const text = String(value ?? "").trim();
      if (text && text !== "—" && text.toLowerCase() !== "n/a") return text;
    }
    return "";
  };

  const fatherName = pick(
    yearFields.fatherName,
    profile.fatherName,
    fromParents.fatherName,
    base.fatherName,
    base.parentName,
    row.parent_name
  );
  const motherName = pick(
    yearFields.motherName,
    profile.motherName,
    fromParents.motherName,
    base.motherName
  );
  const fatherMobile1 = pick(
    yearFields.fatherMobile1,
    yearFields.mobileNumber,
    yearFields.permMobile,
    profile.fatherMobile1,
    profile.mobileNumber,
    profile.permMobile,
    base.fatherMobile1,
    base.parentPhone,
    base.mobileNumber,
    row.parent_phone
  );

  const merged: BranchStudentDetail = {
    ...base,
    ...profile,
    ...yearFields,
    fatherName,
    motherName,
    fatherMobile1,
    motherMobile1: pick(yearFields.motherMobile1, profile.motherMobile1, base.motherMobile1),
    parentName: fatherName || pick(base.parentName, row.parent_name) || null,
    parentPhone: fatherMobile1 || pick(base.parentPhone, row.parent_phone) || null,
    mobileNumber: fatherMobile1 || pick(base.mobileNumber, row.parent_phone),
    permMobile: fatherMobile1 || pick(base.permMobile, row.parent_phone),
    permAddress: pick(yearFields.permAddress, profile.permAddress, base.address),
    address: pick(base.address, yearFields.permAddress, profile.permAddress, row.address),
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
    status: resolveStudentDisplayStatus(row, profile, yearEnrollment, academicYear),
    admissionCancelled: Boolean((profile as Record<string, unknown>).admissionCancelled),
    admissionCancelledYear: String(
      (profile as Record<string, unknown>).admissionCancelledYear ??
        (yearFields as Record<string, unknown>).cancelledAt ??
        ""
    ),
    dob: base.dob,
    gender:
      genderLabel(String(base.gender || profile.gender || row.gender || "").trim() || null) ||
      base.gender ||
      "",
    academicYear: academicYear ?? base.academicYear,
  };

  return merged;
}

function isHostelStudentType(studentType?: string | null): boolean {
  const typeKey = String(studentType ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
  return (
    typeKey === "boarder" ||
    typeKey === "hostel" ||
    typeKey.includes("boarder") ||
    typeKey.includes("hostel")
  );
}

export function shapeBranchStudentListRow(
  row: Record<string, unknown>,
  enrollment: StudentYearEnrollment,
  yearName: string,
  profile: StudentProfileData = {}
): BranchStudentRow {
  const fatherName = resolveFatherName(profile, enrollment, row.parent_name ? String(row.parent_name) : null) || "—";
  const studentType = String(
    (enrollment as Record<string, unknown>).studentType ??
      profile.studentType ??
      ""
  ).trim();
  const td = (profile.transportDetails ?? {}) as Record<string, unknown>;
  const usesTransport = String(td.facility ?? "").toUpperCase() === "YES";
  const usesHostel = isHostelStudentType(studentType);
  const usesOwnTransport = !usesHostel && !usesTransport;
  const photoUrl =
    resolveStudentPhotoUrl(profile) ||
    String(row.photo_url ?? row.photo ?? "").trim() ||
    "";

  return {
    id: String(row.id),
    name: String(row.full_name ?? "").trim() || displayAdmissionNo(String(row.admission_no ?? "")) || "Unnamed",
    className: String(enrollment.className ?? "").trim() || "—",
    section: String(enrollment.section ?? "").trim() || "—",
    gender:
      genderLabel(
        String(row.gender ?? (profile as Record<string, unknown>).gender ?? "").trim() || null
      ) || "—",
    roll: displayAdmissionNo(String(row.admission_no ?? "")) || "—",
    admissionNo: displayAdmissionNo(String(row.admission_no ?? "")) || "—",
    status: resolveStudentDisplayStatus(row, profile, enrollment, yearName),
    academicYear: yearName,
    parentPhone: row.parent_phone ? String(row.parent_phone) : null,
    fatherName,
    motherName:
      String(
        (enrollment as Record<string, unknown>).motherName ??
          profile.motherName ??
          splitParentNames(row.parent_name ? String(row.parent_name) : null).motherName ??
          ""
      ).trim() || undefined,
    dob: String(row.dob ?? profile.dob ?? "").trim() || undefined,
    permanentAddress:
      String(
        (enrollment as Record<string, unknown>).permAddress ??
          profile.permAddress ??
          row.address ??
          ""
      ).trim() || undefined,
    correspondingAddress:
      String(
        (enrollment as Record<string, unknown>).corrAddress ??
          (profile as Record<string, unknown>).corrAddress ??
          ""
      ).trim() || undefined,
    photoUrl: photoUrl || undefined,
    studentType: studentType || undefined,
    usesTransport,
    usesHostel,
    usesOwnTransport,
    attendance: profile.attendance as BranchStudentRow["attendance"],
  };
}

function shapeFromListMeta(
  row: Record<string, unknown>,
  meta: StudentListEnrollmentMeta,
  yearName: string
): BranchStudentRow {
  const enrollment: StudentYearEnrollment = {
    className: meta.className,
    section: meta.section,
    fatherName: meta.fatherName,
    studentType: meta.studentType,
  };
  const profile: StudentProfileData = {
    fatherName: meta.fatherName,
    studentType: meta.studentType,
    transportDetails: meta.transportDetails,
    photo_url: meta.photoUrl,
    photo: meta.photoUrl,
    attendance: meta.attendance,
  };
  return shapeBranchStudentListRow(row, enrollment, yearName, profile);
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

  invalidateServerCache(`student-detail|${branchId}|`);
  invalidateServerCache(`students|${branchId}|`);

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

  return withServerCache(`student-detail|${branchId}|${yearName}|${studentId}`, async () => {
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
    // Still return table columns when current-year enrollment JSON is missing.
    return mergeStudentForUi(data as Record<string, unknown>, profile, yearName, enrollment);
  }, 60_000);
}

/** Admission cancelled for the selected academic year (from cancelled-list import). */
export function isCancelledAdmissionForYear(
  profile: StudentProfileData | null | undefined,
  yearName: string
): boolean {
  if (!profile) return false;
  const cancelledYear = String(
    (profile as Record<string, unknown>).admissionCancelledYear ?? ""
  ).trim();
  if (cancelledYear) return cancelledYear === yearName;

  const yearEnr = resolveStudentYearEnrollment(profile, yearName) as
    | (StudentYearEnrollment & { status?: string; admissionStatus?: string })
    | null;
  const yearStatus = String(yearEnr?.status ?? yearEnr?.admissionStatus ?? "")
    .trim()
    .toLowerCase();
  if (yearStatus === "cancelled") return true;

  const rootStatus = String(
    (profile as Record<string, unknown>).status ??
      (profile as Record<string, unknown>).admissionStatus ??
      ""
  )
    .trim()
    .toLowerCase();
  if (
    (Boolean((profile as Record<string, unknown>).admissionCancelled) ||
      rootStatus === "cancelled") &&
    yearEnr
  ) {
    return true;
  }
  return false;
}

async function fetchStudentsByIds(
  admin: SupabaseClient<any>,
  branchId: string,
  studentIds: string[]
): Promise<
  Array<{
    id: string;
    admission_no: string;
    full_name: string;
    gender: string | null;
    dob: string | null;
    address: string | null;
    is_active: boolean;
    parent_phone: string | null;
    parent_name: string | null;
    photo_url: string | null;
  }>
> {
  const ids = [...new Set(studentIds.map((id) => String(id).trim()).filter(Boolean))];
  if (!ids.length) return [];

  const rows: Array<{
    id: string;
    admission_no: string;
    full_name: string;
    gender: string | null;
    dob: string | null;
    address: string | null;
    is_active: boolean;
    parent_phone: string | null;
    parent_name: string | null;
    photo_url: string | null;
  }> = [];

  const chunkSize = 100;
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const { data, error } = await admin
      .from("students")
      .select("id, admission_no, full_name, gender, dob, address, is_active, parent_phone, parent_name, photo_url")
      .eq("branch_id", branchId)
      .in("id", chunk);
    if (error) throw new Error(error.message);
    for (const row of data ?? []) {
      rows.push(row as (typeof rows)[number]);
    }
  }

  return rows;
}

async function fetchStudentsByAdmissionNos(
  admin: SupabaseClient<any>,
  branchId: string,
  admissionNos: string[]
): Promise<Map<string, Record<string, unknown>>> {
  const byAdm = new Map<string, Record<string, unknown>>();
  const nos = [...new Set(admissionNos.map((n) => String(n).trim()).filter(Boolean))];
  if (!nos.length) return byAdm;

  for (let i = 0; i < nos.length; i += 100) {
    const chunk = nos.slice(i, i + 100);
    const { data, error } = await admin
      .from("students")
      .select("id, admission_no, full_name, gender, dob, address, is_active, parent_phone, parent_name, photo_url")
      .eq("branch_id", branchId)
      .in("admission_no", chunk);
    if (error) throw new Error(error.message);
    for (const row of data ?? []) {
      const adm = displayAdmissionNo(String(row.admission_no ?? ""));
      if (adm) byAdm.set(adm, row as Record<string, unknown>);
    }
  }

  // Scoped admission nos (e.g. 58#2023-24) if plain match missed.
  for (const adm of nos) {
    if (byAdm.has(adm)) continue;
    const { data } = await admin
      .from("students")
      .select("id, admission_no, full_name, gender, dob, address, is_active, parent_phone, parent_name, photo_url")
      .eq("branch_id", branchId)
      .like("admission_no", `${adm}#%`)
      .limit(1);
    const row = data?.[0];
    if (row) byAdm.set(adm, row as Record<string, unknown>);
  }

  return byAdm;
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

  return withServerCache(`students|v10|${branchId}|${yearName}`, async () => {
    // Enrollment index + small registries — never load every student profile
    // (that path statement-timeouts on large Cherukupalli notice tables).
    const [enrollments, nsoRegistry, cancelledRegistry] = await Promise.all([
      loadStudentEnrollmentIndexForYear(admin, branchId, yearName),
      loadNsoRegistry(admin, branchId, yearName),
      loadCancelledAdmissionsRegistry(admin, branchId, yearName),
    ]);

    const enrolledIds = [...enrollments.keys()];
    if (!enrolledIds.length) return [];

    const students = await fetchStudentsByIds(admin, branchId, enrolledIds);
    if (!students.length) return [];

    const nsoAdmissionNos = nsoRegistry ? nsoRegistryAdmissionNoSet(nsoRegistry) : null;
    const cancelledAdmissionNos = cancelledRegistry
      ? cancelledRegistryAdmissionNoSet(cancelledRegistry)
      : null;

    const results: BranchStudentRow[] = [];
    for (const row of students) {
      const admissionNo = displayAdmissionNo(String(row.admission_no ?? ""));
      if (nsoAdmissionNos?.has(admissionNo)) continue;
      if (cancelledAdmissionNos?.has(admissionNo)) continue;
      const meta = enrollments.get(String(row.id));
      if (!meta) continue;
      results.push(shapeFromListMeta(row as Record<string, unknown>, meta, yearName));
    }

    results.sort((a, b) => a.name.localeCompare(b.name));
    return results;
  }, 60_000);
}

function admissionDateInYear(admissionDate: string | undefined, yearName: string): boolean {
  const raw = String(admissionDate ?? "").trim().slice(0, 10);
  if (!raw) return false;
  const { start_date, end_date } = datesFromYearName(yearName);
  return raw >= start_date && raw <= end_date;
}

function resolvePreviousYearName(
  years: { name: string }[],
  yearName: string
): string | null {
  const names = years.map((y) => y.name);
  const idx = names.indexOf(yearName);
  if (idx === -1 || idx >= names.length - 1) return null;
  return names[idx + 1] ?? null;
}

/** Student has a year enrollment record (continuing or new). */
function hasYearEnrollment(profile: StudentProfileData, yearName: string): boolean {
  return resolveStudentYearEnrollment(profile, yearName) != null;
}

/**
 * New admission for this academic year: enrolled now, admitted during the year,
 * and not a continuing student from the immediately previous year.
 */
function isNewAdmissionForYear(
  profile: StudentProfileData,
  yearName: string,
  previousYearName: string | null
): boolean {
  if (!hasYearEnrollment(profile, yearName)) return false;
  if (previousYearName && hasYearEnrollment(profile, previousYearName)) return false;
  const admissionDate = String(profile.admissionDate ?? "").trim();
  return admissionDateInYear(admissionDate, yearName);
}

/** NSO: enrolled in the previous academic year but not in the selected year. */
function isNsoForYear(
  profile: StudentProfileData,
  yearName: string,
  previousYearName: string | null
): boolean {
  if (!previousYearName) return false;
  if (hasYearEnrollment(profile, yearName)) return false;
  return hasYearEnrollment(profile, previousYearName);
}

function shapeCohortRow(
  row: Record<string, unknown>,
  enrollment: StudentYearEnrollment,
  yearName: string,
  profile: StudentProfileData,
  options: {
    status?: "Active" | "Inactive" | "Cancelled";
    previousAcademicYear?: string;
  } = {}
): BranchStudentRow {
  const base = shapeBranchStudentListRow(row, enrollment, yearName, profile);
  const enrollmentExtra = enrollment as StudentYearEnrollment & {
    admissionDate?: string;
    admissionClass?: string;
  };
  const admissionDate =
    String(profile.admissionDate ?? enrollmentExtra.admissionDate ?? "").trim() || undefined;
  const admissionClass =
    String(profile.admissionClass ?? enrollmentExtra.admissionClass ?? "").trim() || undefined;
  return {
    ...base,
    status: options.status ?? base.status,
    admissionDate,
    admissionClass,
    previousAcademicYear: options.previousAcademicYear,
  };
}

export async function loadBranchNewAdmissions(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  academicYearName?: string | null
): Promise<BranchStudentRow[]> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return [];

  const years = await listBranchAcademicYears(admin, branchId);
  const yearName = await resolveYearName(admin, branchId, academicYearName);
  if (!yearName) return [];

  const previousYear = resolvePreviousYearName(years, yearName);
  const registry = await loadNewAdmissionsRegistry(admin, branchId, yearName);
  const cacheSuffix = registry?.seededAt ?? registry?.source ?? "heuristic";

  return withServerCache(`students|new-admissions|v3|${branchId}|${yearName}|${cacheSuffix}`, async () => {
    const officialAdmissionNos = registry ? registryAdmissionNoSet(registry) : null;
    const officialAdmissionDates = registry ? registryAdmissionDates(registry) : null;

    // Fast path: official registry → targeted student/profile fetches only.
    if (officialAdmissionNos) {
      const studentsByAdm = await fetchStudentsByAdmissionNos(
        admin,
        branchId,
        [...officialAdmissionNos]
      );
      const neededIds = [...studentsByAdm.values()]
        .map((row) => String(row.id ?? "").trim())
        .filter(Boolean);
      const [profiles, enrollments] = await Promise.all([
        loadStudentProfilesByIds(admin, branchId, neededIds),
        loadStudentEnrollmentIndexForYear(admin, branchId, yearName),
      ]);

      const results: BranchStudentRow[] = [];
      for (const admissionNo of officialAdmissionNos) {
        const row = studentsByAdm.get(admissionNo);
        if (!row) continue;
        const id = String(row.id);
        const profile = profiles.get(id) ?? {};
        const enrollment =
          resolveStudentYearEnrollment(profile, yearName) ??
          (() => {
            const meta = enrollments.get(id);
            if (!meta) return null;
            return {
              className: meta.className,
              section: meta.section,
              fatherName: meta.fatherName,
              studentType: meta.studentType,
            } as StudentYearEnrollment;
          })();
        if (!enrollment) continue;

        const shaped = shapeCohortRow(row, enrollment, yearName, profile, {
          status: "Active",
        });
        if (officialAdmissionDates?.has(admissionNo) && !shaped.admissionDate) {
          shaped.admissionDate = officialAdmissionDates.get(admissionNo);
        }
        results.push(shaped);
      }

      results.sort((a, b) => a.name.localeCompare(b.name));
      return results;
    }

    // Heuristic fallback (no registry): still needs full profile scan.
    const [students, profiles] = await Promise.all([
      fetchAllPaginated<{
        id: string;
        admission_no: string;
        full_name: string;
        is_active: boolean;
        parent_phone: string | null;
        parent_name: string | null;
        photo_url: string | null;
      }>(
        admin,
        "students",
        "id, admission_no, full_name, is_active, parent_phone, parent_name, photo_url",
        (query) => query.eq("branch_id", branchId).order("full_name", { ascending: true })
      ),
      loadAllStudentProfiles(admin, branchId),
    ]);

    const results: BranchStudentRow[] = [];
    for (const row of students) {
      const profile = profiles.get(String(row.id)) ?? {};
      if (!isNewAdmissionForYear(profile, yearName, previousYear)) continue;

      const enrollment = resolveStudentYearEnrollment(profile, yearName);
      if (!enrollment) continue;

      results.push(
        shapeCohortRow(row as Record<string, unknown>, enrollment, yearName, profile, {
          status: "Active",
        })
      );
    }

    results.sort((a, b) => a.name.localeCompare(b.name));
    return results;
  }, 60_000);
}

function resolveLastEnrollment(
  profile: StudentProfileData,
  yearName: string,
  previousYear: string | null,
  years: { name: string }[]
): { enrollment: StudentYearEnrollment; yearLabel: string } | null {
  if (previousYear) {
    const prev = resolveStudentYearEnrollment(profile, previousYear);
    if (prev) return { enrollment: prev, yearLabel: previousYear };
  }
  for (const year of years) {
    if (year.name === yearName) continue;
    const enrollment = resolveStudentYearEnrollment(profile, year.name);
    if (enrollment) return { enrollment, yearLabel: year.name };
  }
  return null;
}

function shapeNsoRowFromRegistry(
  entry: { admissionNo: string; name?: string; nsoDate?: string; nsoRemark?: string },
  yearName: string,
  previousYear: string | null
): BranchStudentRow {
  return {
    id: `nso-registry:${entry.admissionNo}`,
    name: String(entry.name ?? "Unknown").trim(),
    className: "—",
    section: "—",
    gender: "—",
    roll: "—",
    admissionNo: entry.admissionNo,
    status: "Inactive",
    academicYear: yearName,
    parentPhone: null,
    fatherName: "",
    motherName: undefined,
    dob: undefined,
    permanentAddress: undefined,
    correspondingAddress: undefined,
    previousAcademicYear: previousYear ?? undefined,
    nsoDate: entry.nsoDate,
    nsoRemark: entry.nsoRemark,
  };
}

export async function loadBranchNsoStudents(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  academicYearName?: string | null
): Promise<BranchStudentRow[]> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return [];

  const years = await listBranchAcademicYears(admin, branchId);
  const yearName = await resolveYearName(admin, branchId, academicYearName);
  if (!yearName) return [];

  const previousYear = resolvePreviousYearName(years, yearName);
  const registry = await loadNsoRegistry(admin, branchId, yearName);
  const cacheSuffix = registry?.seededAt ?? registry?.source ?? previousYear ?? "heuristic";

  return withServerCache(`students|nso|v5|${branchId}|${yearName}|${cacheSuffix}`, async () => {
    const results: BranchStudentRow[] = [];

    if (registry) {
      const admissionNos = registry.students
        .map((entry) => String(entry.admissionNo ?? "").trim())
        .filter(Boolean);
      const studentsByAdm = await fetchStudentsByAdmissionNos(admin, branchId, admissionNos);
      const neededIds = [...studentsByAdm.values()]
        .map((row) => String(row.id ?? "").trim())
        .filter(Boolean);
      const profiles = await loadStudentProfilesByIds(admin, branchId, neededIds);

      for (const entry of registry.students) {
        const admissionNo = String(entry.admissionNo ?? "").trim();
        if (!admissionNo) continue;

        const row = studentsByAdm.get(admissionNo);
        if (row) {
          const profile = profiles.get(String(row.id)) ?? {};
          // Official NSO list is the source of truth. Students often still have a
          // year enrollment (fee/ABC import) after leaving mid-year — do not skip.
          const yearEnrollment = resolveStudentYearEnrollment(profile, yearName);
          const last = yearEnrollment
            ? { enrollment: yearEnrollment, yearLabel: yearName }
            : resolveLastEnrollment(profile, yearName, previousYear, years);
          const enrollment = last?.enrollment ?? {
            className: "—",
            section: "—",
          };

          const shaped = shapeCohortRow(
            row,
            enrollment,
            last?.yearLabel ?? previousYear ?? yearName,
            profile,
            {
              status: "Inactive",
              previousAcademicYear: previousYear ?? last?.yearLabel ?? undefined,
            }
          );
          shaped.nsoDate = entry.nsoDate ?? shaped.nsoDate;
          shaped.nsoRemark = entry.nsoRemark ?? shaped.nsoRemark;
          results.push(shaped);
        } else {
          results.push(shapeNsoRowFromRegistry(entry, yearName, previousYear));
        }
      }
    } else {
      if (!previousYear) return [];

      const [currentIndex, previousIndex] = await Promise.all([
        loadStudentEnrollmentIndexForYear(admin, branchId, yearName),
        loadStudentEnrollmentIndexForYear(admin, branchId, previousYear),
      ]);
      const nsoIds = [...previousIndex.keys()].filter((id) => !currentIndex.has(id));
      const [profiles, students] = await Promise.all([
        loadStudentProfilesByIds(admin, branchId, nsoIds),
        fetchStudentsByIds(admin, branchId, nsoIds),
      ]);
      const studentsById = new Map(
        students.map((row) => [String(row.id), row as Record<string, unknown>])
      );

      for (const id of nsoIds) {
        const row = studentsById.get(id);
        if (!row) continue;
        const profile = profiles.get(id) ?? {};
        if (!isNsoForYear(profile, yearName, previousYear)) continue;

        const previousEnrollment = resolveStudentYearEnrollment(profile, previousYear);
        if (!previousEnrollment) continue;

        results.push(
          shapeCohortRow(row, previousEnrollment, previousYear, profile, {
            status: "Inactive",
            previousAcademicYear: previousYear,
          })
        );
      }
    }

    results.sort((a, b) => a.name.localeCompare(b.name));
    return results;
  }, 60_000);
}

export async function loadBranchCancelledAdmissions(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  academicYearName?: string | null
): Promise<BranchStudentRow[]> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return [];

  const yearName = await resolveYearName(admin, branchId, academicYearName);
  if (!yearName) return [];

  const registry = await loadCancelledAdmissionsRegistry(admin, branchId, yearName);
  const cacheSuffix = registry?.seededAt ?? registry?.source ?? "v2";

  return withServerCache(`students|cancelled|v3|${branchId}|${yearName}|${cacheSuffix}`, async () => {
    // Fast path: official cancelled registry (small list) + targeted student/profile fetches.
    if (registry) {
      const admissionNos = [...cancelledRegistryAdmissionNoSet(registry)];
      if (!admissionNos.length) return [];

      const studentsByAdm = await fetchStudentsByAdmissionNos(admin, branchId, admissionNos);

      const neededIds = [...studentsByAdm.values()]
        .map((row) => String(row.id ?? "").trim())
        .filter(Boolean);
      const profiles = await loadStudentProfilesByIds(admin, branchId, neededIds);

      const results: BranchStudentRow[] = [];
      for (const entry of registry.students) {
        const admissionNo = String(entry.admissionNo ?? "").trim();
        if (!admissionNo) continue;
        const row = studentsByAdm.get(admissionNo);
        if (!row) continue;

        const profile = profiles.get(String(row.id)) ?? {};
        const enrollment =
          resolveStudentYearEnrollment(profile, yearName) ??
          ({
            className: String((profile as Record<string, unknown>).className ?? profile.classId ?? "—"),
            section: String((profile as Record<string, unknown>).section ?? "—"),
          } as StudentYearEnrollment);

        results.push(
          shapeCohortRow(row, enrollment, yearName, profile, {
            status: "Cancelled",
          })
        );
      }

      results.sort((a, b) => a.name.localeCompare(b.name));
      return results;
    }

    // Fallback: only scan profiles that already store admissionCancelledYear for this year.
    // Avoids loading every student profile (statement timeout on large branches).
    const notices = await fetchAllPaginated<{ title: string; content: string }>(
      admin,
      "notices",
      "title, content",
      (query) =>
        query
          .eq("branch_id", branchId)
          .like("title", `${STUDENT_PROFILE_NOTICE_PREFIX}%`)
          .ilike("content", `%"admissionCancelledYear":"${yearName}"%`)
    );

    const cancelledIds: string[] = [];
    const profiles = new Map<string, StudentProfileData>();
    for (const notice of notices) {
      const id = String(notice.title).slice(STUDENT_PROFILE_NOTICE_PREFIX.length);
      if (!id) continue;
      try {
        const parsed = JSON.parse(String(notice.content ?? "{}")) as StudentProfileData;
        if (!isCancelledAdmissionForYear(parsed, yearName)) continue;
        profiles.set(id, parsed);
        cancelledIds.push(id);
      } catch {
        /* skip */
      }
    }

    if (!cancelledIds.length) return [];

    const studentsById = new Map<string, Record<string, unknown>>();
    for (let i = 0; i < cancelledIds.length; i += 100) {
      const chunk = cancelledIds.slice(i, i + 100);
      const { data, error } = await admin
        .from("students")
        .select("id, admission_no, full_name, gender, dob, address, is_active, parent_phone, parent_name, photo_url")
        .eq("branch_id", branchId)
        .in("id", chunk);
      if (error) throw new Error(error.message);
      for (const row of data ?? []) {
        studentsById.set(String(row.id), row as Record<string, unknown>);
      }
    }

    const results: BranchStudentRow[] = [];
    for (const id of cancelledIds) {
      const row = studentsById.get(id);
      if (!row) continue;
      const profile = profiles.get(id) ?? {};
      const enrollment =
        resolveStudentYearEnrollment(profile, yearName) ??
        ({
          className: String((profile as Record<string, unknown>).className ?? profile.classId ?? "—"),
          section: String((profile as Record<string, unknown>).section ?? "—"),
        } as StudentYearEnrollment);

      results.push(
        shapeCohortRow(row, enrollment, yearName, profile, {
          status: "Cancelled",
        })
      );
    }

    results.sort((a, b) => a.name.localeCompare(b.name));
    return results;
  }, 60_000);
}

export async function loadBranchStudentsByCohort(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  academicYearName: string | null | undefined,
  cohort: StudentListCohort = "enrolled"
): Promise<BranchStudentRow[]> {
  if (cohort === "new-admissions") {
    return loadBranchNewAdmissions(admin, schoolSlug, academicYearName);
  }
  if (cohort === "nso") {
    return loadBranchNsoStudents(admin, schoolSlug, academicYearName);
  }
  if (cohort === "cancelled") {
    return loadBranchCancelledAdmissions(admin, schoolSlug, academicYearName);
  }
  return loadBranchStudents(admin, schoolSlug, academicYearName);
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

  return withServerCache(`transport-students|v2|${branchId}|${yearName}`, async () => {
    const [students, enrollments] = await Promise.all([
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
      loadStudentEnrollmentIndexForYear(admin, branchId, yearName),
    ]);

    if (!students.length) return [];

    const results: BranchTransportStudentRow[] = [];
    for (const row of students) {
      const meta = enrollments.get(String(row.id));
      if (!meta) continue;
      const base = shapeFromListMeta(row as Record<string, unknown>, meta, yearName);
      const transport = transportDetailsFromProfile({
        transportDetails: meta.transportDetails,
      });
      results.push({ ...base, ...transport });
    }
    return results;
  }, 60_000);
}

export type StudentReportCardFields = {
  fatherName: string;
  motherName: string;
  aadharNo: string;
  house: string;
  dob: string;
  address: string;
  corrAddress: string;
  phone: string;
  coScholastic: Record<string, string>;
  disciplineGrade: string;
  remarks: string;
  heightCm: string;
  weightKg: string;
  workingDays: number | null;
  daysPresent: number | null;
};

function normalizeCoScholasticMap(raw: unknown): Record<string, string> {
  if (Array.isArray(raw)) {
    const out: Record<string, string> = {};
    for (const row of raw) {
      if (!row || typeof row !== "object") continue;
      const area = String((row as { area?: unknown }).area ?? "").trim();
      if (!area) continue;
      out[area] = String((row as { grade?: unknown }).grade ?? "").trim();
    }
    return out;
  }
  if (raw && typeof raw === "object") {
    return Object.fromEntries(
      Object.entries(raw as Record<string, unknown>).map(([key, value]) => [
        key,
        String(value ?? "").trim(),
      ])
    );
  }
  return {};
}

function pickYearField(
  enrollment: StudentYearEnrollment | null,
  profile: StudentProfileData,
  key: string
): string {
  const fromEnrollment = enrollment?.[key as keyof StudentYearEnrollment];
  if (fromEnrollment != null && String(fromEnrollment).trim()) {
    return String(fromEnrollment).trim();
  }
  const fromProfile = profile[key];
  if (fromProfile != null && String(fromProfile).trim()) {
    return String(fromProfile).trim();
  }
  return "";
}

function attendanceSummaryForYear(profile: StudentProfileData, yearName: string): {
  workingDays: number | null;
  daysPresent: number | null;
} {
  const attendance = profile.attendance as StudentAttendanceDates | undefined;
  if (!attendance) return { workingDays: null, daysPresent: null };

  const { start, end } = academicYearAprMarRange(yearName);
  const stats = calculateAttendanceStats(
    attendance.presentDates ?? [],
    attendance.absentDates ?? [],
    attendance.lateDates ?? [],
    start,
    end,
    attendance.holidayDates ?? []
  );

  return {
    workingDays: stats.totalWorkingDays || null,
    daysPresent: stats.presentDays || null,
  };
}

/** Batch-load report-card header fields for many students in two DB round-trips. */
export async function loadBranchStudentsReportFields(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  studentIds: string[],
  academicYearName?: string | null
): Promise<Record<string, StudentReportCardFields>> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId || !studentIds.length) return {};

  const yearName = await resolveYearName(admin, branchId, academicYearName);
  if (!yearName) return {};

  const uniqueIds = [...new Set(studentIds.map((id) => String(id).trim()).filter(Boolean))];
  const CHUNK = 80;

  const studentRows = new Map<string, Record<string, unknown>>();
  for (let i = 0; i < uniqueIds.length; i += CHUNK) {
    const chunk = uniqueIds.slice(i, i + CHUNK);
    const { data, error } = await admin
      .from("students")
      .select("id, admission_no, full_name, dob, parent_name, parent_phone, address")
      .eq("branch_id", branchId)
      .in("id", chunk);
    if (error) throw new Error(error.message);
    for (const row of data ?? []) {
      studentRows.set(String(row.id), row as Record<string, unknown>);
    }
  }

  const profileById = new Map<string, StudentProfileData>();
  for (let i = 0; i < uniqueIds.length; i += CHUNK) {
    const chunk = uniqueIds.slice(i, i + CHUNK);
    const titles = chunk.map((id) => profileTitle(id));
    const { data, error } = await admin
      .from("notices")
      .select("title, content")
      .eq("branch_id", branchId)
      .in("title", titles);
    if (error) throw new Error(error.message);
    for (const row of data ?? []) {
      const title = String(row.title ?? "");
      if (!title.startsWith(STUDENT_PROFILE_NOTICE_PREFIX)) continue;
      const studentId = title.slice(STUDENT_PROFILE_NOTICE_PREFIX.length);
      try {
        const parsed = JSON.parse(String(row.content ?? "{}"));
        profileById.set(
          studentId,
          parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {}
        );
      } catch {
        profileById.set(studentId, {});
      }
    }
  }

  const result: Record<string, StudentReportCardFields> = {};
  for (const studentId of uniqueIds) {
    const row = studentRows.get(studentId);
    const profile = profileById.get(studentId) ?? {};
    const enrollment = resolveStudentYearEnrollment(profile, yearName);
    const merged = row
      ? mergeStudentForUi(row, profile, yearName, enrollment)
      : mergeStudentForUi({ id: studentId }, profile, yearName, enrollment);

    const coScholastic = normalizeCoScholasticMap(
      (enrollment as Record<string, unknown> | null)?.coScholastic ??
        profile.coScholastic
    );

    const dobRaw = String(merged.dob ?? row?.dob ?? "").trim();
    const attendance = attendanceSummaryForYear(profile, yearName);

    result[studentId] = {
      fatherName: String(merged.fatherName ?? "").trim(),
      motherName: String(merged.motherName ?? "").trim(),
      aadharNo: String(merged.aadharNo ?? "").trim(),
      house: pickYearField(enrollment, profile, "house"),
      dob: dobRaw ? formatReportDate(dobRaw) : "",
      address: String(merged.address ?? merged.permAddress ?? row?.address ?? "").trim(),
      corrAddress: String(
        (merged as Record<string, unknown>).corrAddress ??
          (enrollment as Record<string, unknown> | null)?.corrAddress ??
          (profile as Record<string, unknown>).corrAddress ??
          ""
      ).trim(),
      phone: String(
        merged.fatherMobile1 ?? merged.parentPhone ?? merged.mobileNumber ?? row?.parent_phone ?? ""
      ).trim(),
      coScholastic,
      disciplineGrade: pickYearField(enrollment, profile, "disciplineGrade"),
      remarks: pickYearField(enrollment, profile, "remarks"),
      heightCm: pickYearField(enrollment, profile, "heightCm"),
      weightKg: pickYearField(enrollment, profile, "weightKg"),
      workingDays: attendance.workingDays,
      daysPresent: attendance.daysPresent,
    };
  }

  return result;
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
