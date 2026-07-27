/**
 * Resolve a staff member's Supabase Auth uid for RBAC.
 * Portal identity lives on staff profile notices (authUid / loginEmail),
 * not on teachers.email (often empty).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { loadStaffProfileData } from "@/lib/loadBranchStaff";
import { resolveStaffYearProfile } from "@/lib/staffProfileStore";

export type ResolvedPortalStaffUser = {
  userId: string;
  email: string | null;
  fullName: string | null;
  portalRole: string | null;
  designation: string | null;
  employeeId: string | null;
  staffRecordId: string | null;
};

async function findAuthUserIdByEmail(
  admin: SupabaseClient<any>,
  email: string
): Promise<{ id: string; email: string | null; role: string | null; fullName: string | null } | null> {
  const target = email.trim().toLowerCase();
  if (!target) return null;

  // Prefer public.users when present
  try {
    const { data, error } = await admin
      .from("users")
      .select("id, email, role, full_name")
      .ilike("email", target)
      .limit(1)
      .maybeSingle();
    if (!error && data?.id) {
      return {
        id: String(data.id),
        email: data.email ? String(data.email) : target,
        role: data.role ? String(data.role) : null,
        fullName: data.full_name ? String(data.full_name) : null,
      };
    }
  } catch {
    // table may not exist
  }

  let page = 1;
  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) break;
    const match = data.users.find((u) => String(u.email ?? "").toLowerCase() === target);
    if (match?.id) {
      const meta = (match.user_metadata ?? {}) as Record<string, unknown>;
      return {
        id: match.id,
        email: match.email ?? target,
        role: meta.role ? String(meta.role) : null,
        fullName: meta.full_name || meta.fullName ? String(meta.full_name ?? meta.fullName) : null,
      };
    }
    if (data.users.length < 200) break;
    page += 1;
  }
  return null;
}

async function loadAuthUserSummary(
  admin: SupabaseClient<any>,
  userId: string
): Promise<{ email: string | null; role: string | null; fullName: string | null } | null> {
  try {
    const { data, error } = await admin
      .from("users")
      .select("email, role, full_name")
      .eq("id", userId)
      .maybeSingle();
    if (!error && data) {
      return {
        email: data.email ? String(data.email) : null,
        role: data.role ? String(data.role) : null,
        fullName: data.full_name ? String(data.full_name) : null,
      };
    }
  } catch {
    // ignore
  }

  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data?.user) return null;
  const meta = (data.user.user_metadata ?? {}) as Record<string, unknown>;
  return {
    email: data.user.email ?? null,
    role: meta.role ? String(meta.role) : null,
    fullName: meta.full_name || meta.fullName ? String(meta.full_name ?? meta.fullName) : null,
  };
}

async function findStaffRowByEmployeeId(
  admin: SupabaseClient<any>,
  branchId: string,
  employeeId: string
): Promise<{ id: string; table: "teachers" | "non_teaching_staff"; fullName: string | null; email: string | null } | null> {
  const needle = employeeId.trim();
  if (!needle) return null;

  for (const table of ["teachers", "non_teaching_staff"] as const) {
    const byEmployee = await admin
      .from(table)
      .select("id, employee_id, full_name, email")
      .eq("branch_id", branchId)
      .eq("employee_id", needle)
      .limit(1)
      .maybeSingle();
    if (byEmployee.data?.id) {
      return {
        id: String(byEmployee.data.id),
        table,
        fullName: byEmployee.data.full_name ? String(byEmployee.data.full_name) : null,
        email: byEmployee.data.email ? String(byEmployee.data.email) : null,
      };
    }

    const byId = await admin
      .from(table)
      .select("id, employee_id, full_name, email")
      .eq("branch_id", branchId)
      .eq("id", needle)
      .limit(1)
      .maybeSingle();
    if (byId.data?.id) {
      return {
        id: String(byId.data.id),
        table,
        fullName: byId.data.full_name ? String(byId.data.full_name) : null,
        email: byId.data.email ? String(byId.data.email) : null,
      };
    }
  }
  return null;
}

/**
 * Resolve portal auth uid for RBAC from any of: userId, authUid, employeeId, email.
 */
export async function resolvePortalStaffUser(params: {
  admin: SupabaseClient<any>;
  branchId: string;
  userId?: string | null;
  authUid?: string | null;
  employeeId?: string | null;
  email?: string | null;
  designation?: string | null;
  academicYear?: string | null;
}): Promise<ResolvedPortalStaffUser | null> {
  const admin = params.admin;
  let userId = String(params.userId ?? params.authUid ?? "").trim();
  let email = String(params.email ?? "").trim().toLowerCase() || null;
  let designation = String(params.designation ?? "").trim() || null;
  let employeeId = String(params.employeeId ?? "").trim() || null;
  let staffRecordId: string | null = null;
  let fullName: string | null = null;
  let portalRole: string | null = null;

  // Resolve from employeeId → staff profile authUid / loginEmail
  if ((!userId || !email || !designation) && employeeId) {
    const row = await findStaffRowByEmployeeId(admin, params.branchId, employeeId);
    if (row) {
      staffRecordId = row.id;
      fullName = row.fullName;
      if (!email && row.email) email = row.email.toLowerCase();
      const profile = await loadStaffProfileData(admin, params.branchId, row.id);
      const yearProfile = resolveStaffYearProfile(profile, params.academicYear ?? null);
      if (!userId && profile.authUid) userId = String(profile.authUid).trim();
      if (!email && profile.loginEmail) email = String(profile.loginEmail).trim().toLowerCase();
      if (!designation && yearProfile.designation) designation = String(yearProfile.designation).trim();
      if (!employeeId && row.id) {
        // keep original employeeId param if provided
      }
    }
  }

  // Resolve from email → auth user
  if (!userId && email) {
    const byEmail = await findAuthUserIdByEmail(admin, email);
    if (byEmail) {
      userId = byEmail.id;
      portalRole = byEmail.role;
      fullName = fullName || byEmail.fullName;
      email = byEmail.email || email;
    }
  }

  if (!userId) return null;

  const summary = await loadAuthUserSummary(admin, userId);
  if (summary) {
    email = email || summary.email;
    portalRole = portalRole || summary.role;
    fullName = fullName || summary.fullName;
  }

  return {
    userId,
    email,
    fullName,
    portalRole,
    designation,
    employeeId,
    staffRecordId,
  };
}
