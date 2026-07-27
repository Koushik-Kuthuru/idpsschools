import { withSupabaseRoute } from "@/lib/supabase/route-handler";
import { loadBranchStudents } from "@/lib/loadBranchStudents";
import {
  filterStudentsByStaffScope,
  resolveStaffDataScope,
} from "@/lib/resolveStaffDataScope";

export const GET = withSupabaseRoute("user", async (req, ctx) => {
  const userId = ctx.userClaims?.id;
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");
  const academicYear = url.searchParams.get("academicYear");

  if (!schoolSlug) {
    return Response.json({ error: "schoolId required" }, { status: 400 });
  }

  try {
    const { data: profile } = await ctx.supabaseAdmin
      .from("users")
      .select("role, email")
      .eq("id", userId)
      .maybeSingle();

    const scope = await resolveStaffDataScope(ctx.supabaseAdmin, {
      schoolSlug,
      authId: userId,
      email: profile?.email ?? null,
      role: profile?.role ?? null,
    });

    const rows = await loadBranchStudents(ctx.supabaseAdmin, schoolSlug, academicYear);
    const students = rows.map((row) => ({
      id: row.id,
      name: row.name,
      grade: row.className,
      section: row.section,
      className: row.className && row.section ? `${row.className}-${row.section}` : row.className || row.section,
      classId: row.className,
      roll: row.roll,
      admissionNo: row.admissionNo,
      status: row.status,
      email: null as string | null,
    }));

    return Response.json({
      students: filterStudentsByStaffScope(students, scope),
      scopeMode: scope.mode,
    });
  } catch (err) {
    console.error("portal/students", err);
    return Response.json({ error: "Failed to load students" }, { status: 500 });
  }
});
