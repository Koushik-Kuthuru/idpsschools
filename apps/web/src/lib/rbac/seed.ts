/**
 * Seed default roles + permissions for a branch.
 * Safe to re-run: upserts system roles and refreshes their default permissions.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_ROLE_TEMPLATES, slugifyRoleKey } from "@/lib/rbac/catalog";

export async function ensureBranchRbacRoles(
  admin: SupabaseClient<any>,
  branchId: string
): Promise<{ rolesCreated: number; rolesUpdated: number; permissionsSet: number }> {
  let rolesCreated = 0;
  let rolesUpdated = 0;
  let permissionsSet = 0;

  for (const template of DEFAULT_ROLE_TEMPLATES) {
    const { data: existing } = await admin
      .from("rbac_roles")
      .select("id")
      .eq("branch_id", branchId)
      .eq("key", template.key)
      .maybeSingle();

    let roleId = existing?.id as string | undefined;

    if (!roleId) {
      const { data: inserted, error } = await admin
        .from("rbac_roles")
        .insert({
          branch_id: branchId,
          key: template.key,
          name: template.name,
          description: template.description,
          is_system: true,
          is_custom: false,
          designation_name: template.name,
          portal_role: template.portalRole,
          record_scope: template.recordScope,
          status: "Active",
          updated_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      roleId = inserted.id;
      rolesCreated += 1;
    } else {
      const { error } = await admin
        .from("rbac_roles")
        .update({
          name: template.name,
          description: template.description,
          is_system: true,
          is_custom: false,
          designation_name: template.name,
          portal_role: template.portalRole,
          record_scope: template.recordScope,
          status: "Active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", roleId);
      if (error) throw new Error(error.message);
      rolesUpdated += 1;
    }

    // Replace default permissions for system roles
    const { error: delError } = await admin.from("rbac_role_permissions").delete().eq("role_id", roleId);
    if (delError) throw new Error(delError.message);

    const rows: Array<{ role_id: string; module_key: string; action_key: string }> = [];
    for (const [moduleKey, actions] of Object.entries(template.permissions)) {
      for (const action of actions) {
        rows.push({ role_id: roleId, module_key: moduleKey, action_key: action });
      }
    }
    if (rows.length) {
      const { error: insError } = await admin.from("rbac_role_permissions").insert(rows);
      if (insError) throw new Error(insError.message);
      permissionsSet += rows.length;
    }
  }

  return { rolesCreated, rolesUpdated, permissionsSet };
}

/** Ensure a custom role exists for an HR designation name. */
export async function ensureDesignationRole(
  admin: SupabaseClient<any>,
  branchId: string,
  designationName: string,
  templateKey?: string
): Promise<string> {
  const name = String(designationName ?? "").trim();
  if (!name) throw new Error("Designation name required");

  const { data: existing } = await admin
    .from("rbac_roles")
    .select("id")
    .eq("branch_id", branchId)
    .ilike("designation_name", name)
    .maybeSingle();
  if (existing?.id) return String(existing.id);

  const template =
    DEFAULT_ROLE_TEMPLATES.find((t) => t.key === templateKey) ??
    DEFAULT_ROLE_TEMPLATES.find((t) => t.name.toLowerCase() === name.toLowerCase());

  const keyBase = slugifyRoleKey(name) || `role_${Date.now()}`;
  let key = keyBase;
  for (let i = 0; i < 5; i += 1) {
    const { data: clash } = await admin
      .from("rbac_roles")
      .select("id")
      .eq("branch_id", branchId)
      .eq("key", key)
      .maybeSingle();
    if (!clash) break;
    key = `${keyBase}_${i + 2}`;
  }

  const { data: inserted, error } = await admin
    .from("rbac_roles")
    .insert({
      branch_id: branchId,
      key,
      name,
      description: template?.description ?? `Permissions for ${name}`,
      is_system: false,
      is_custom: true,
      designation_name: name,
      portal_role: template?.portalRole ?? "staff",
      record_scope: template?.recordScope ?? "branch",
      status: "Active",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  if (template) {
    const rows = Object.entries(template.permissions).flatMap(([moduleKey, actions]) =>
      actions.map((action) => ({
        role_id: inserted.id,
        module_key: moduleKey,
        action_key: action,
      }))
    );
    if (rows.length) {
      await admin.from("rbac_role_permissions").insert(rows);
    }
  }

  return String(inserted.id);
}
