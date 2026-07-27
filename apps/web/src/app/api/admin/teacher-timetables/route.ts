import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";
import { loadTeacherTimetableRegistry } from "@/lib/teacherTimetableRegistry";

export const GET = withAdminRoute(async (req, ctx) => {
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");
  const academicYear = url.searchParams.get("academicYear") || "";
  if (!schoolSlug || !academicYear) {
    return noStoreJson({ error: "schoolId and academicYear required" }, { status: 400 });
  }
  const branchId = await resolveBranchUuid(ctx.admin, schoolSlug);
  if (!branchId) return noStoreJson({ error: "Branch not found" }, { status: 404 });

  const registry = await loadTeacherTimetableRegistry(ctx.admin, branchId, academicYear);
  return noStoreJson({
    academicYear,
    count: registry?.count ?? registry?.teachers?.length ?? 0,
    teachers: registry?.teachers ?? [],
  });
});
