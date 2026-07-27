import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";
import { requestAuditMeta, writeRbacAuditLog } from "@/lib/rbac/audit";
import { denyUnlessPermission, invalidateRbacCache } from "@/lib/rbac/requirePermission";
import { ensureBranchRbacRoles } from "@/lib/rbac/seed";
import { slugifyRoleKey, RBAC_ACTIONS } from "@/lib/rbac/catalog";
import { isValidAction } from "@/lib/rbac/resolve";

function assertAdminOrPerm(
  denied: Response | null,
  role: string | null
): Response | null {
  if (!denied) return null;
  if (role === "admin" || role === "super_admin") return null;
  return denied;
}

export const GET = withAdminRoute(async (req, ctx) => {
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId")?.trim();
  if (!schoolSlug) return noStoreJson({ error: "schoolId required" }, { status: 400 });

  const branchId = await resolveBranchUuid(ctx.admin, schoolSlug);
  if (!branchId) return noStoreJson({ error: "School branch not found" }, { status: 404 });

  const { count } = await ctx.admin
    .from("rbac_roles")
    .select("id", { count: "exact", head: true })
    .eq("branch_id", branchId);
  if (!count) await ensureBranchRbacRoles(ctx.admin, branchId);

  const roleId = url.searchParams.get("roleId")?.trim();

  if (roleId) {
    const { data: role, error } = await ctx.admin
      .from("rbac_roles")
      .select("*")
      .eq("id", roleId)
      .eq("branch_id", branchId)
      .maybeSingle();
    if (error) return noStoreJson({ error: error.message }, { status: 500 });
    if (!role) return noStoreJson({ error: "Role not found" }, { status: 404 });

    const { data: perms } = await ctx.admin
      .from("rbac_role_permissions")
      .select("module_key, action_key")
      .eq("role_id", roleId);

    const matrix: Record<string, string[]> = {};
    for (const row of perms ?? []) {
      const mod = String(row.module_key);
      if (!matrix[mod]) matrix[mod] = [];
      matrix[mod].push(String(row.action_key));
    }
    return noStoreJson({ role, matrix });
  }

  const { data: roles, error } = await ctx.admin
    .from("rbac_roles")
    .select("*")
    .eq("branch_id", branchId)
    .order("name");
  if (error) return noStoreJson({ error: error.message }, { status: 500 });

  return noStoreJson({ roles: roles ?? [] });
});

export const POST = withAdminRoute(async (req, ctx) => {
  const body = await req.json().catch(() => ({}));
  const schoolSlug = String(body.schoolId ?? "").trim();
  if (!schoolSlug) return noStoreJson({ error: "schoolId required" }, { status: 400 });

  const denied = assertAdminOrPerm(
    await denyUnlessPermission({
      admin: ctx.admin,
      user: ctx.user,
      schoolSlug,
      module: "role_management",
      action: "create",
    }),
    ctx.user.role
  );
  if (denied) return denied;

  const branchId = await resolveBranchUuid(ctx.admin, schoolSlug);
  if (!branchId) return noStoreJson({ error: "School branch not found" }, { status: 404 });

  const action = String(body.action ?? "create").trim();

  // Duplicate role
  if (action === "duplicate") {
    const sourceId = String(body.roleId ?? "").trim();
    const newName = String(body.name ?? "").trim();
    if (!sourceId || !newName) {
      return noStoreJson({ error: "roleId and name required" }, { status: 400 });
    }
    const { data: source } = await ctx.admin
      .from("rbac_roles")
      .select("*")
      .eq("id", sourceId)
      .eq("branch_id", branchId)
      .maybeSingle();
    if (!source) return noStoreJson({ error: "Source role not found" }, { status: 404 });

    const key = slugifyRoleKey(newName) || `role_${Date.now()}`;
    const { data: created, error } = await ctx.admin
      .from("rbac_roles")
      .insert({
        branch_id: branchId,
        key: `${key}_${Date.now().toString(36)}`,
        name: newName,
        description: source.description,
        is_system: false,
        is_custom: true,
        designation_name: newName,
        portal_role: source.portal_role,
        record_scope: source.record_scope,
        status: "Active",
      })
      .select("*")
      .single();
    if (error) return noStoreJson({ error: error.message }, { status: 500 });

    const { data: perms } = await ctx.admin
      .from("rbac_role_permissions")
      .select("module_key, action_key")
      .eq("role_id", sourceId);
    if (perms?.length) {
      await ctx.admin.from("rbac_role_permissions").insert(
        perms.map((p) => ({
          role_id: created.id,
          module_key: p.module_key,
          action_key: p.action_key,
        }))
      );
    }

    const meta = requestAuditMeta(req);
    await writeRbacAuditLog(ctx.admin, {
      branchId,
      actorUserId: ctx.user.authId,
      targetRoleId: created.id,
      eventType: "role_duplicated",
      oldValue: { sourceId },
      newValue: created,
      ...meta,
    });
    invalidateRbacCache(branchId);
    return noStoreJson({ role: created });
  }

  // Save permission matrix for a role
  if (action === "set_permissions") {
    const roleId = String(body.roleId ?? "").trim();
    const matrix = (body.matrix ?? {}) as Record<string, string[]>;
    if (!roleId) return noStoreJson({ error: "roleId required" }, { status: 400 });

    const { data: role } = await ctx.admin
      .from("rbac_roles")
      .select("id, is_system, name")
      .eq("id", roleId)
      .eq("branch_id", branchId)
      .maybeSingle();
    if (!role) return noStoreJson({ error: "Role not found" }, { status: 404 });

    const { data: oldPerms } = await ctx.admin
      .from("rbac_role_permissions")
      .select("module_key, action_key")
      .eq("role_id", roleId);

    await ctx.admin.from("rbac_role_permissions").delete().eq("role_id", roleId);

    const rows: Array<{ role_id: string; module_key: string; action_key: string }> = [];
    for (const [moduleKey, actions] of Object.entries(matrix)) {
      for (const actionKey of actions ?? []) {
        if (!isValidAction(actionKey) && !(RBAC_ACTIONS as readonly string[]).includes(actionKey)) {
          continue;
        }
        rows.push({ role_id: roleId, module_key: moduleKey, action_key: actionKey });
      }
    }
    if (rows.length) {
      const { error } = await ctx.admin.from("rbac_role_permissions").insert(rows);
      if (error) return noStoreJson({ error: error.message }, { status: 500 });
    }

    const meta = requestAuditMeta(req);
    await writeRbacAuditLog(ctx.admin, {
      branchId,
      actorUserId: ctx.user.authId,
      targetRoleId: roleId,
      eventType: "role_permissions_updated",
      oldValue: oldPerms,
      newValue: rows,
      ...meta,
    });
    invalidateRbacCache(branchId);
    return noStoreJson({ ok: true, count: rows.length });
  }

  // Create role
  const name = String(body.name ?? "").trim();
  if (!name) return noStoreJson({ error: "name required" }, { status: 400 });
  const key = String(body.key ?? slugifyRoleKey(name)).trim() || slugifyRoleKey(name);

  const { data: created, error } = await ctx.admin
    .from("rbac_roles")
    .insert({
      branch_id: branchId,
      key,
      name,
      description: String(body.description ?? "").trim() || null,
      is_system: false,
      is_custom: true,
      designation_name: String(body.designationName ?? name).trim() || name,
      portal_role: String(body.portalRole ?? "staff").trim() || "staff",
      record_scope: String(body.recordScope ?? "branch").trim() || "branch",
      status: "Active",
    })
    .select("*")
    .single();
  if (error) return noStoreJson({ error: error.message }, { status: 500 });

  const meta = requestAuditMeta(req);
  await writeRbacAuditLog(ctx.admin, {
    branchId,
    actorUserId: ctx.user.authId,
    targetRoleId: created.id,
    eventType: "role_created",
    newValue: created,
    ...meta,
  });
  invalidateRbacCache(branchId);
  return noStoreJson({ role: created });
});

export const DELETE = withAdminRoute(async (req, ctx) => {
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId")?.trim();
  const roleId = url.searchParams.get("roleId")?.trim();
  if (!schoolSlug || !roleId) {
    return noStoreJson({ error: "schoolId and roleId required" }, { status: 400 });
  }

  const denied = assertAdminOrPerm(
    await denyUnlessPermission({
      admin: ctx.admin,
      user: ctx.user,
      schoolSlug,
      module: "role_management",
      action: "delete",
    }),
    ctx.user.role
  );
  if (denied) return denied;

  const branchId = await resolveBranchUuid(ctx.admin, schoolSlug);
  if (!branchId) return noStoreJson({ error: "School branch not found" }, { status: 404 });

  const { data: role } = await ctx.admin
    .from("rbac_roles")
    .select("*")
    .eq("id", roleId)
    .eq("branch_id", branchId)
    .maybeSingle();
  if (!role) return noStoreJson({ error: "Role not found" }, { status: 404 });
  if (role.is_system) {
    return noStoreJson({ error: "System roles cannot be deleted" }, { status: 400 });
  }

  const { error } = await ctx.admin.from("rbac_roles").delete().eq("id", roleId);
  if (error) return noStoreJson({ error: error.message }, { status: 500 });

  const meta = requestAuditMeta(req);
  await writeRbacAuditLog(ctx.admin, {
    branchId,
    actorUserId: ctx.user.authId,
    targetRoleId: roleId,
    eventType: "role_deleted",
    oldValue: role,
    ...meta,
  });
  invalidateRbacCache(branchId);
  return noStoreJson({ ok: true });
});
