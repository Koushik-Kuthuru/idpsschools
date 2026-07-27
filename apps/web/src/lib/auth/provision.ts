import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { bridgeSupabaseEnv } from "@/lib/supabase/env";
import { getSchoolUuidFromSlug } from "@/lib/supabase/client";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";
import {
  loadStudentProfileData,
  saveStudentProfileData,
  type StudentProfileData,
} from "@/lib/studentProfileStore";
import { loadStaffProfileData, saveStaffProfileData } from "@/lib/loadBranchStaff";
import {
  inferRoleFromStaff,
  staffLoginEmail,
  studentLoginEmail,
} from "@/lib/auth/roles";
import {
  buildCandidateLoginEmails,
  legacyPortalEmail,
  type ResolvedPortalAccount,
} from "@/lib/auth/portal-credentials";
import type { ProvisionStaffPayload, ProvisionStudentPayload } from "@/lib/auth/provision-client";
import { displayAdmissionNo } from "@/lib/admissionNo";
import {
  normalizePortalAuthPassword,
  portalAuthPasswordCandidates,
} from "@/lib/auth/portal-password";

export type ProvisionResult = {
  ok: boolean;
  configured: boolean;
  uid?: string;
  email?: string;
  loginEmail?: string;
  password?: string;
  role?: string;
  error?: string;
};

function envConfigured(): boolean {
  const env = bridgeSupabaseEnv();
  return Boolean(env.url && env.secretKeys?.default && env.publishableKeys?.default);
}

function authAdminClient() {
  const env = bridgeSupabaseEnv();
  return createClient(env.url!, env.secretKeys!.default!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function authPublicClient() {
  const env = bridgeSupabaseEnv();
  return createClient(env.url!, env.publishableKeys!.default!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function upsertPublicUserRow(params: {
  admin: SupabaseClient<any>;
  uid: string;
  schoolSlug: string;
  role: string;
  fullName: string;
  email: string;
  phone?: string;
}) {
  const schoolId = await getSchoolUuidFromSlug(params.schoolSlug);
  if (!schoolId) return;

  const row = {
    id: params.uid,
    school_id: schoolId,
    role: params.role,
    full_name: params.fullName,
    email: params.email,
    phone: params.phone ?? null,
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  const { error } = await params.admin.from("users").upsert(row, { onConflict: "id" });
  if (error) {
    console.warn("users upsert:", error.message);
  }
}

async function findAuthUserIdByEmail(admin: SupabaseClient<any>, email: string): Promise<string | null> {
  const target = email.trim().toLowerCase();
  let page = 1;
  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    const match = data.users.find((user) => String(user.email ?? "").toLowerCase() === target);
    if (match?.id) return match.id;
    if (data.users.length < 200) break;
    page += 1;
  }
  return null;
}

async function ensureAuthUser(params: {
  email: string;
  password: string;
  metadata: Record<string, unknown>;
  /** Prefer known auth UID over slow email list pagination. */
  authUid?: string | null;
}): Promise<string> {
  const admin = authAdminClient();
  const email = params.email.trim().toLowerCase();
  const password = normalizePortalAuthPassword(String(params.password ?? ""));
  if (!password) {
    throw new Error("Password is required");
  }

  const existingId =
    String(params.authUid ?? "").trim() || (await findAuthUserIdByEmail(admin, email));
  if (existingId) {
    const { error } = await admin.auth.admin.updateUserById(existingId, {
      password,
      email_confirm: true,
      user_metadata: params.metadata,
    });
    if (error) throw new Error(error.message);
    return existingId;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: params.metadata,
  });
  if (error) throw new Error(error.message);
  if (!data.user?.id) throw new Error("Auth user was not created");
  return data.user.id;
}

/** True when entered matches stored portal password ignoring incidental whitespace. */
function portalPasswordsEquivalent(entered: string, stored: string): boolean {
  const a = String(entered ?? "").trim();
  const b = String(stored ?? "").trim();
  if (!a || !b) return false;
  if (a === b) return true;
  const compactA = a.replace(/\s+/g, "");
  const compactB = b.replace(/\s+/g, "");
  return (
    compactA === compactB ||
    compactA.toLowerCase() === compactB.toLowerCase() ||
    a.toLowerCase() === b.toLowerCase()
  );
}

export async function provisionStudentPortalUser(
  admin: SupabaseClient<any>,
  payload: ProvisionStudentPayload
): Promise<ProvisionResult> {
  if (!envConfigured()) {
    return { ok: false, configured: false, error: "Supabase auth is not configured" };
  }

  try {
    const schoolSlug = String(payload.schoolId ?? "").trim();
    const username = String(payload.username ?? "").trim();
    const password = String(payload.password ?? "").trim();
    const studentId = String(payload.studentDocId ?? "").trim();
    if (!schoolSlug || !username || !password || !studentId) {
      return { ok: false, configured: true, error: "Missing student provision fields" };
    }

    const loginEmail = studentLoginEmail(username.replace(/^std_/, ""), schoolSlug);
    const uid = await ensureAuthUser({
      email: loginEmail,
      password,
      metadata: {
        role: "student",
        school_id: schoolSlug,
        full_name: payload.displayName,
        username,
        student_id: studentId,
      },
    });

    await upsertPublicUserRow({
      admin,
      uid,
      schoolSlug,
      role: "student",
      fullName: payload.displayName,
      email: loginEmail,
    });

    const branchId = await resolveBranchUuid(admin, schoolSlug);
    if (branchId) {
      const profile = await loadStudentProfileData(admin, branchId, studentId);
      const { data: studentRow } = await admin
        .from("students")
        .select("admission_no")
        .eq("id", studentId)
        .eq("branch_id", branchId)
        .maybeSingle();

      const portalUserId =
        displayAdmissionNo(String(studentRow?.admission_no ?? "")) ||
        username.replace(/^std_/, "");

      const next: StudentProfileData = {
        ...profile,
        username: portalUserId || username.replace(/^std_/, ""),
        portalPassword: password,
        loginEmail,
        authUid: uid,
        portalProvisioned: true,
      };
      await saveStudentProfileData(admin, branchId, studentId, next);

      await admin
        .from("students")
        .update({
          ...(portalUserId ? { user_id: portalUserId } : {}),
          auth_uid: uid,
        })
        .eq("id", studentId)
        .eq("branch_id", branchId)
        .then(({ error }) => {
          if (error) console.warn("students.auth_uid/user_id update:", error.message);
        });
    }

    return { ok: true, configured: true, uid, email: loginEmail, loginEmail, password, role: "student" };
  } catch (err) {
    return {
      ok: false,
      configured: true,
      error: err instanceof Error ? err.message : "Student provisioning failed",
    };
  }
}

export async function provisionStaffPortalUser(
  admin: SupabaseClient<any>,
  payload: ProvisionStaffPayload
): Promise<ProvisionResult> {
  if (!envConfigured()) {
    return { ok: false, configured: false, error: "Supabase auth is not configured" };
  }

  try {
    const schoolSlug = String(payload.schoolId ?? "").trim();
    const employeeId = String(payload.employeeId ?? "").trim();
    const password = String(payload.password ?? "").trim();
    if (!schoolSlug || !employeeId || !password) {
      return { ok: false, configured: true, error: "Missing staff provision fields" };
    }

    const role = inferRoleFromStaff(payload.roleTitle, payload.department, payload.category);
    const loginEmail = staffLoginEmail(employeeId, schoolSlug, payload.email);
    const uid = await ensureAuthUser({
      email: loginEmail,
      password,
      metadata: {
        role,
        school_id: schoolSlug,
        full_name: payload.displayName,
        employee_id: employeeId,
        department: payload.department,
        designation: payload.roleTitle,
      },
    });

    await upsertPublicUserRow({
      admin,
      uid,
      schoolSlug,
      role,
      fullName: payload.displayName,
      email: loginEmail,
      phone: payload.phone,
    });

    const branchId = await resolveBranchUuid(admin, schoolSlug);
    if (branchId) {
      const { data: staffRows } = await admin
        .from(payload.category === "nonTeaching" ? "non_teaching_staff" : "teachers")
        .select("id")
        .eq("branch_id", branchId)
        .eq("employee_id", employeeId)
        .limit(1);

      const staffRowId = staffRows?.[0]?.id ? String(staffRows[0].id) : employeeId;
      const profile = await loadStaffProfileData(admin, branchId, staffRowId);
      const nextProfile = { ...profile } as typeof profile & {
        portalPasswordHash?: string;
        passwordChangedAt?: string;
        passwordChangedBy?: string;
        password?: string;
      };
      delete nextProfile.portalPasswordHash;
      delete nextProfile.passwordChangedAt;
      delete nextProfile.passwordChangedBy;
      delete nextProfile.password;
      if (nextProfile.years) {
        nextProfile.years = Object.fromEntries(
          Object.entries(nextProfile.years).map(([year, value]) => {
            const yearProfile = { ...(value ?? {}) };
            delete yearProfile.portalPasswordHash;
            delete yearProfile.password;
            return [year, yearProfile];
          })
        );
      }
      await saveStaffProfileData(admin, branchId, staffRowId, {
        ...nextProfile,
        username: employeeId.toLowerCase(),
        portalPassword: password,
        loginEmail,
        authUid: uid,
        portalProvisioned: true,
      });

      await admin
        .from(payload.category === "nonTeaching" ? "non_teaching_staff" : "teachers")
        .update({ user_id: employeeId })
        .eq("branch_id", branchId)
        .eq("employee_id", employeeId)
        .then(({ error }) => {
          if (error) console.warn("staff.user_id update:", error.message);
        });

      // auth_uid is optional until migration is applied — never fail provision on it.
      await admin
        .from(payload.category === "nonTeaching" ? "non_teaching_staff" : "teachers")
        .update({ auth_uid: uid })
        .eq("branch_id", branchId)
        .eq("employee_id", employeeId)
        .then(({ error }) => {
          if (error && !/auth_uid|schema cache/i.test(error.message)) {
            console.warn("staff.auth_uid update:", error.message);
          }
        });
    }

    return { ok: true, configured: true, uid, email: loginEmail, loginEmail, password, role };
  } catch (err) {
    return {
      ok: false,
      configured: true,
      error: err instanceof Error ? err.message : "Staff provisioning failed",
    };
  }
}

export async function signInPortalUser(params: {
  identifier: string;
  password: string;
  account: ResolvedPortalAccount;
  staffEmail?: string;
  /** Also try these Auth password variants (e.g. stored profile password with spaces). */
  alternatePasswords?: string[];
}): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: { id: string; email?: string };
}> {
  const client = authPublicClient();
  const emails = buildCandidateLoginEmails({
    identifier: params.identifier,
    schoolSlug: params.account.schoolSlug,
    kind: params.account.kind,
    username: params.account.username,
    loginEmail: params.account.loginEmail,
    staffEmail: params.staffEmail,
  });

  let lastError: Error | null = null;
  const passwords = [
    ...portalAuthPasswordCandidates(params.password),
    ...(params.alternatePasswords ?? []).flatMap((pw) => portalAuthPasswordCandidates(pw)),
  ];
  const uniquePasswords = [...new Set(passwords.filter(Boolean))];

  for (const email of emails) {
    for (const password of uniquePasswords) {
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      });
      if (!error && data.session) {
        return {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_in: data.session.expires_in ?? 3600,
          token_type: data.session.token_type ?? "bearer",
          user: { id: data.user.id, email: data.user.email ?? email },
        };
      }
      lastError = error ?? new Error("Invalid login credentials");
    }
  }

  throw lastError ?? new Error("Invalid login credentials");
}

export async function autoProvisionAndSignIn(params: {
  admin: SupabaseClient<any>;
  identifier: string;
  password: string;
  account: ResolvedPortalAccount;
  profilePassword?: string;
}): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: { id: string; email?: string };
}> {
  const profilePassword = String(params.profilePassword ?? "").trim();
  const enteredPassword = String(params.password ?? "").trim();

  try {
    return await signInPortalUser({
      identifier: params.identifier,
      password: enteredPassword,
      account: params.account,
      staffEmail: params.account.staffEmail,
      alternatePasswords: profilePassword ? [profilePassword] : [],
    });
  } catch (initialError) {
    // Allow first-time provision OR re-sync when Auth drifted from the accepted
    // portal password (e.g. "koushik 123" in Auth vs "koushik123" typed).
    const canResync =
      !profilePassword ||
      profilePassword === enteredPassword ||
      portalPasswordsEquivalent(enteredPassword, profilePassword);

    if (!canResync) {
      throw initialError;
    }

    const loginEmail =
      params.account.loginEmail ||
      (params.account.kind === "student"
        ? studentLoginEmail(params.account.username.replace(/^std_/, ""), params.account.schoolSlug)
        : staffLoginEmail(
            params.account.username,
            params.account.schoolSlug,
            params.account.staffEmail
          ));

    // Prefer syncing Auth to what the user just typed (canonical), using known UID.
    if (params.account.authUid) {
      try {
        await ensureAuthUser({
          email: loginEmail,
          password: enteredPassword,
          authUid: params.account.authUid,
          metadata: {
            role: params.account.role,
            school_id: params.account.schoolSlug,
            full_name: params.account.displayName,
            employee_id: params.account.kind === "staff" ? params.account.username : undefined,
            username: params.account.username,
          },
        });
        return await signInPortalUser({
          identifier: loginEmail,
          password: enteredPassword,
          account: { ...params.account, loginEmail },
          staffEmail: params.account.staffEmail,
        });
      } catch {
        /* fall through to full provision */
      }
    }

    if (params.account.kind === "student") {
      const result = await provisionStudentPortalUser(params.admin, {
        type: "student",
        schoolId: params.account.schoolSlug,
        displayName: params.account.displayName,
        username: params.account.username,
        studentDocId: params.account.recordId,
        password: enteredPassword,
      });
      if (!result.ok) {
        throw new Error(result.error || "Could not create student portal login");
      }
    } else {
      const result = await provisionStaffPortalUser(params.admin, {
        type: "staff",
        schoolId: params.account.schoolSlug,
        displayName: params.account.displayName,
        employeeId: params.account.username,
        roleTitle: params.account.roleTitle ?? "Teacher",
        department: params.account.department ?? "Academic",
        password: enteredPassword,
        email: params.account.staffEmail,
        category: params.account.staffKind === "non_teaching" ? "nonTeaching" : "teaching",
      });
      if (!result.ok) {
        throw new Error(result.error || "Could not create staff portal login");
      }
    }

    return signInPortalUser({
      identifier: loginEmail,
      password: enteredPassword,
      account: { ...params.account, loginEmail },
      staffEmail: params.account.staffEmail,
    });
  }
}

export function primaryLoginEmailForAccount(account: ResolvedPortalAccount): string {
  if (account.loginEmail) return account.loginEmail;
  if (account.kind === "student") {
    return studentLoginEmail(account.username.replace(/^std_/, ""), account.schoolSlug);
  }
  return staffLoginEmail(account.username, account.schoolSlug);
}

export { legacyPortalEmail };
