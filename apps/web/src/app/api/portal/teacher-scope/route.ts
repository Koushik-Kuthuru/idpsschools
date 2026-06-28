import { withSupabaseRoute } from "@/lib/supabase/route-handler";
import { getSchoolCodeFromSlug } from "@/lib/supabase/client";
import { classScopeKey } from "@/lib/teacherClassScope";

export const GET = withSupabaseRoute("user", async (req, ctx) => {
  const userId = ctx.userClaims?.id;
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const schoolSlug = new URL(req.url).searchParams.get("schoolId");
  if (!schoolSlug) {
    return Response.json({ error: "schoolId required" }, { status: 400 });
  }

  const { data: profile } = await ctx.supabaseAdmin.from("users").select("role").eq("id", userId).maybeSingle();
  if (profile?.role === "super_admin") {
    return Response.json({ classKeys: [], isUnrestricted: true });
  }

  const code = getSchoolCodeFromSlug(schoolSlug);
  if (!code) return Response.json({ classKeys: [], isUnrestricted: false });

  const { data: school } = await ctx.supabaseAdmin.from("schools").select("id").eq("code", code).single();
  if (!school?.id) return Response.json({ classKeys: [], isUnrestricted: false });

  const { data: year } = await ctx.supabaseAdmin
    .from("academic_years")
    .select("id")
    .eq("school_id", school.id)
    .eq("is_current", true)
    .maybeSingle();

  const keys = new Set<string>();

  let homeroomQuery = ctx.supabaseAdmin
    .from("sections")
    .select("name, grades(name)")
    .eq("school_id", school.id)
    .eq("class_teacher_id", userId);
  if (year?.id) homeroomQuery = homeroomQuery.eq("academic_year_id", year.id);
  const { data: homeroom } = await homeroomQuery;
  homeroom?.forEach((row) => addKey(keys, row));

  let assignQuery = ctx.supabaseAdmin
    .from("teacher_subject_assignments")
    .select("sections(name, grades(name))")
    .eq("school_id", school.id)
    .eq("teacher_id", userId);
  if (year?.id) assignQuery = assignQuery.eq("academic_year_id", year.id);
  const { data: assignments } = await assignQuery;
  assignments?.forEach((row) => {
    const section = row.sections as { name?: string; grades?: { name?: string } | { name?: string }[] | null } | null;
    addKey(keys, section);
  });

  return Response.json({ classKeys: Array.from(keys), isUnrestricted: false });
});

function addKey(keys: Set<string>, section: { name?: string | null; grades?: { name?: string | null } | { name?: string | null }[] | null } | null) {
  if (!section) return;
  const grades = section.grades;
  const grade = Array.isArray(grades) ? grades[0]?.name : grades?.name;
  const sectionName = section.name;
  if (grade && sectionName) keys.add(classScopeKey(String(grade), String(sectionName)));
}
