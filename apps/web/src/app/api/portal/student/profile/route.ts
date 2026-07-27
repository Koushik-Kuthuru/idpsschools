import { withSupabaseRoute } from "@/lib/supabase/route-handler";
import { requirePortalUser, requireSchoolSlug } from "@/lib/portalRouteAuth";
import { loadStudentDetailForAuth, mapStudentProfileUser } from "@/lib/portalMobileData";
import { loadBranchTransportBuses } from "@/lib/branchTransportStore";
import { getBranchCurrentAcademicYearName } from "@/lib/branchAcademicYears";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";

export const GET = withSupabaseRoute("user", async (req, ctx) => {
  const user = await requirePortalUser(ctx);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const schoolSlug = requireSchoolSlug(req);
  if (!schoolSlug) return Response.json({ error: "schoolId required" }, { status: 400 });

  try {
    const academicYear = new URL(req.url).searchParams.get("academicYear");
    const [detail, fleetBuses] = await Promise.all([
      loadStudentDetailForAuth(ctx.supabaseAdmin, {
        schoolSlug,
        authId: user.authId,
        email: user.email,
        academicYear,
      }),
      loadBranchTransportBuses(ctx.supabaseAdmin, schoolSlug),
    ]);
    if (!detail) return Response.json({ error: "Student record not found" }, { status: 404 });

    const profile = mapStudentProfileUser(detail, schoolSlug, fleetBuses);
    if (!profile.academicYear) {
      const branchId = await resolveBranchUuid(ctx.supabaseAdmin, schoolSlug);
      const currentYear = branchId
        ? await getBranchCurrentAcademicYearName(ctx.supabaseAdmin, branchId)
        : null;
      if (currentYear) profile.academicYear = currentYear;
    }

    return Response.json({ profile });
  } catch (err) {
    console.error("portal/student/profile", err);
    return Response.json({ error: "Failed to load profile" }, { status: 500 });
  }
});
