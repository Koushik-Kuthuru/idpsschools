import type { SupabaseClient } from "@supabase/supabase-js";
import { displayAdmissionNo } from "@/lib/admissionNo";
import { resolveBranchUuid, BRANCH_SLUGS, normalizeBranchSlug } from "@/lib/resolveBranchUuid";
import {
  loadStudentProfileData,
  type StudentProfileData,
} from "@/lib/studentProfileStore";
import { type StaffProfileData } from "@/lib/staffProfileStore";
import { loadStaffProfileData } from "@/lib/loadBranchStaff";
import { staffLoginEmail, studentLoginEmail, inferRoleFromStaff } from "@/lib/auth/roles";
import {
  identifierVariants,
  looksLikeStaffIdentifier,
  normalizePortalIdentifier,
} from "@/lib/auth/portal-identifier";

export type PortalAccountKind = "student" | "staff";

export type ResolvedPortalAccount = {
  kind: PortalAccountKind;
  schoolSlug: string;
  recordId: string;
  displayName: string;
  username: string;
  loginEmail?: string;
  authUid?: string;
  role: string;
  staffKind?: "teaching" | "non_teaching";
  department?: string;
  roleTitle?: string;
  staffEmail?: string;
};

const BRANCH_LIST = Object.values(BRANCH_SLUGS);

export { looksLikeStaffIdentifier, identifierVariants } from "@/lib/auth/portal-identifier";

function normalizeIdentifier(raw: string): string {
  return normalizePortalIdentifier(raw);
}

export function legacyPortalEmail(identifier: string): string {
  const safe = String(identifier ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "");
  return `${safe}@idps.local`;
}

export function buildCandidateLoginEmails(params: {
  identifier: string;
  schoolSlug: string;
  kind: PortalAccountKind;
  username?: string;
  loginEmail?: string;
  staffEmail?: string;
}): string[] {
  const emails = new Set<string>();
  const identifier = normalizeIdentifier(params.identifier);
  if (identifier.includes("@")) emails.add(identifier.toLowerCase());

  const loginEmail = String(params.loginEmail ?? "").trim().toLowerCase();
  if (loginEmail) emails.add(loginEmail);

  const staffEmail = String(params.staffEmail ?? "").trim().toLowerCase();
  if (staffEmail.includes("@")) emails.add(staffEmail);

  const userKey = String(params.username ?? identifier)
    .toLowerCase()
    .replace(/^std_/, "")
    .replace(/[^a-z0-9._-]/g, "");

  if (params.kind === "student") {
    if (userKey) emails.add(studentLoginEmail(userKey, params.schoolSlug));
    if (userKey) emails.add(legacyPortalEmail(userKey));
  } else if (userKey) {
    emails.add(staffLoginEmail(userKey, params.schoolSlug, staffEmail || undefined));
    emails.add(legacyPortalEmail(userKey));
  }

  return [...emails].filter(Boolean);
}

function matchesIdentifier(candidate: string, identifier: string): boolean {
  const variants = new Set(identifierVariants(identifier));
  const value = String(candidate ?? "").trim();
  if (!value) return false;
  if (variants.has(value) || variants.has(value.toLowerCase()) || variants.has(value.toUpperCase())) {
    return true;
  }
  // Digit-only equality only when BOTH sides are numeric admission-style ids.
  if (/^\d+$/.test(normalizeIdentifier(identifier)) && /^\d+$/.test(value.replace(/\D/g, "") || "")) {
    const idDigits = normalizeIdentifier(identifier).replace(/\D/g, "");
    const valueDigits = value.replace(/\D/g, "");
    return Boolean(idDigits && valueDigits && idDigits === valueDigits);
  }
  return false;
}

function normalizeEmail(value: string | null | undefined): string {
  return String(value ?? "").trim().toLowerCase();
}

function staffIdentifierMatches(
  identifier: string,
  params: {
    employeeId: string;
    username: string;
    userId: string;
    schoolSlug: string;
    rowEmail?: string | null;
    profileLoginEmail?: string | null;
  }
): boolean {
  if (
    matchesIdentifier(params.employeeId, identifier) ||
    matchesIdentifier(params.username, identifier) ||
    matchesIdentifier(params.userId, identifier)
  ) {
    return true;
  }

  const idEmail = normalizeEmail(identifier);
  if (!idEmail.includes("@")) return false;

  const candidates = buildCandidateLoginEmails({
    identifier: params.employeeId,
    schoolSlug: params.schoolSlug,
    kind: "staff",
    username: params.username,
    loginEmail: params.profileLoginEmail ?? undefined,
    staffEmail: params.rowEmail ?? undefined,
  }).map(normalizeEmail);

  if (candidates.includes(idEmail)) return true;
  if (params.rowEmail && normalizeEmail(params.rowEmail) === idEmail) return true;
  if (params.profileLoginEmail && normalizeEmail(params.profileLoginEmail) === idEmail) return true;
  return false;
}

function yearProfileForStaff(profile: StaffProfileData): StaffProfileData {
  const years = profile.years ?? {};
  const latestYear = Object.keys(years).sort().at(-1);
  if (latestYear && years[latestYear]) {
    return { ...profile, ...years[latestYear] };
  }
  return profile;
}

async function loadOneStaffProfile(
  admin: SupabaseClient<any>,
  branchId: string,
  staffId: string
): Promise<StaffProfileData> {
  return loadStaffProfileData(admin, branchId, staffId);
}

function studentAccountFromRow(
  schoolSlug: string,
  row: { id: string; admission_no?: string | null; full_name?: string | null; user_id?: string | null },
  profile: StudentProfileData
): ResolvedPortalAccount {
  const admissionNo = displayAdmissionNo(String(row.admission_no ?? ""));
  const username = String(profile.username ?? "").trim();
  const resolvedUsername =
    (username ? username.replace(/^std_/, "") : "") ||
    (admissionNo ? admissionNo.toLowerCase().replace(/[^a-z0-9_]/g, "") : String(row.id));

  return {
    kind: "student",
    schoolSlug,
    recordId: String(row.id),
    displayName: String(row.full_name ?? admissionNo ?? resolvedUsername),
    username: resolvedUsername,
    loginEmail: profile.loginEmail ? String(profile.loginEmail) : undefined,
    authUid: profile.authUid ? String(profile.authUid) : undefined,
    role: "student",
  };
}

async function resolveStudentAccount(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  identifier: string
): Promise<ResolvedPortalAccount | null> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return null;

  const variants = identifierVariants(identifier);
  const idEmail = normalizeEmail(identifier);

  // Fast path: admission number / user_id exact matches (no full-table profile scan).
  const orFilters = new Set<string>();
  for (const value of variants) {
    orFilters.add(`admission_no.eq.${value}`);
    orFilters.add(`user_id.eq.${value}`);
    if (/^\d+$/.test(value)) {
      orFilters.add(`admission_no.like.${value}#%`);
    }
  }

  const { data: rows, error } = await admin
    .from("students")
    .select("id, admission_no, full_name, user_id")
    .eq("branch_id", branchId)
    .or([...orFilters].join(","))
    .limit(20);

  if (!error && rows?.length) {
    for (const row of rows) {
      const profile = await loadStudentProfileData(admin, branchId, String(row.id));
      const admissionNo = displayAdmissionNo(String(row.admission_no ?? ""));
      const username = String(profile.username ?? "").trim();
      const matches =
        matchesIdentifier(admissionNo, identifier) ||
        matchesIdentifier(username.replace(/^std_/, ""), identifier) ||
        matchesIdentifier(String(row.user_id ?? ""), identifier) ||
        (username && matchesIdentifier(`std_${username}`, identifier));
      if (!matches) continue;
      return studentAccountFromRow(schoolSlug, row, profile);
    }
  }

  // Email / username path: look up profile notices that store loginEmail / username.
  if (idEmail.includes("@") || /[a-z]/i.test(identifier)) {
    const loginCandidates = idEmail.includes("@")
      ? [idEmail]
      : buildCandidateLoginEmails({
          identifier,
          schoolSlug,
          kind: "student",
          username: identifier,
        }).map(normalizeEmail);

    // Prefer matching admission/user_id derived from local-part before scanning notices.
    const localPart = idEmail.includes("@") ? idEmail.split("@")[0] : identifier.toLowerCase();
    const localDigits = localPart.replace(/\D/g, "");
    if (localDigits || localPart) {
      const { data: byLocal } = await admin
        .from("students")
        .select("id, admission_no, full_name, user_id")
        .eq("branch_id", branchId)
        .or(
          [
            localDigits ? `admission_no.eq.${localDigits}` : null,
            localDigits ? `admission_no.like.${localDigits}#%` : null,
            `user_id.eq.${localPart}`,
            `user_id.eq.${localPart.replace(/^std_/, "")}`,
          ]
            .filter(Boolean)
            .join(",")
        )
        .limit(10);

      for (const row of byLocal ?? []) {
        const profile = await loadStudentProfileData(admin, branchId, String(row.id));
        const profileLoginEmail = normalizeEmail(profile.loginEmail ? String(profile.loginEmail) : "");
        const admissionNo = displayAdmissionNo(String(row.admission_no ?? ""));
        const username = String(profile.username ?? "").trim();
        const candidateEmails = buildCandidateLoginEmails({
          identifier: admissionNo || username,
          schoolSlug,
          kind: "student",
          username,
          loginEmail: profileLoginEmail || undefined,
        }).map(normalizeEmail);

        if (
          (idEmail.includes("@") && (profileLoginEmail === idEmail || candidateEmails.includes(idEmail))) ||
          matchesIdentifier(username.replace(/^std_/, ""), identifier) ||
          matchesIdentifier(admissionNo, identifier)
        ) {
          return studentAccountFromRow(schoolSlug, row, profile);
        }
      }
    }

    void loginCandidates;
  }

  return null;
}

async function resolveStaffAccount(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  identifier: string
): Promise<ResolvedPortalAccount | null> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return null;

  const variants = identifierVariants(identifier);
  const idEmail = normalizeEmail(identifier);
  const localPart = idEmail.includes("@") ? idEmail.split("@")[0] : "";

  const staffFromRow = async (
    table: "teachers" | "non_teaching_staff",
    row: {
      id: string;
      employee_id?: string | null;
      full_name?: string | null;
      email?: string | null;
      user_id?: string | null;
    }
  ): Promise<ResolvedPortalAccount | null> => {
    const kind = table === "teachers" ? "teaching" : "non_teaching";
    const profile = yearProfileForStaff(await loadOneStaffProfile(admin, branchId, String(row.id)));
    const employeeId = String(row.employee_id ?? row.id ?? "").trim();
    const username = String(profile.username ?? employeeId).trim();
    const matches = staffIdentifierMatches(identifier, {
      employeeId,
      username,
      userId: String(row.user_id ?? ""),
      schoolSlug,
      rowEmail: row.email ? String(row.email) : null,
      profileLoginEmail: profile.loginEmail ? String(profile.loginEmail) : null,
    });
    if (!matches) return null;

    const designation = String(profile.designation ?? "Teacher");
    const department = String(profile.department ?? "Academic");
    const staffCategory = kind === "teaching" ? "teaching" : "nonTeaching";

    return {
      kind: "staff",
      schoolSlug,
      recordId: String(row.id),
      displayName: String(row.full_name ?? employeeId),
      username: username || employeeId,
      loginEmail: profile.loginEmail ? String(profile.loginEmail) : undefined,
      authUid: profile.authUid ? String(profile.authUid) : undefined,
      role: inferRoleFromStaff(designation, department, staffCategory),
      staffKind: kind,
      department,
      roleTitle: designation,
      staffEmail: row.email ? String(row.email) : undefined,
    };
  };

  for (const table of ["teachers", "non_teaching_staff"] as const) {
    const orFilters = new Set<string>();
    for (const value of variants) {
      orFilters.add(`employee_id.eq.${value}`);
      orFilters.add(`user_id.eq.${value}`);
      // Case-insensitive exact match for mixed-case employee ids.
      orFilters.add(`employee_id.ilike.${value}`);
      orFilters.add(`user_id.ilike.${value}`);
    }
    if (localPart) {
      orFilters.add(`employee_id.eq.${localPart}`);
      orFilters.add(`user_id.eq.${localPart}`);
    }
    if (idEmail.includes("@")) {
      orFilters.add(`email.eq.${idEmail}`);
    }

    const { data, error } = await admin
      .from(table)
      .select("id, employee_id, full_name, email, user_id")
      .eq("branch_id", branchId)
      .or([...orFilters].join(","))
      .limit(20);

    if (error || !data?.length) continue;

    for (const row of data) {
      const account = await staffFromRow(table, row);
      if (account) return account;
    }
  }

  // Fallback: username / loginEmail only stored on staff profile notices.
  if (looksLikeStaffIdentifier(identifier) || idEmail.includes("@")) {
    const needles = idEmail.includes("@")
      ? [idEmail]
      : [...new Set([identifier.toLowerCase(), identifier])];

    for (const needle of needles) {
      const { data: notices } = await admin
        .from("notices")
        .select("title, content")
        .eq("branch_id", branchId)
        .like("title", "__staff_profile__:%")
        .or(
          [`content.ilike.%\"username\":\"${needle}\"%,content.ilike.%\"loginEmail\":\"${needle}\"%`].join(
            ","
          )
        )
        .limit(5);

      for (const notice of notices ?? []) {
        const staffId = String(notice.title ?? "").replace(/^__staff_profile__:/, "").trim();
        if (!staffId) continue;
        for (const table of ["teachers", "non_teaching_staff"] as const) {
          const { data: row } = await admin
            .from(table)
            .select("id, employee_id, full_name, email, user_id")
            .eq("branch_id", branchId)
            .eq("id", staffId)
            .maybeSingle();
          if (!row) continue;
          const account = await staffFromRow(table, row);
          if (account) return account;
        }
      }
    }
  }

  return null;
}

export async function resolvePortalAccount(
  admin: SupabaseClient<any>,
  identifier: string,
  options?: { schoolSlug?: string | null; prefer?: PortalAccountKind }
): Promise<ResolvedPortalAccount | null> {
  const normalized = normalizeIdentifier(identifier);
  if (!normalized) return null;

  const branches = options?.schoolSlug
    ? [normalizeBranchSlug(options.schoolSlug) ?? options.schoolSlug]
    : BRANCH_LIST;

  // Server-side prefer: alphanumeric employee-style ids must try staff first even if
  // the client forgets to send prefer=staff (otherwise student digit heuristics race).
  const prefer: PortalAccountKind | undefined =
    options?.prefer ?? (looksLikeStaffIdentifier(normalized) ? "staff" : undefined);

  const tryOrder: PortalAccountKind[] =
    prefer === "staff" ? ["staff", "student"] : ["student", "staff"];

  for (const schoolSlug of branches) {
    if (!schoolSlug) continue;
    for (const kind of tryOrder) {
      const account =
        kind === "student"
          ? await resolveStudentAccount(admin, schoolSlug, normalized)
          : await resolveStaffAccount(admin, schoolSlug, normalized);
      if (account) return account;
    }
  }

  return null;
}
