import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";
import { requestAuditMeta, writeRbacAuditLog } from "@/lib/rbac/audit";
import {
  denyUnlessPermission,
  getCachedEffectivePermissions,
  invalidateRbacCache,
  serializeEffective,
} from "@/lib/rbac/requirePermission";
import { findRoleByDesignation, loadUserOverrides, loadUserRoles } from "@/lib/rbac/resolve";
import { isValidAction } from "@/lib/rbac/resolve";
import { matchRoleTemplate } from "@/lib/rbac/catalog";
import { ensureDesignationRole } from "@/lib/rbac/seed";
import { resolvePortalStaffUser } from "@/lib/rbac/resolvePortalUser";

function assertAdminOrPerm(denied: Response | null, role: string | null): Response | null {
  if (!denied) return null;
  if (role === "admin" || role === "super_admin") return null;
  return denied;
}

/** GET staff effective + inherited + overrides */
export const GET = withAdminRoute(async (req, ctx) => {
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId")?.trim();
  const userIdParam = url.searchParams.get("userId")?.trim() || "";
  const authUid = url.searchParams.get("authUid")?.trim() || "";
  const email = url.searchParams.get("email")?.trim().toLowerCase() || "";
  const employeeId = url.searchParams.get("employeeId")?.trim() || "";
  const designationHint = url.searchParams.get("designation")?.trim() || "";
  const academicYear = url.searchParams.get("academicYear")?.trim() || "";

  if (!schoolSlug || (!userIdParam && !authUid && !email && !employeeId)) {
    return noStoreJson(
      { error: "schoolId and userId, authUid, employeeId, or email required" },
      { status: 400 }
    );
  }

  const branchId = await resolveBranchUuid(ctx.admin, schoolSlug);
  if (!branchId) return noStoreJson({ error: "School branch not found" }, { status: 404 });

  const resolved = await resolvePortalStaffUser({
    admin: ctx.admin,
    branchId,
    userId: userIdParam,
    authUid,
    employeeId,
    email,
    designation: designationHint,
    academicYear: academicYear || null,
  });

  if (!resolved) {
    return noStoreJson(
      {
        error: "No portal user linked",
        code: "NO_PORTAL_USER",
        message:
          "This staff member has no portal login yet. Open Portal Users (or re-save the staff form with login enabled) to create access, then set personal permissions here.",
        designation: designationHint || null,
      },
      { status: 404 }
    );
  }

  const userId = resolved.userId;
  const designation = resolved.designation || designationHint || null;
  let roles = await loadUserRoles(ctx.admin, branchId, userId);

  // Auto-link designation role for display if missing
  if (!roles.length && designation) {
    const template = matchRoleTemplate(designation);
    const roleId = await ensureDesignationRole(ctx.admin, branchId, designation, template?.key);
    const { data: role } = await ctx.admin.from("rbac_roles").select("*").eq("id", roleId).maybeSingle();
    if (role) roles = [role as never];
  }

  const overrides = await loadUserOverrides(ctx.admin, branchId, userId);
  const effective = await getCachedEffectivePermissions({
    admin: ctx.admin,
    branchId,
    userId,
    portalRole: resolved.portalRole,
    designation,
  });

  return noStoreJson({
    user: {
      id: userId,
      email: resolved.email,
      full_name: resolved.fullName,
      role: resolved.portalRole,
    },
    designation,
    employeeId: resolved.employeeId,
    roles,
    overrides,
    effective: serializeEffective(effective),
  });
});

/** POST assign role / set overrides for a staff user */
export const POST = withAdminRoute(async (req, ctx) => {
  const body = await req.json().catch(() => ({}));
  const schoolSlug = String(body.schoolId ?? "").trim();
  const userId = String(body.userId ?? "").trim();
  const action = String(body.action ?? "").trim();
  if (!schoolSlug || !userId) {
    return noStoreJson({ error: "schoolId and userId required" }, { status: 400 });
  }

  const denied = assertAdminOrPerm(
    await denyUnlessPermission({
      admin: ctx.admin,
      user: ctx.user,
      schoolSlug,
      module: "permissions",
      action: "manage",
    }),
    ctx.user.role
  );
  if (denied) return denied;

  const branchId = await resolveBranchUuid(ctx.admin, schoolSlug);
  if (!branchId) return noStoreJson({ error: "School branch not found" }, { status: 404 });

  const meta = requestAuditMeta(req);

  if (action === "assign_role") {
    const roleId = String(body.roleId ?? "").trim();
    if (!roleId) return noStoreJson({ error: "roleId required" }, { status: 400 });

    // Replace existing role assignments with the selected role (single primary role UX)
    await ctx.admin.from("rbac_user_roles").delete().eq("branch_id", branchId).eq("user_id", userId);
    const { error } = await ctx.admin.from("rbac_user_roles").insert({
      branch_id: branchId,
      user_id: userId,
      role_id: roleId,
      scopes: body.scopes ?? {},
    });
    if (error) return noStoreJson({ error: error.message }, { status: 500 });

    await writeRbacAuditLog(ctx.admin, {
      branchId,
      actorUserId: ctx.user.authId,
      targetUserId: userId,
      targetRoleId: roleId,
      eventType: "user_role_assigned",
      newValue: { roleId, scopes: body.scopes ?? {} },
      ...meta,
    });
    invalidateRbacCache(branchId, userId);
    return noStoreJson({ ok: true });
  }

  if (action === "set_override") {
    const moduleKey = String(body.moduleKey ?? "").trim();
    const actionKey = String(body.actionKey ?? "").trim();
    const effect = String(body.effect ?? "").trim(); // grant | deny | clear
    if (!moduleKey || !actionKey) {
      return noStoreJson({ error: "moduleKey and actionKey required" }, { status: 400 });
    }
    if (!isValidAction(actionKey)) {
      return noStoreJson({ error: "Invalid action" }, { status: 400 });
    }

    const { data: existing } = await ctx.admin
      .from("rbac_user_permission_overrides")
      .select("*")
      .eq("branch_id", branchId)
      .eq("user_id", userId)
      .eq("module_key", moduleKey)
      .eq("action_key", actionKey)
      .maybeSingle();

    if (effect === "clear") {
      if (existing?.id) {
        await ctx.admin.from("rbac_user_permission_overrides").delete().eq("id", existing.id);
      }
      await writeRbacAuditLog(ctx.admin, {
        branchId,
        actorUserId: ctx.user.authId,
        targetUserId: userId,
        eventType: "user_override_cleared",
        oldValue: existing,
        newValue: { moduleKey, actionKey },
        ...meta,
      });
    } else if (effect === "grant" || effect === "deny") {
      if (existing?.id) {
        await ctx.admin
          .from("rbac_user_permission_overrides")
          .update({
            effect,
            reason: body.reason ?? null,
            created_by: ctx.user.authId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await ctx.admin.from("rbac_user_permission_overrides").insert({
          branch_id: branchId,
          user_id: userId,
          module_key: moduleKey,
          action_key: actionKey,
          effect,
          reason: body.reason ?? null,
          created_by: ctx.user.authId,
        });
      }
      await writeRbacAuditLog(ctx.admin, {
        branchId,
        actorUserId: ctx.user.authId,
        targetUserId: userId,
        eventType: "user_override_set",
        oldValue: existing,
        newValue: { moduleKey, actionKey, effect },
        ...meta,
      });
    } else {
      return noStoreJson({ error: "effect must be grant, deny, or clear" }, { status: 400 });
    }

    invalidateRbacCache(branchId, userId);
    const resolved = await resolvePortalStaffUser({
      admin: ctx.admin,
      branchId,
      userId,
      designation: body.designation ? String(body.designation) : null,
    });
    const effective = await getCachedEffectivePermissions({
      admin: ctx.admin,
      branchId,
      userId,
      portalRole: resolved?.portalRole ?? null,
      designation: resolved?.designation ?? (body.designation ? String(body.designation) : null),
    });
    return noStoreJson({ ok: true, effective: serializeEffective(effective) });
  }

  if (action === "set_overrides_bulk") {
    const overrides = Array.isArray(body.overrides) ? body.overrides : [];
    // Replace all overrides
    await ctx.admin
      .from("rbac_user_permission_overrides")
      .delete()
      .eq("branch_id", branchId)
      .eq("user_id", userId);

    const rows = overrides
      .map((ov: { moduleKey?: string; actionKey?: string; effect?: string }) => ({
        branch_id: branchId,
        user_id: userId,
        module_key: String(ov.moduleKey ?? "").trim(),
        action_key: String(ov.actionKey ?? "").trim(),
        effect: ov.effect === "deny" ? "deny" : "grant",
        created_by: ctx.user.authId,
      }))
      .filter((r) => r.module_key && r.action_key && isValidAction(r.action_key));

    if (rows.length) {
      const { error } = await ctx.admin.from("rbac_user_permission_overrides").insert(rows);
      if (error) return noStoreJson({ error: error.message }, { status: 500 });
    }

    await writeRbacAuditLog(ctx.admin, {
      branchId,
      actorUserId: ctx.user.authId,
      targetUserId: userId,
      eventType: "user_overrides_bulk_set",
      newValue: rows,
      ...meta,
    });
    invalidateRbacCache(branchId, userId);
    return noStoreJson({ ok: true, count: rows.length });
  }

  // Bind by designation name
  if (action === "bind_designation_role") {
    const designation = String(body.designation ?? "").trim();
    if (!designation) return noStoreJson({ error: "designation required" }, { status: 400 });
    const template = matchRoleTemplate(designation);
    const roleId = await ensureDesignationRole(ctx.admin, branchId, designation, template?.key);
    await ctx.admin.from("rbac_user_roles").delete().eq("branch_id", branchId).eq("user_id", userId);
    await ctx.admin.from("rbac_user_roles").insert({
      branch_id: branchId,
      user_id: userId,
      role_id: roleId,
      scopes: {},
    });
    invalidateRbacCache(branchId, userId);
    return noStoreJson({ ok: true, roleId });
  }

  void findRoleByDesignation;
  return noStoreJson({ error: "Unknown action" }, { status: 400 });
});
