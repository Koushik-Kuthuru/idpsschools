import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import {
  loadBranchPortalPermissionsFromServer,
  saveBranchPortalPermissionsToServer,
} from "@/lib/portalPermissionsPersistence";
import type { BranchPortalPermissions } from "@/lib/portalPermissionsStore";
import { denyUnlessPermission } from "@/lib/rbac/requirePermission";

export const GET = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");

  if (!schoolSlug) {
    return noStoreJson({ error: "schoolId required" }, { status: 400 });
  }

  try {
    const permissions = await loadBranchPortalPermissionsFromServer(supabaseAdmin, schoolSlug);
    return noStoreJson({ permissions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load portal permissions";
    return noStoreJson({ error: message }, { status: 500 });
  }
});

export const POST = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  try {
    const body = await req.json();
    const schoolSlug = String(body.schoolId ?? "").trim();
    const permissions = body.permissions as BranchPortalPermissions | undefined;

    if (!schoolSlug) {
      return noStoreJson({ error: "schoolId required" }, { status: 400 });
    }

    if (!permissions || typeof permissions !== "object") {
      return noStoreJson({ error: "permissions object required" }, { status: 400 });
    }

    const isAdmin = ctx.user.role === "admin" || ctx.user.role === "super_admin";
    if (!isAdmin) {
      const denied = await denyUnlessPermission({
        admin: supabaseAdmin,
        user: ctx.user,
        schoolSlug,
        module: "permissions",
        action: "manage",
      });
      if (denied) return denied;
    }

    await saveBranchPortalPermissionsToServer(supabaseAdmin, schoolSlug, permissions);
    return noStoreJson({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save portal permissions";
    return noStoreJson({ error: message }, { status: 500 });
  }
});
