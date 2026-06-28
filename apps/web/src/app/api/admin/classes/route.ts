import { supabaseAdmin } from "@/lib/supabase/admin";
import { loadBranchClassRecords } from "@/lib/loadBranchClasses";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");
  const academicYear = url.searchParams.get("academicYear");

  if (!schoolSlug) {
    return Response.json({ error: "schoolId required" }, { status: 400 });
  }

  try {
    const classes = await loadBranchClassRecords(supabaseAdmin, schoolSlug, academicYear);
    return Response.json({ classes });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load classes";
    return Response.json({ error: message }, { status: 500 });
  }
}
