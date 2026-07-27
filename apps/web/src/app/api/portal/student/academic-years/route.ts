import { withSupabaseRoute } from "@/lib/supabase/route-handler";
import { requirePortalUser, requireSchoolSlug } from "@/lib/portalRouteAuth";
import { listBranchAcademicYears } from "@/lib/branchAcademicYears";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";

export const GET = withSupabaseRoute("user", async (req, ctx) => {
  const user = await requirePortalUser(ctx);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const schoolSlug = requireSchoolSlug(req);
  if (!schoolSlug) return Response.json({ error: "schoolId required" }, { status: 400 });

  try {
    const branchId = await resolveBranchUuid(ctx.supabaseAdmin, schoolSlug);
    if (!branchId) {
      return Response.json({ years: [], current: null });
    }

    const years = await listBranchAcademicYears(ctx.supabaseAdmin, branchId);
    const current = years.find((year) => year.is_current)?.name ?? years[0]?.name ?? null;

    return Response.json({
      years: years.map((year) => ({
        name: year.name,
        isCurrent: year.is_current,
      })),
      current,
    });
  } catch (err) {
    console.error("portal/student/academic-years", err);
    return Response.json({ error: "Failed to load academic years" }, { status: 500 });
  }
});
