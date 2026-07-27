import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";
import { denyUnlessPermission } from "@/lib/rbac/requirePermission";

export const GET = withAdminRoute(async (req, ctx) => {
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId")?.trim();
  if (!schoolSlug) return noStoreJson({ error: "schoolId required" }, { status: 400 });

  const isAdmin = ctx.user.role === "admin" || ctx.user.role === "super_admin";
  if (!isAdmin) {
    const denied = await denyUnlessPermission({
      admin: ctx.admin,
      user: ctx.user,
      schoolSlug,
      module: "audit_logs",
      action: "view",
    });
    if (denied) return denied;
  }

  const branchId = await resolveBranchUuid(ctx.admin, schoolSlug);
  if (!branchId) return noStoreJson({ error: "School branch not found" }, { status: 404 });

  const limit = Math.min(Number(url.searchParams.get("limit") ?? 100) || 100, 500);
  const { data, error } = await ctx.admin
    .from("rbac_audit_logs")
    .select("*")
    .eq("branch_id", branchId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return noStoreJson({ error: error.message }, { status: 500 });
  return noStoreJson({ logs: data ?? [] });
});
