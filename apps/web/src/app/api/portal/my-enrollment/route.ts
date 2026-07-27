import { withSupabaseRoute } from "@/lib/supabase/route-handler";
import { resolveStudentSessionContext } from "@/lib/auth/resolve-student-session";

export const GET = withSupabaseRoute("user", async (req, ctx) => {
  const userId = ctx.userClaims?.id;
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const schoolSlug = new URL(req.url).searchParams.get("schoolId");
  if (!schoolSlug) {
    return Response.json({ error: "schoolId required" }, { status: 400 });
  }

  try {
    const enrollment = await loadEnrollment(
      ctx,
      schoolSlug,
      userId,
      ctx.userClaims?.email ?? null
    );
    return Response.json(
      { enrollment },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    console.error("portal/my-enrollment", err);
    return Response.json({ error: "Failed to load enrollment" }, { status: 500 });
  }
});

async function loadEnrollment(
  ctx: { supabaseAdmin: import("@supabase/supabase-js").SupabaseClient<any> },
  schoolSlug: string,
  userId: string,
  email: string | null
) {
  const { getSchoolCodeFromSlug } = await import("@/lib/supabase/client");
  const code = getSchoolCodeFromSlug(schoolSlug);
  if (!code) return null;

  const [schoolResult, session] = await Promise.all([
    ctx.supabaseAdmin.from("schools").select("id").eq("code", code).maybeSingle(),
    resolveStudentSessionContext({
      admin: ctx.supabaseAdmin,
      authId: userId,
      email,
      schoolSlug,
    }),
  ]);

  const school = schoolResult.data;
  const studentId = session?.recordId;
  if (!school?.id || !studentId) return null;

  const { data: year } = await ctx.supabaseAdmin
    .from("academic_years")
    .select("id, name")
    .eq("school_id", school.id)
    .eq("is_current", true)
    .maybeSingle();

  if (!year?.id) return null;

  const { data: enrollment } = await ctx.supabaseAdmin
    .from("student_section_enrollments")
    .select("roll_number, sections ( name, grades ( name ) )")
    .eq("school_id", school.id)
    .eq("student_id", studentId)
    .eq("academic_year_id", year.id)
    .maybeSingle();

  if (!enrollment) return null;

  const sections = enrollment.sections as {
    name?: string;
    grades?: { name?: string } | { name?: string }[] | null;
  };
  const grades = sections?.grades;
  const grade = String(Array.isArray(grades) ? grades[0]?.name : grades?.name ?? "").trim();
  const section = String(sections?.name ?? "").trim();

  return {
    grade,
    section,
    className: grade && section ? `${grade}-${section}` : grade || section,
    rollNumber: String(enrollment.roll_number ?? ""),
    academicYearName: year.name,
  };
}
