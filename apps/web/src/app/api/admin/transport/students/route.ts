import { supabaseAdmin } from "@/lib/supabase/admin";
import { loadBranchTransportStudents } from "@/lib/loadBranchStudents";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");
  const academicYear = url.searchParams.get("academicYear");

  if (!schoolSlug) {
    return Response.json({ error: "schoolId required" }, { status: 400 });
  }

  try {
    const students = await loadBranchTransportStudents(supabaseAdmin, schoolSlug, academicYear);
    return Response.json({ students });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load transport students";
    return Response.json({ error: message }, { status: 500 });
  }
}
