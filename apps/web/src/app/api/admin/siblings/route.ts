import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";
import { loadSiblingRegistry } from "@/lib/siblingRegistry";

export const GET = withAdminRoute(async (req, ctx) => {
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");
  const academicYear = url.searchParams.get("academicYear") || "";
  if (!schoolSlug || !academicYear) {
    return noStoreJson({ error: "schoolId and academicYear required" }, { status: 400 });
  }
  const branchId = await resolveBranchUuid(ctx.admin, schoolSlug);
  if (!branchId) return noStoreJson({ error: "Branch not found" }, { status: 404 });

  const registry = await loadSiblingRegistry(ctx.admin, branchId, academicYear);
  return noStoreJson({
    academicYear,
    source: registry?.source ?? null,
    count: registry?.count ?? registry?.groups?.length ?? 0,
    groups: registry?.groups ?? [],
  });
});
