import type { SupabaseClient } from "@supabase/supabase-js";

export const STUDENT_PROFILE_NOTICE_PREFIX = "__student_profile__:";
const PAGE_SIZE = 1000;

export async function fetchAllPaginated<T extends Record<string, unknown>>(
  admin: SupabaseClient<any>,
  table: string,
  select: string,
  applyFilters: (query: any) => any
): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;

  while (true) {
    let query = admin.from(table).select(select).range(from, from + PAGE_SIZE - 1);
    query = applyFilters(query);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    rows.push(...(data as unknown as T[]));
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
}

export type StudentYearEnrollment = {
  className?: string;
  section?: string;
  classId?: string;
  classLabel?: string;
  aadharNo?: string;
  fatherName?: string;
  motherName?: string;
  fatherMobile1?: string;
  motherMobile1?: string;
  mobileNumber?: string;
  permMobile?: string;
  permAddress?: string;
  username?: string;
  portalPassword?: string;
};

export type StudentProfileData = StudentYearEnrollment & {
  enrollments?: Record<string, StudentYearEnrollment>;
  session?: string;
  username?: string;
  portalPassword?: string;
  photos?: Record<string, string>;
  photo?: string;
  [key: string]: unknown;
};

export function profileTitle(studentId: string) {
  return `${STUDENT_PROFILE_NOTICE_PREFIX}${studentId}`;
}

export function resolveStudentYearEnrollment(
  profile: StudentProfileData,
  yearName: string
): StudentYearEnrollment | null {
  const enrollments = profile.enrollments;
  if (enrollments?.[yearName]) {
    return enrollments[yearName];
  }

  if (String(profile.session ?? "") === yearName) {
    return profile;
  }

  return null;
}

export function buildEnrollmentFromRow(row: {
  class_name: string;
  section: string;
  classLabel?: string;
  classId?: string;
  aadhar_no?: string | null;
  father_name?: string;
  mother_name?: string;
  father_phone?: string | null;
  mother_phone?: string | null;
  parent_phone?: string | null;
  address?: string | null;
  username?: string | null;
  password?: string | null;
}): StudentYearEnrollment {
  const username = row.username ? String(row.username).trim() : "";
  const password = row.password ? String(row.password).trim() : "";
  return {
    className: row.class_name,
    section: row.section,
    classId: row.classId,
    classLabel: row.classLabel,
    aadharNo: row.aadhar_no || "",
    fatherName: row.father_name || "",
    motherName: row.mother_name || "",
    fatherMobile1: row.father_phone || "",
    motherMobile1: row.mother_phone || "",
    mobileNumber: row.parent_phone || "",
    permMobile: row.parent_phone || "",
    permAddress: row.address || "",
    username: username || undefined,
    portalPassword: password || username || undefined,
  };
}

export function mergeStudentEnrollment(
  existing: StudentProfileData,
  academicYear: string,
  enrollment: StudentYearEnrollment,
  shared?: { username?: string; portalPassword?: string }
): StudentProfileData {
  const profile: StudentProfileData = { ...existing, enrollments: { ...(existing.enrollments ?? {}) } };

  if (profile.session && !profile.enrollments![profile.session]) {
    profile.enrollments![profile.session] = {
      className: profile.className as string | undefined,
      section: profile.section as string | undefined,
      aadharNo: profile.aadharNo as string | undefined,
      fatherName: profile.fatherName as string | undefined,
      motherName: profile.motherName as string | undefined,
      fatherMobile1: profile.fatherMobile1 as string | undefined,
      motherMobile1: profile.motherMobile1 as string | undefined,
      mobileNumber: profile.mobileNumber as string | undefined,
      permMobile: profile.permMobile as string | undefined,
      permAddress: profile.permAddress as string | undefined,
      username: profile.username,
      portalPassword: profile.portalPassword,
    };
  }

  delete profile.session;
  delete profile.className;
  delete profile.section;
  delete profile.classId;
  delete profile.classLabel;
  delete profile.aadharNo;
  delete profile.fatherName;
  delete profile.motherName;
  delete profile.fatherMobile1;
  delete profile.motherMobile1;
  delete profile.mobileNumber;
  delete profile.permMobile;
  delete profile.permAddress;

  profile.enrollments![academicYear] = enrollment;
  if (shared?.username || enrollment.username) {
    profile.username = shared?.username ?? enrollment.username;
  }
  if (shared?.portalPassword || enrollment.portalPassword) {
    profile.portalPassword = shared?.portalPassword ?? enrollment.portalPassword;
  }

  return profile;
}

export function clearStudentEnrollment(
  profile: StudentProfileData,
  academicYear: string
): StudentProfileData {
  if (!profile.enrollments?.[academicYear]) {
    if (profile.session === academicYear) {
      const next = { ...profile };
      delete next.session;
      return next;
    }
    return profile;
  }

  const enrollments = { ...profile.enrollments };
  delete enrollments[academicYear];
  return { ...profile, enrollments };
}

export async function loadStudentProfileData(
  admin: SupabaseClient<any>,
  branchId: string,
  studentId: string
): Promise<StudentProfileData> {
  const { data, error } = await admin
    .from("notices")
    .select("content")
    .eq("branch_id", branchId)
    .eq("title", profileTitle(studentId))
    .maybeSingle();

  if (error || !data?.content) return {};

  try {
    const parsed = JSON.parse(String(data.content));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export async function saveStudentProfileData(
  admin: SupabaseClient<any>,
  branchId: string,
  studentId: string,
  profile: StudentProfileData
): Promise<void> {
  const title = profileTitle(studentId);
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

export async function loadAllStudentProfiles(
  admin: SupabaseClient<any>,
  branchId: string
): Promise<Map<string, StudentProfileData>> {
  const data = await fetchAllPaginated<{ title: string; content: string }>(
    admin,
    "notices",
    "title, content",
    (query) =>
      query.eq("branch_id", branchId).like("title", `${STUDENT_PROFILE_NOTICE_PREFIX}%`)
  );

  const map = new Map<string, StudentProfileData>();
  for (const row of data) {
    const id = String(row.title).slice(STUDENT_PROFILE_NOTICE_PREFIX.length);
    if (!id || !row.content) continue;
    try {
      const parsed = JSON.parse(String(row.content));
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        map.set(id, parsed);
      }
    } catch {
      /* skip malformed */
    }
  }
  return map;
}

/** Split parent_name stored as "Father / Mother" into separate fields. */
export function resolveFatherName(
  profile: StudentProfileData,
  enrollment: StudentYearEnrollment | null,
  parentNameFromRow?: string | null
): string {
  const fromEnrollment = String(enrollment?.fatherName ?? "").trim();
  if (fromEnrollment) return fromEnrollment;

  const fromProfileRoot = String(profile.fatherName ?? profile.father_name ?? "").trim();
  if (fromProfileRoot) return fromProfileRoot;

  const enrollments = profile.enrollments ?? {};
  for (const yearEnrollment of Object.values(enrollments)) {
    const name = String(yearEnrollment?.fatherName ?? "").trim();
    if (name) return name;
  }

  const fromParents = splitParentNames(parentNameFromRow).fatherName;
  if (fromParents) return fromParents;

  return "";
}

export function splitParentNames(parentName: string | null | undefined): {
  fatherName: string;
  motherName: string;
} {
  const raw = String(parentName ?? "").trim();
  if (!raw) return { fatherName: "", motherName: "" };
  const parts = raw.split(/\s*\/\s*/).map((p) => p.trim()).filter(Boolean);
  return {
    fatherName: parts[0] ?? "",
    motherName: parts[1] ?? "",
  };
}

export function joinParentNames(fatherName?: string, motherName?: string): string | null {
  const father = String(fatherName ?? "").trim();
  const mother = String(motherName ?? "").trim();
  if (father && mother) return `${father} / ${mother}`;
  return father || mother || null;
}

/** Map UI / legacy payload into DB core columns + extended profile JSON. */
export function splitStudentUpdatePayload(payload: Record<string, unknown>): {
  core: Record<string, unknown>;
  profile: StudentProfileData;
} {
  const profile: StudentProfileData = { ...(payload.profile_data as StudentProfileData | undefined) };
  const core: Record<string, unknown> = {};

  const studentName = String(
    payload.studentName ?? payload.name ?? `${payload.firstName ?? ""} ${payload.lastName ?? ""}`.trim()
  ).trim();

  if (studentName) core.full_name = studentName;
  if (payload.dob !== undefined) core.dob = payload.dob || null;
  if (payload.gender !== undefined) {
    const g = String(payload.gender).trim().toLowerCase();
    if (g.startsWith("m")) core.gender = "male";
    else if (g.startsWith("f")) core.gender = "female";
  }
  if (payload.address !== undefined || payload.permAddress !== undefined) {
    core.address = String(payload.permAddress ?? payload.address ?? "").trim() || null;
  }

  const { fatherName, motherName } = {
    fatherName: String(payload.fatherName ?? "").trim(),
    motherName: String(payload.motherName ?? "").trim(),
  };
  const joinedParents = joinParentNames(fatherName, motherName);
  if (joinedParents) core.parent_name = joinedParents;

  const phone = String(
    payload.fatherMobile1 ?? payload.mobileNumber ?? payload.permMobile ?? payload.parentPhone ?? ""
  ).trim();
  if (phone) core.parent_phone = phone;

  if (payload.photo !== undefined || payload.photo_url !== undefined) {
    core.photo_url = payload.photo ?? payload.photo_url ?? null;
  }

  if (payload.status !== undefined) {
    core.is_active = payload.status !== "Inactive";
  }

  const PROFILE_KEYS = new Set([
    "aadharNo",
    "srnNo",
    "formNo",
    "penNo",
    "studentType",
    "house",
    "stream",
    "mediumOfInstruction",
    "optionalSubject",
    "offeredSubject",
    "prevAttendance",
    "motherTongue",
    "nationality",
    "casteCategory",
    "minority",
    "minoritySpecify",
    "onlyChild",
    "adoptedChild",
    "email",
    "bloodGroup",
    "disability",
    "sportsActivity",
    "admissionDate",
    "leftVision",
    "rightVision",
    "weightTerm1",
    "heightTerm1",
    "weightTerm2",
    "heightTerm2",
    "bankName",
    "branchName",
    "accountNo",
    "ifscCode",
    "fatherName",
    "fatherEmail",
    "fatherMobile1",
    "fatherMobile2",
    "fatherOccupation",
    "fatherDepartment",
    "fatherDesignation",
    "fatherOffice",
    "fatherOfficeAddress",
    "fatherOfficeContact",
    "fatherAadhar",
    "fatherPan",
    "fatherIncome",
    "fatherReligion",
    "fatherCaste",
    "fatherMarital",
    "fatherNationality",
    "motherName",
    "motherEmail",
    "motherMobile1",
    "motherMobile2",
    "motherOccupation",
    "motherDepartment",
    "motherDesignation",
    "motherOffice",
    "motherOfficeAddress",
    "motherOfficeContact",
    "motherAadhar",
    "motherPan",
    "motherIncome",
    "motherReligion",
    "motherCaste",
    "motherMarital",
    "motherNationality",
    "guardianName",
    "guardianEmail",
    "guardianMobile1",
    "guardianMobile2",
    "permAddress",
    "permMobile",
    "permWhatsapp",
    "permPlace",
    "permArea",
    "permLocation",
    "permState",
    "permCity",
    "corrAddress",
    "corrMobile",
    "sameAsPerm",
    "siblings",
    "photos",
    "certificates",
    "transportDetails",
    "feeDetails",
    "feeGrid",
    "feeCategory",
    "feeTypeFilter",
    "feeStatus",
    "lastYearDue",
    "discRemark",
    "grossFee",
    "annualFee",
    "totalDiscount",
    "lateFine",
    "discountLog",
    "feeTransactions",
    "transactions",
    "username",
    "portalPassword",
    "attendance",
    "hasSibling",
    "enqNo",
    "session",
    "registrationNo",
  ]);

  for (const [key, value] of Object.entries(payload)) {
    if (PROFILE_KEYS.has(key) && value !== undefined) {
      profile[key] = value;
    }
  }

  return { core, profile };
}
