import { supabaseAdmin } from "@/lib/supabase/admin";
import { loadBranchClasses, loadBranchStudents } from "@/lib/loadBranchStudents";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");
  const academicYear = url.searchParams.get("academicYear");

  if (!schoolSlug) {
    return Response.json({ error: "schoolId required" }, { status: 400 });
  }

  try {
    const [students, classes] = await Promise.all([
      loadBranchStudents(supabaseAdmin, schoolSlug, academicYear),
      loadBranchClasses(supabaseAdmin, schoolSlug, academicYear),
    ]);

    return Response.json({ students, classes });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load students";
    return Response.json({ error: message }, { status: 500 });
  }
}
