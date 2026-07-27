/**
 * Effective permission resolution:
 *   role defaults ∪ user grants − user denies
 * User-specific overrides always win.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  RBAC_ACTIONS,
  moduleKeyFromLabel,
  moduleLabelFromKey,
  navLabelsForModule,
  type OverrideEffect,
  type RbacAction,
  type RecordScope,
} from "@/lib/rbac/catalog";
import type { PermissionAction } from "@/lib/portalPermissionsStore";
import { pageIdFromLabel } from "@/lib/portalPermissionsStore";

export type PermissionPair = { moduleKey: string; actionKey: string };

export type EffectivePermissions = {
  fullAccess: boolean;
  portalEnabled: boolean;
  roleIds: string[];
  roleNames: string[];
  recordScopes: RecordScope[];
  /** module_key -> set of allowed actions */
  allowed: Record<string, Set<string>>;
  inherited: PermissionPair[];
  granted: PermissionPair[];
  denied: PermissionPair[];
};

export type RbacRoleRow = {
  id: string;
  branch_id: string;
  key: string;
  name: string;
  description: string | null;
  is_system: boolean;
  is_custom: boolean;
  designation_name: string | null;
  portal_role: string | null;
  record_scope: RecordScope;
  status: string;
};

function emptyEffective(partial?: Partial<EffectivePermissions>): EffectivePermissions {
  return {
    fullAccess: false,
    portalEnabled: true,
    roleIds: [],
    roleNames: [],
    recordScopes: [],
    allowed: {},
    inherited: [],
    granted: [],
    denied: [],
    ...partial,
  };
}

function addAllowed(map: Record<string, Set<string>>, moduleKey: string, actionKey: string) {
  if (!map[moduleKey]) map[moduleKey] = new Set();
  map[moduleKey].add(actionKey);
  // Creating/editing implies view for UX consistency
  if (actionKey !== "view") map[moduleKey].add("view");
}

function removeAllowed(map: Record<string, Set<string>>, moduleKey: string, actionKey: string) {
  map[moduleKey]?.delete(actionKey);
  if (map[moduleKey] && map[moduleKey].size === 0) delete map[moduleKey];
}

export function hasEffectivePermission(
  effective: EffectivePermissions,
  moduleKeyOrLabel: string,
  action: string
): boolean {
  if (effective.fullAccess) return true;
  if (!effective.portalEnabled) return false;
  const moduleKey = moduleKeyFromLabel(moduleKeyOrLabel) || moduleKeyOrLabel;
  const actions = effective.allowed[moduleKey];
  if (!actions) return false;
  return actions.has(action) || (action !== "manage" && actions.has("manage"));
}

/** Serialize for API / cache. */
export function serializeEffective(effective: EffectivePermissions) {
  const matrix: Record<string, string[]> = {};
  for (const [mod, actions] of Object.entries(effective.allowed)) {
    matrix[mod] = [...actions].sort();
  }
  return {
    fullAccess: effective.fullAccess,
    portalEnabled: effective.portalEnabled,
    roleIds: effective.roleIds,
    roleNames: effective.roleNames,
    recordScopes: effective.recordScopes,
    matrix,
    inherited: effective.inherited,
    granted: effective.granted,
    denied: effective.denied,
  };
}

export type SerializedEffective = ReturnType<typeof serializeEffective>;

export function deserializeEffective(data: SerializedEffective): EffectivePermissions {
  const allowed: Record<string, Set<string>> = {};
  for (const [mod, actions] of Object.entries(data.matrix ?? {})) {
    allowed[mod] = new Set(actions);
  }
  return {
    fullAccess: Boolean(data.fullAccess),
    portalEnabled: data.portalEnabled !== false,
    roleIds: data.roleIds ?? [],
    roleNames: data.roleNames ?? [],
    recordScopes: (data.recordScopes ?? []) as RecordScope[],
    allowed,
    inherited: data.inherited ?? [],
    granted: data.granted ?? [],
    denied: data.denied ?? [],
  };
}

/**
 * Convert effective permissions into the legacy DesignationPermissionConfig
 * shape so existing PortalActionGate / sidebar filters keep working.
 * Fine-grained modules also enable their parent nav group pages
 * (e.g. students:view → Academic + Students).
 */
export function effectiveToLegacyPages(effective: EffectivePermissions): Record<
  string,
  { enabled: boolean; actions: PermissionAction[] }
> {
  const legacyActions = new Set<PermissionAction>([
    "view",
    "create",
    "edit",
    "export",
    "delete",
    "approve",
  ]);
  const pages: Record<string, { enabled: boolean; actions: PermissionAction[] }> = {};

  if (effective.fullAccess) {
    return pages; // callers treat fullAccess separately
  }

  const mergePage = (label: string, actions: PermissionAction[]) => {
    const pageId = pageIdFromLabel(label, "web");
    const prev = pages[pageId];
    const merged = new Set<PermissionAction>([...(prev?.actions ?? []), ...actions]);
    pages[pageId] = { enabled: merged.size > 0, actions: [...merged] };
  };

  for (const [moduleKey, actionSet] of Object.entries(effective.allowed)) {
    let actions = [...actionSet].filter((a): a is PermissionAction =>
      legacyActions.has(a as PermissionAction)
    );
    if (!actions.length && actionSet.has("manage")) {
      actions = ["view", "create", "edit", "export", "delete", "approve"];
    }
    if (!actions.length && actionSet.size > 0) {
      // Non-legacy actions still imply page visibility
      actions = ["view"];
    }
    if (!actions.length) continue;

    const labels = new Set<string>([
      moduleLabelFromKey(moduleKey),
      ...navLabelsForModule(moduleKey),
    ]);
    for (const label of labels) mergePage(label, actions);
  }
  return pages;
}

export async function loadRolePermissions(
  admin: SupabaseClient<any>,
  roleIds: string[]
): Promise<PermissionPair[]> {
  if (!roleIds.length) return [];
  const { data, error } = await admin
    .from("rbac_role_permissions")
    .select("module_key, action_key")
    .in("role_id", roleIds);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    moduleKey: String(row.module_key),
    actionKey: String(row.action_key),
  }));
}

export async function loadUserOverrides(
  admin: SupabaseClient<any>,
  branchId: string,
  userId: string
): Promise<Array<PermissionPair & { effect: OverrideEffect }>> {
  const { data, error } = await admin
    .from("rbac_user_permission_overrides")
    .select("module_key, action_key, effect")
    .eq("branch_id", branchId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    moduleKey: String(row.module_key),
    actionKey: String(row.action_key),
    effect: row.effect as OverrideEffect,
  }));
}

export async function loadUserRoles(
  admin: SupabaseClient<any>,
  branchId: string,
  userId: string
): Promise<RbacRoleRow[]> {
  const { data, error } = await admin
    .from("rbac_user_roles")
    .select("role_id, rbac_roles(*)")
    .eq("branch_id", branchId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);

  const roles: RbacRoleRow[] = [];
  for (const row of data ?? []) {
    const role = row.rbac_roles as unknown as RbacRoleRow | RbacRoleRow[] | null;
    const resolved = Array.isArray(role) ? role[0] : role;
    if (resolved?.id && resolved.status !== "Inactive") roles.push(resolved);
  }
  return roles;
}

/** Find branch role by designation name (case-insensitive). */
export async function findRoleByDesignation(
  admin: SupabaseClient<any>,
  branchId: string,
  designationName: string
): Promise<RbacRoleRow | null> {
  const name = String(designationName ?? "").trim();
  if (!name) return null;

  const { data, error } = await admin
    .from("rbac_roles")
    .select("*")
    .eq("branch_id", branchId)
    .eq("status", "Active")
    .ilike("designation_name", name)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (data) return data as RbacRoleRow;

  const { data: byName } = await admin
    .from("rbac_roles")
    .select("*")
    .eq("branch_id", branchId)
    .eq("status", "Active")
    .ilike("name", name)
    .limit(1)
    .maybeSingle();
  return (byName as RbacRoleRow) ?? null;
}

/**
 * Resolve effective permissions for a user in a branch.
 * Falls back to designation → role mapping when no user_roles rows exist.
 */
export async function resolveEffectivePermissions(params: {
  admin: SupabaseClient<any>;
  branchId: string;
  userId: string;
  portalRole?: string | null;
  designation?: string | null;
}): Promise<EffectivePermissions> {
  const { admin, branchId, userId } = params;
  const portalRole = String(params.portalRole ?? "")
    .trim()
    .toLowerCase();

  if (portalRole === "super_admin" || portalRole === "admin") {
    return emptyEffective({
      fullAccess: true,
      portalEnabled: true,
      roleNames: [portalRole === "super_admin" ? "Super Admin" : "Admin"],
      recordScopes: [portalRole === "super_admin" ? "all" : "branch"],
    });
  }

  let roles = await loadUserRoles(admin, branchId, userId);

  // Evolve path: auto-bind designation role if user has no explicit assignment
  if (!roles.length && params.designation) {
    const byDes = await findRoleByDesignation(admin, branchId, params.designation);
    if (byDes) roles = [byDes];
  }

  if (!roles.length) {
    return emptyEffective({ portalEnabled: true });
  }

  const roleIds = roles.map((r) => r.id);
  const inherited = await loadRolePermissions(admin, roleIds);
  const overrides = await loadUserOverrides(admin, branchId, userId);

  const allowed: Record<string, Set<string>> = {};
  for (const pair of inherited) {
    addAllowed(allowed, pair.moduleKey, pair.actionKey);
  }

  const granted: PermissionPair[] = [];
  const denied: PermissionPair[] = [];
  for (const ov of overrides) {
    if (ov.effect === "grant") {
      granted.push({ moduleKey: ov.moduleKey, actionKey: ov.actionKey });
      addAllowed(allowed, ov.moduleKey, ov.actionKey);
    } else {
      denied.push({ moduleKey: ov.moduleKey, actionKey: ov.actionKey });
      removeAllowed(allowed, ov.moduleKey, ov.actionKey);
    }
  }

  return {
    fullAccess: false,
    portalEnabled: true,
    roleIds,
    roleNames: roles.map((r) => r.name),
    recordScopes: [...new Set(roles.map((r) => r.record_scope))],
    allowed,
    inherited,
    granted,
    denied,
  };
}

export function isValidAction(action: string): action is RbacAction {
  return (RBAC_ACTIONS as readonly string[]).includes(action);
}
