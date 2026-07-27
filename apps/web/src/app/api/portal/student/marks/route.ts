import { withSupabaseRoute } from "@/lib/supabase/route-handler";
import { requirePortalUser, requireSchoolSlug } from "@/lib/portalRouteAuth";
import { buildStudentMarks, loadStudentDetailForAuth } from "@/lib/portalMobileData";

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

    const marks = await buildStudentMarks(detail, ctx.supabaseAdmin, schoolSlug);
    const url = new URL(req.url);
    const subjectId = url.searchParams.get("subjectId");
    if (subjectId) {
      const overviewSubject = marks.overview.subjects.find((row) => row.id === subjectId);
      const raw = marks.subjects.find((row) => row.id === subjectId);
      if (overviewSubject) {
        return Response.json({ subject: overviewSubject });
      }
      if (raw) {
        return Response.json({
          subject: {
            id: raw.id,
            subject: raw.name,
            score: raw.marks,
            maxScore: raw.maxMarks,
            grade: raw.grade,
            icon: "book",
          },
        });
      }
      return Response.json({ subject: null });
    }
    if (url.pathname.endsWith("/performance")) {
      return Response.json({
        labels: marks.subjects.map((row) => row.name),
        barData: marks.subjects.map((row) => row.marks),
        lineData: marks.subjects.map((row) => Math.round((row.marks / row.maxMarks) * 100)),
      });
    }

    return Response.json(marks);
  } catch (err) {
    console.error("portal/student/marks", err);
    return Response.json({ error: "Failed to load marks" }, { status: 500 });
  }
});
