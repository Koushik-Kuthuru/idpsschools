import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import { loadBranchFeePaidUnpaid } from "@/lib/feePaidUnpaidRegistry";
import { denyUnlessPermission } from "@/lib/rbac/requirePermission";

export const GET = withAdminRoute(async (req, ctx) => {
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");
  const academicYear = url.searchParams.get("academicYear");

  if (!schoolSlug) {
    return noStoreJson({ error: "schoolId required" }, { status: 400 });
  }

  const isAdmin = ctx.user.role === "admin" || ctx.user.role === "super_admin";
  if (!isAdmin) {
    const denied = await denyUnlessPermission({
      admin: ctx.admin,
      user: ctx.user,
      schoolSlug,
      module: "fees",
      action: "view",
    });
    if (denied) return denied;
  }

  try {
    const payload = await loadBranchFeePaidUnpaid(ctx.admin, schoolSlug, academicYear);
    return noStoreJson(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load fee paid/unpaid";
    return noStoreJson({ error: message }, { status: 500 });
  }
});
