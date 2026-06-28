import { withSupabaseRoute } from "@/lib/supabase/route-handler";
import { getSchoolSlugFromCode } from "@/lib/supabase/client";

export const GET = withSupabaseRoute("user", async (_req, ctx) => {
  const authId = ctx.userClaims?.id;
  if (!authId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = ctx.userClaims?.email ?? null;

  const { data: profile, error: profileError } = await ctx.supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", authId)
    .maybeSingle();

  if (profileError) {
    return Response.json({ error: profileError.message }, { status: 500 });
  }

  let schoolSlug: string | null = null;
  if (profile?.school_id) {
    const { data: school } = await ctx.supabaseAdmin
      .from("schools")
      .select("code")
      .eq("id", profile.school_id)
      .single();
    schoolSlug = school?.code ? getSchoolSlugFromCode(school.code) : null;
  }

  const baseUser = {
    uid: authId,
    email: email || profile?.email || null,
    displayName: profile?.full_name || null,
    photoURL: profile?.avatar_url || null,
    phone: profile?.phone || undefined,
  };

  let enrollment: Awaited<ReturnType<typeof loadEnrollment>> = null;
  if (profile?.role === "student" && schoolSlug) {
    enrollment = await loadEnrollment(ctx, schoolSlug, authId);
  }

  let staff: { designation?: string; department?: string } | null = null;
  if (profile?.role === "teacher" && profile?.school_id) {
    const { data } = await ctx.supabaseAdmin
      .from("staff_profiles")
      .select("designation, department")
      .eq("user_id", authId)
      .eq("school_id", profile.school_id)
      .maybeSingle();
    staff = data;
  }

  return Response.json({
    user: {
      ...baseUser,
      ...(enrollment ?? {}),
      designation: staff?.designation,
      department: staff?.department,
    },
    role: profile?.role ?? null,
    schoolId: schoolSlug,
  });
});

async function loadEnrollment(
  ctx: { supabaseAdmin: import("@supabase/supabase-js").SupabaseClient<any> },
  schoolSlug: string,
  userId: string
) {
  const { getSchoolCodeFromSlug } = await import("@/lib/supabase/client");
  const code = getSchoolCodeFromSlug(schoolSlug);
  if (!code) return null;

  const { data: school } = await ctx.supabaseAdmin.from("schools").select("id").eq("code", code).single();
  if (!school?.id) return null;

  const { data: year } = await ctx.supabaseAdmin
    .from("academic_years")
    .select("id, name")
    .eq("school_id", school.id)
    .eq("is_current", true)
    .maybeSingle();

  const { data: student } = await ctx.supabaseAdmin
    .from("students")
    .select("id")
    .eq("school_id", school.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!student?.id || !year?.id) return null;

  const { data: row } = await ctx.supabaseAdmin
    .from("student_section_enrollments")
    .select("roll_number, sections ( name, grades ( name ) )")
    .eq("school_id", school.id)
    .eq("student_id", student.id)
    .eq("academic_year_id", year.id)
    .maybeSingle();

  if (!row) return null;

  const sections = row.sections as { name?: string; grades?: { name?: string } | { name?: string }[] | null };
  const grades = sections?.grades;
  const grade = String(Array.isArray(grades) ? grades[0]?.name : grades?.name ?? "").trim();
  const section = String(sections?.name ?? "").trim();

  return {
    grade,
    section,
    className: grade && section ? `${grade}-${section}` : grade || section,
    rollNumber: String(row.roll_number ?? ""),
    academicYearName: year.name,
  };
}
