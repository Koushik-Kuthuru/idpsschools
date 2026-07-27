import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";
import { inferRoleFromStaff, type StaffCategory, type UserRole } from "@/lib/auth/roles";

export type ResolvedStaffSession = {
  recordId: string;
  employeeId: string;
  designation: string;
  department: string;
  staffKind: "teaching" | "non_teaching";
  role: UserRole;
  displayName: string;
};

type RpcStaffRow = {
  record_id?: string | null;
  employee_id?: string | null;
  full_name?: string | null;
  staff_kind?: string | null;
  designation?: string | null;
  department?: string | null;
  username?: string | null;
};

function toSession(row: RpcStaffRow): ResolvedStaffSession | null {
  const recordId = String(row.record_id ?? "").trim();
  if (!recordId) return null;

  const staffKind = row.staff_kind === "teaching" ? "teaching" : "non_teaching";
  const category: StaffCategory = staffKind === "teaching" ? "teaching" : "nonTeaching";
  const designation = String(row.designation ?? (staffKind === "teaching" ? "Teacher" : "Staff"));
  const department = String(row.department ?? (staffKind === "teaching" ? "TEACHING" : "General"));
  const employeeId = String(row.employee_id ?? row.username ?? recordId).trim();

  return {
    recordId,
    employeeId,
    designation,
    department,
    staffKind,
    role: inferRoleFromStaff(designation, department, category),
    displayName: String(row.full_name ?? employeeId),
  };
}

/**
 * Resolve staff session via indexed auth_uid / targeted SQL — never load all staff profiles.
 */
export async function resolveStaffSessionContext(params: {
  admin: SupabaseClient<any>;
  authId: string;
  email: string | null;
  schoolSlug: string;
  employeeIdMeta?: string | null;
}): Promise<ResolvedStaffSession | null> {
  const branchId = await resolveBranchUuid(params.admin, params.schoolSlug);
  if (!branchId) return null;

  const authId = String(params.authId ?? "").trim();
  if (!authId) return null;

  for (const table of ["teachers", "non_teaching_staff"] as const) {
    const { data, error } = await params.admin
      .from(table)
      .select(
        table === "teachers"
          ? "id, employee_id, full_name, subject"
          : "id, employee_id, full_name, department, designation"
      )
      .eq("branch_id", branchId)
      .eq("auth_uid", authId)
      .maybeSingle();

    const row = data as
      | {
          id: string;
          employee_id?: string | null;
          full_name?: string | null;
          subject?: string | null;
          department?: string | null;
          designation?: string | null;
        }
      | null;

    if (!error && row?.id) {
      const staffKind = table === "teachers" ? "teaching" : "non_teaching";
      const category: StaffCategory = staffKind === "teaching" ? "teaching" : "nonTeaching";
      const designation = String(
        row.designation ??
          (staffKind === "teaching" ? "Teacher" : "Staff")
      );
      const department = String(
        row.department ??
          (staffKind === "teaching"
            ? String(row.subject ?? "TEACHING")
            : "General")
      );
      const employeeId = String(row.employee_id ?? row.id).trim();
      return {
        recordId: String(row.id),
        employeeId,
        designation,
        department,
        staffKind,
        role: inferRoleFromStaff(designation, department, category),
        displayName: String(row.full_name ?? employeeId),
      };
    }
  }

  const { data: rpcRows, error: rpcError } = await params.admin.rpc("resolve_staff_session", {
    p_branch_id: branchId,
    p_auth_uid: authId,
    p_email: params.email ?? null,
    p_employee_id: params.employeeIdMeta ?? null,
  });

  if (!rpcError && Array.isArray(rpcRows) && rpcRows.length > 0) {
    return toSession(rpcRows[0] as RpcStaffRow);
  }

  return null;
}

export async function resolveStaffSessionFromAuthMetadata(params: {
  admin: SupabaseClient<any>;
  authId: string;
}): Promise<ResolvedStaffSession | null> {
  const { data: authUser } = await params.admin.auth.admin.getUserById(params.authId);
  const meta = (authUser.user?.user_metadata as Record<string, unknown> | undefined) ?? {};
  const employeeId = String(meta.employee_id ?? "").trim();
  const designation = String(meta.designation ?? meta.role_title ?? "").trim();
  const department = String(meta.department ?? "").trim();
  const fullName = String(meta.full_name ?? "").trim();

  if (!employeeId && !designation) return null;

  const staffKind = meta.staff_kind === "teaching" ? "teaching" : "non_teaching";
  const category: StaffCategory = staffKind === "teaching" ? "teaching" : "nonTeaching";

  return {
    recordId: `auth-${employeeId || params.authId}`,
    employeeId: employeeId || designation,
    designation: designation || "Staff",
    department,
    staffKind,
    role: inferRoleFromStaff(designation, department, category),
    displayName: fullName || employeeId || "Staff",
  };
}

export async function resolveStaffSessionForPortal(params: {
  admin: SupabaseClient<any>;
  authId: string;
  email: string | null;
  schoolSlug: string;
  employeeIdMeta?: string | null;
}): Promise<ResolvedStaffSession | null> {
  const session = await resolveStaffSessionContext(params);
  if (session) return session;
  return resolveStaffSessionFromAuthMetadata({
    admin: params.admin,
    authId: params.authId,
  });
}
