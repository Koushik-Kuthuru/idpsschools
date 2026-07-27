import type { SupabaseClient } from "@supabase/supabase-js";

export const STUDENT_PROFILE_NOTICE_PREFIX = "__student_profile__:";
/** Slim per-year enrollment projection — avoids scanning full profile JSON on every list load. */
export const ENROLLMENT_INDEX_NOTICE_PREFIX = "__enrollment_index__:";
const PAGE_SIZE = 1000;
const ENROLLMENT_INDEX_VERSION = 2;

export function enrollmentIndexNoticeTitle(yearName: string): string {
  return `${ENROLLMENT_INDEX_NOTICE_PREFIX}${String(yearName ?? "").trim()}`;
}

export async function fetchAllPaginated<T extends Record<string, unknown>>(
  admin: SupabaseClient<any>,
  table: string,
  select: string,
  applyFilters: (query: any) => any,
  options?: { orderBy?: string; ascending?: boolean; maxRows?: number | null }
): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;
  const orderBy = options?.orderBy ?? "id";
  const ascending = options?.ascending ?? true;
  const maxRows =
    options?.maxRows != null && options.maxRows > 0 ? Math.floor(options.maxRows) : null;

  while (true) {
    const pageSize =
      maxRows != null ? Math.min(PAGE_SIZE, Math.max(1, maxRows - rows.length)) : PAGE_SIZE;
    let query = admin.from(table).select(select);
    query = applyFilters(query);
    // Stable ordering is required for range pagination — without it, pages can
    // skip/duplicate rows and stop early on large notice tables.
    if (orderBy) {
      query = query.order(orderBy, { ascending });
    }
    query = query.range(from, from + pageSize - 1);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    rows.push(...(data as unknown as T[]));
    if (maxRows != null && rows.length >= maxRows) {
      return rows.slice(0, maxRows);
    }
    if (data.length < pageSize) break;
    from += pageSize;
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
  /** Year-scoped fee discounts / paid amounts / payment status */
  feeDetails?: Record<string, unknown>;
  totalDiscount?: string | number;
  feeCategory?: string;
  feeStatus?: string;
  discRemark?: string;
  grossFee?: string | number;
  discountLog?: unknown[];
  feeTransactions?: unknown[];
  transportDetails?: Record<string, unknown>;
  studentType?: string;
};

export type StudentProfileData = StudentYearEnrollment & {
  enrollments?: Record<string, StudentYearEnrollment>;
  session?: string;
  username?: string;
  portalPassword?: string;
  photos?: Record<string, string>;
  photo?: string;
  photo_url?: string;
  [key: string]: unknown;
};

/** Prefer nested photos.student (admin upload), then legacy photo / photo_url. */
export function resolveStudentPhotoUrl(
  profile: StudentProfileData | Record<string, unknown> | null | undefined
): string {
  if (!profile || typeof profile !== "object") return "";
  const photos = (profile as StudentProfileData).photos;
  const nested =
    photos && typeof photos === "object"
      ? String(photos.student ?? photos.Student ?? "").trim()
      : "";
  if (nested) return nested;
  const legacy = String(
    (profile as StudentProfileData).photo ??
      (profile as StudentProfileData).photo_url ??
      ""
  ).trim();
  return legacy;
}

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

  // Fill gaps from students.photo_url for rows that only store photos on the core table.
  const coreRows = await fetchAllPaginated<{ id: string; photo_url: string | null }>(
    admin,
    "students",
    "id, photo_url",
    (query) => query.eq("branch_id", branchId).not("photo_url", "is", null)
  );
  for (const row of coreRows) {
    const id = String(row.id);
    const url = String(row.photo_url ?? "").trim();
    if (!url) continue;
    const existing = map.get(id) ?? {};
    if (resolveStudentPhotoUrl(existing)) continue;
    map.set(id, {
      ...existing,
      photo_url: url,
      photos: { ...(existing.photos ?? {}), student: url },
    });
  }

  return map;
}

/** Load profiles for a small set of student IDs (pagination-friendly). */
export async function loadStudentProfilesByIds(
  admin: SupabaseClient<any>,
  branchId: string,
  studentIds: string[]
): Promise<Map<string, StudentProfileData>> {
  const map = new Map<string, StudentProfileData>();
  const ids = [...new Set(studentIds.map((id) => String(id).trim()).filter(Boolean))];
  if (!ids.length) return map;

  const titles = ids.map((id) => profileTitle(id));
  // PostgREST `in` lists stay manageable for page-sized batches.
  const chunkSize = 80;
  for (let i = 0; i < titles.length; i += chunkSize) {
    const chunk = titles.slice(i, i + chunkSize);
    const { data, error } = await admin
      .from("notices")
      .select("title, content")
      .eq("branch_id", branchId)
      .in("title", chunk);
    if (error) throw new Error(error.message);
    for (const row of data ?? []) {
      const id = String(row.title).slice(STUDENT_PROFILE_NOTICE_PREFIX.length);
      if (!id || !row.content) continue;
      try {
        const parsed = JSON.parse(String(row.content));
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          map.set(id, parsed as StudentProfileData);
        }
      } catch {
        /* skip malformed */
      }
    }
  }

  // Merge students.photo_url when profile JSON has no photo yet.
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const { data, error } = await admin
      .from("students")
      .select("id, photo_url")
      .eq("branch_id", branchId)
      .in("id", chunk);
    if (error) break;
    for (const row of data ?? []) {
      const id = String(row.id);
      const url = String(row.photo_url ?? "").trim();
      if (!url) continue;
      const existing = map.get(id) ?? {};
      if (resolveStudentPhotoUrl(existing)) continue;
      map.set(id, { ...existing, photo_url: url, photo: url });
    }
  }

  return map;
}

export type StudentAttendanceDates = {
  presentDates?: string[];
  absentDates?: string[];
  lateDates?: string[];
  holidayDates?: string[];
  lastUpdated?: string;
  importedFrom?: string;
};

export type StudentListEnrollmentMeta = {
  className?: string;
  section?: string;
  fatherName?: string;
  studentType?: string;
  photoUrl?: string;
  transportDetails?: Record<string, unknown>;
  attendance?: StudentAttendanceDates;
};

/**
 * Extract only the year enrollment block from profile JSON without keeping fee/tx bloat in memory.
 */
export function extractListEnrollmentMeta(
  content: string,
  yearName: string
): StudentListEnrollmentMeta | null {
  if (!content || !yearName) return null;
  if (!content.includes(`"${yearName}"`)) return null;

  try {
    const parsed = JSON.parse(content) as StudentProfileData;
    const enrollment = resolveStudentYearEnrollment(parsed, yearName);
    if (!enrollment) return null;

    const transportDetails =
      (enrollment.transportDetails as Record<string, unknown> | undefined) ??
      (parsed.transportDetails as Record<string, unknown> | undefined);
    const studentType = String(
      (enrollment as Record<string, unknown>).studentType ??
        parsed.studentType ??
        ""
    ).trim();
    const photoUrl = resolveStudentPhotoUrl(parsed);
    const attendance = normalizeAttendanceDates(parsed.attendance);

    return {
      className: enrollment.className ? String(enrollment.className) : undefined,
      section: enrollment.section ? String(enrollment.section) : undefined,
      fatherName: enrollment.fatherName
        ? String(enrollment.fatherName)
        : parsed.fatherName
          ? String(parsed.fatherName)
          : undefined,
      studentType: studentType || undefined,
      photoUrl: photoUrl || undefined,
      transportDetails: transportDetails ? { ...transportDetails } : undefined,
      attendance: attendance ?? undefined,
    };
  } catch {
    return null;
  }
}

function normalizeAttendanceDates(raw: unknown): StudentAttendanceDates | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const att = raw as Record<string, unknown>;
  const presentDates = Array.isArray(att.presentDates)
    ? att.presentDates.map((d) => String(d).slice(0, 10)).filter(Boolean)
    : [];
  const absentDates = Array.isArray(att.absentDates)
    ? att.absentDates.map((d) => String(d).slice(0, 10)).filter(Boolean)
    : [];
  const lateDates = Array.isArray(att.lateDates)
    ? att.lateDates.map((d) => String(d).slice(0, 10)).filter(Boolean)
    : [];
  const holidayDates = Array.isArray(att.holidayDates)
    ? att.holidayDates.map((d) => String(d).slice(0, 10)).filter(Boolean)
    : [];
  if (!presentDates.length && !absentDates.length && !lateDates.length && !holidayDates.length) {
    return null;
  }
  return {
    presentDates,
    absentDates,
    lateDates,
    holidayDates,
    ...(typeof att.lastUpdated === "string" ? { lastUpdated: att.lastUpdated } : {}),
    ...(typeof att.importedFrom === "string" ? { importedFrom: att.importedFrom } : {}),
  };
}

/**
 * Lightweight year enrollment index for list UIs (students / transport / search).
 *
 * Order of preference (permanent — no ILIKE on bloated profile JSON):
 * 1. Materialized notice `__enrollment_index__:{year}` (fast — preferred)
 * 2. SQL RPC `branch_student_enrollment_index` when responsive
 * 3. Build from title-paged profiles, persist notice, return
 *
 * Notice is first: the RPC can still statement-timeout on large profile JSON,
 * and trying it first would add multi-second latency on every list load.
 */
export async function loadStudentEnrollmentIndexForYear(
  admin: SupabaseClient<any>,
  branchId: string,
  yearName: string
): Promise<Map<string, StudentListEnrollmentMeta>> {
  const year = String(yearName ?? "").trim();
  if (!year) return new Map();

  const fromNotice = await loadEnrollmentIndexFromNotice(admin, branchId, year);
  if (fromNotice) return fromNotice;

  const fromRpc = await loadEnrollmentIndexFromRpc(admin, branchId, year);
  if (fromRpc) {
    await saveEnrollmentIndexNotice(admin, branchId, year, fromRpc).catch(() => {
      /* best-effort persist for next load */
    });
    return fromRpc;
  }

  const built = await buildEnrollmentIndexFromProfiles(admin, branchId, year);
  await saveEnrollmentIndexNotice(admin, branchId, year, built).catch(() => {
    /* best-effort persist; list still returns */
  });
  return built;
}

async function loadEnrollmentIndexFromRpc(
  admin: SupabaseClient<any>,
  branchId: string,
  yearName: string
): Promise<Map<string, StudentListEnrollmentMeta> | null> {
  const { data: rpcRows, error: rpcError } = await admin.rpc("branch_student_enrollment_index", {
    p_branch_id: branchId,
    p_year: yearName,
  });

  if (rpcError || !Array.isArray(rpcRows)) return null;

  const hasStudentType = rpcRows.some((row) =>
    Object.prototype.hasOwnProperty.call(row as object, "student_type")
  );
  // Old RPC signature missing student_type — fall through so hostel filters stay accurate.
  if (!hasStudentType && rpcRows.length > 0) return null;

  const map = new Map<string, StudentListEnrollmentMeta>();
  for (const row of rpcRows as Array<Record<string, unknown>>) {
    const id = String(row.student_id ?? "").trim();
    if (!id) continue;
    const fees = row.transport_fees;
    map.set(id, {
      className: row.class_name ? String(row.class_name) : undefined,
      section: row.section ? String(row.section) : undefined,
      fatherName: row.father_name ? String(row.father_name) : undefined,
      studentType: row.student_type ? String(row.student_type) : undefined,
      photoUrl: row.photo_url ? String(row.photo_url) : undefined,
      transportDetails: {
        facility: row.uses_transport ? "YES" : "NO",
        busNo: row.bus_no ?? "",
        route: row.route ?? "",
        stoppage: row.stoppage ?? "",
        driverName: row.driver_name ?? "",
        driverMobile: row.driver_mobile ?? "",
        fees: Array.isArray(fees) ? fees : [],
      },
    });
  }
  return map;
}

async function loadEnrollmentIndexFromNotice(
  admin: SupabaseClient<any>,
  branchId: string,
  yearName: string
): Promise<Map<string, StudentListEnrollmentMeta> | null> {
  const title = enrollmentIndexNoticeTitle(yearName);
  const { data, error } = await admin
    .from("notices")
    .select("content")
    .eq("branch_id", branchId)
    .eq("title", title)
    .maybeSingle();

  if (error || !data?.content) return null;

  try {
    const parsed = JSON.parse(String(data.content)) as {
      version?: number;
      year?: string;
      students?: Record<string, StudentListEnrollmentMeta>;
    };
    if (Number(parsed.version) !== ENROLLMENT_INDEX_VERSION) return null;
    if (String(parsed.year ?? "") !== yearName) return null;
    if (!parsed.students || typeof parsed.students !== "object") return null;

    const map = new Map<string, StudentListEnrollmentMeta>();
    for (const [id, meta] of Object.entries(parsed.students)) {
      if (!id || !meta) continue;
      map.set(id, meta);
    }
    return map;
  } catch {
    return null;
  }
}

export async function buildEnrollmentIndexFromProfiles(
  admin: SupabaseClient<any>,
  branchId: string,
  yearName: string
): Promise<Map<string, StudentListEnrollmentMeta>> {
  // Title-ordered pages only — never ILIKE content (statement timeouts on large JSON).
  const notices = await fetchAllPaginated<{ title: string; content: string }>(
    admin,
    "notices",
    "title, content",
    (query) =>
      query.eq("branch_id", branchId).like("title", `${STUDENT_PROFILE_NOTICE_PREFIX}%`),
    { orderBy: "title", ascending: true }
  );

  const map = new Map<string, StudentListEnrollmentMeta>();
  for (const row of notices) {
    const id = String(row.title).slice(STUDENT_PROFILE_NOTICE_PREFIX.length);
    if (!id) continue;
    const meta = extractListEnrollmentMeta(String(row.content ?? ""), yearName);
    if (meta) map.set(id, meta);
  }
  return map;
}

export async function saveEnrollmentIndexNotice(
  admin: SupabaseClient<any>,
  branchId: string,
  yearName: string,
  index: Map<string, StudentListEnrollmentMeta>
): Promise<void> {
  const title = enrollmentIndexNoticeTitle(yearName);
  const students: Record<string, StudentListEnrollmentMeta> = {};
  for (const [id, meta] of index.entries()) {
    students[id] = {
      className: meta.className,
      section: meta.section,
      fatherName: meta.fatherName,
      studentType: meta.studentType,
      photoUrl: meta.photoUrl,
      transportDetails: meta.transportDetails,
      // Omit attendance date arrays from the slim index.
    };
  }

  const content = JSON.stringify({
    version: ENROLLMENT_INDEX_VERSION,
    year: yearName,
    builtAt: new Date().toISOString(),
    count: index.size,
    students,
  });

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

/** Drop cached year index so the next list load rebuilds it. */
export async function invalidateEnrollmentIndexNotice(
  admin: SupabaseClient<any>,
  branchId: string,
  yearName: string
): Promise<void> {
  const title = enrollmentIndexNoticeTitle(yearName);
  await admin.from("notices").delete().eq("branch_id", branchId).eq("title", title);
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
    "transportHistory",
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
