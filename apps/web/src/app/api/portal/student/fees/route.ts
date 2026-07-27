import { withSupabaseRoute } from "@/lib/supabase/route-handler";
import { requirePortalUser, requireSchoolSlug } from "@/lib/portalRouteAuth";
import { buildStudentFees, loadStudentDetailForAuth } from "@/lib/portalMobileData";

export const GET = withSupabaseRoute("user", async (req, ctx) => {
  const user = await requirePortalUser(ctx);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const schoolSlug = requireSchoolSlug(req);
  if (!schoolSlug) return Response.json({ error: "schoolId required" }, { status: 400 });

  try {
    const academicYear = new URL(req.url).searchParams.get("academicYear");
    const detail = await loadStudentDetailForAuth(ctx.supabaseAdmin, {
      schoolSlug,
      authId: user.authId,
      email: user.email,
      academicYear,
    });
    if (!detail) return Response.json({ error: "Student record not found" }, { status: 404 });

    return Response.json(await buildStudentFees(detail, schoolSlug, ctx.supabaseAdmin));
  } catch (err) {
    console.error("portal/student/fees", err);
    return Response.json({ error: "Failed to load fees" }, { status: 500 });
  }
});
