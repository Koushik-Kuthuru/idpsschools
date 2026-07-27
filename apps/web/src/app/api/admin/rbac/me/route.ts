import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";
import { requestAuditMeta, writeRbacAuditLog } from "@/lib/rbac/audit";
import {
  denyUnlessPermission,
  getCachedEffectivePermissions,
  invalidateRbacCache,
  loadUserDesignation,
  serializeEffective,
} from "@/lib/rbac/requirePermission";
import { ensureBranchRbacRoles, ensureDesignationRole } from "@/lib/rbac/seed";
import { matchRoleTemplate, RBAC_ACTIONS, RBAC_MODULES } from "@/lib/rbac/catalog";
import { loadUserRoles } from "@/lib/rbac/resolve";

/** GET catalog + current user's effective permissions. Also seeds roles on first access. */
export const GET = withAdminRoute(async (req, ctx) => {
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId")?.trim();
  if (!schoolSlug) return noStoreJson({ error: "schoolId required" }, { status: 400 });

  const branchId = await resolveBranchUuid(ctx.admin, schoolSlug);
  if (!branchId) return noStoreJson({ error: "School branch not found" }, { status: 404 });

  // Ensure defaults exist (idempotent)
  const { count } = await ctx.admin
    .from("rbac_roles")
    .select("id", { count: "exact", head: true })
    .eq("branch_id", branchId);
  if (!count) {
    await ensureBranchRbacRoles(ctx.admin, branchId);
  }

  let designation = await loadUserDesignation(ctx.admin, ctx.user.authId, branchId);

  // Auto-bind designation → role for this user so sidebar pages follow Roles & Permissions
  const isAdmin = ctx.user.role === "admin" || ctx.user.role === "super_admin";
  if (!isAdmin && designation) {
    let roles = await loadUserRoles(ctx.admin, branchId, ctx.user.authId);
    if (!roles.length) {
      const template = matchRoleTemplate(designation);
      const roleId = await ensureDesignationRole(
        ctx.admin,
        branchId,
        designation,
        template?.key
      );
      await ctx.admin.from("rbac_user_roles").upsert(
        {
          branch_id: branchId,
          user_id: ctx.user.authId,
          role_id: roleId,
          scopes: {},
          updated_at: new Date().toISOString(),
        },
        { onConflict: "branch_id,user_id,role_id" }
      );
      invalidateRbacCache(branchId, ctx.user.authId);
    }
  }

  const effective = await getCachedEffectivePermissions({
    admin: ctx.admin,
    branchId,
    userId: ctx.user.authId,
    portalRole: ctx.user.role,
    designation,
  });

  return noStoreJson({
    modules: RBAC_MODULES,
    actions: RBAC_ACTIONS.map((key) => ({ key, name: key })),
    effective: serializeEffective(effective),
    designation,
  });
});

/** POST bootstrap/seed roles for a branch (admin only). */
export const POST = withAdminRoute(async (req, ctx) => {
  const body = await req.json().catch(() => ({}));
  const schoolSlug = String(body.schoolId ?? "").trim();
  if (!schoolSlug) return noStoreJson({ error: "schoolId required" }, { status: 400 });

  const forbidden = await denyUnlessPermission({
    admin: ctx.admin,
    user: ctx.user,
    schoolSlug,
    module: "role_management",
    action: "manage",
  });
  // Allow admin/super_admin even before roles are seeded
  const isAdmin = ctx.user.role === "admin" || ctx.user.role === "super_admin";
  if (forbidden && !isAdmin) return forbidden;

  const branchId = await resolveBranchUuid(ctx.admin, schoolSlug);
  if (!branchId) return noStoreJson({ error: "School branch not found" }, { status: 404 });

  const result = await ensureBranchRbacRoles(ctx.admin, branchId);

  // Also ensure roles for existing HR designations
  const { data: designations } = await ctx.admin
    .from("designations")
    .select("name")
    .eq("branch_id", branchId);
  let designationRoles = 0;
  for (const d of designations ?? []) {
    const name = String(d.name ?? "").trim();
    if (!name) continue;
    const template = matchRoleTemplate(name);
    await ensureDesignationRole(ctx.admin, branchId, name, template?.key);
    designationRoles += 1;
  }

  invalidateRbacCache(branchId);
  const meta = requestAuditMeta(req);
  await writeRbacAuditLog(ctx.admin, {
    branchId,
    actorUserId: ctx.user.authId,
    eventType: "roles_seeded",
    newValue: { ...result, designationRoles },
    ...meta,
  });

  return noStoreJson({ ok: true, ...result, designationRoles });
});
