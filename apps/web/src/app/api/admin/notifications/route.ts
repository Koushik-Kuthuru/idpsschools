import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";

const PREFIX = "__admin_notification__:";

export const GET = withAdminRoute(async (req, ctx) => {
  const schoolSlug = new URL(req.url).searchParams.get("schoolId")?.trim();
  if (!schoolSlug) {
    return noStoreJson({ error: "schoolId required" }, { status: 400 });
  }
  if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
    return noStoreJson({ error: "Forbidden" }, { status: 403 });
  }

  const branchId = await resolveBranchUuid(ctx.admin, schoolSlug);
  if (!branchId) {
    return noStoreJson({ error: "School branch not found" }, { status: 404 });
  }

  const { data: branch } = await ctx.admin
    .from("branches")
    .select("school_id")
    .eq("id", branchId)
    .maybeSingle();

  if (
    ctx.user.role !== "super_admin" &&
    ctx.user.schoolId &&
    branch?.school_id &&
    ctx.user.schoolId !== String(branch.school_id)
  ) {
    return noStoreJson({ error: "Forbidden" }, { status: 403 });
  }

  // Prefer title range over LIKE+target scan — notices table is large and the
  // old filter was statement-timing-out under load (browser: Failed to fetch).
  const titleEnd = `${PREFIX}\uffff`;
  const { data, error } = await ctx.admin
    .from("notices")
    .select("id, title, content, created_at")
    .eq("branch_id", branchId)
    .gte("title", PREFIX)
    .lt("title", titleEnd)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return noStoreJson({ error: error.message }, { status: 500 });
  }

  const notifications = (data ?? []).flatMap((row) => {
    try {
      const content = JSON.parse(String(row.content ?? "{}")) as Record<string, unknown>;
      return [{
        id: String(row.id),
        category: String(content.category ?? "System"),
        title: String(row.title ?? "").slice(PREFIX.length) || "New notification",
        body: String(content.description ?? ""),
        createdAt: String(content.createdAt ?? row.created_at ?? new Date().toISOString()),
        href: String(content.href ?? `/schools/${schoolSlug}/admin/notifications`),
      }];
    } catch {
      return [];
    }
  });

  return noStoreJson({ notifications });
});
