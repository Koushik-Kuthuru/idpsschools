import { withSupabaseRoute } from "@/lib/supabase/route-handler";
import { requirePortalUser, requireSchoolSlug } from "@/lib/portalRouteAuth";
import {
  buildStudentDashboard,
  loadBranchAnnouncements,
  loadHomeworkForSchool,
  loadStudentDetailForAuth,
} from "@/lib/portalMobileData";
import { classScopeKey } from "@/lib/teacherClassScope";

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

    const grade = String(detail.grade ?? detail.classId ?? "");
    const section = String(detail.section ?? "");
    const studentClassKey = grade && section ? classScopeKey(grade, section) : "";

    const [homework, announcements] = await Promise.all([
      loadHomeworkForSchool(ctx.supabaseAdmin, schoolSlug, { grade, section }),
      loadBranchAnnouncements(ctx.supabaseAdmin, schoolSlug, { limit: 50 }),
    ]);

    const visibleAnnouncementCount = announcements.filter((row) => {
      const target = String(row.target ?? "all").trim().toLowerCase();
      const isClassScoped = Boolean(row.classKey) || target.startsWith("class:");
      if (isClassScoped) {
        return Boolean(studentClassKey) && (row.classKey === studentClassKey || target === `class:${studentClassKey}`);
      }
      return target === "all" || target === "students" || target === "";
    }).length;

    return Response.json({
      dashboard: await buildStudentDashboard(detail, homework.length, schoolSlug, ctx.supabaseAdmin, {
        announcementCount: visibleAnnouncementCount,
      }),
    });
  } catch (err) {
    console.error("portal/student/dashboard", err);
    return Response.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
});
