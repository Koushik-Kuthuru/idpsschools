import { withSupabaseRoute } from "@/lib/supabase/route-handler";
import { loadBranchStudents } from "@/lib/loadBranchStudents";

export const GET = withSupabaseRoute("user", async (req, ctx) => {
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");
  const academicYear = url.searchParams.get("academicYear");

  if (!schoolSlug) {
    return Response.json({ error: "schoolId required" }, { status: 400 });
  }

  try {
    const rows = await loadBranchStudents(ctx.supabaseAdmin, schoolSlug, academicYear);
    const students = rows.map((row) => ({
      id: row.id,
      name: row.name,
      grade: row.className,
      section: row.section,
      className: row.className && row.section ? `${row.className}-${row.section}` : row.className || row.section,
      roll: row.roll,
      admissionNo: row.admissionNo,
      status: row.status,
      email: null as string | null,
    }));
    return Response.json({ students });
  } catch (err) {
    console.error("portal/students", err);
    return Response.json({ error: "Failed to load students" }, { status: 500 });
  }
});
