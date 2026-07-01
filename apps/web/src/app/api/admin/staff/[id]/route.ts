import { supabaseAdmin } from "@/lib/supabase/admin";
import { loadBranchStaffRecordById } from "@/lib/loadBranchStaff";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: staffId } = await context.params;
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");
  const academicYear = url.searchParams.get("academicYear");
  const kindParam = url.searchParams.get("kind");

  if (!schoolSlug || !staffId) {
    return Response.json({ error: "schoolId and staff id required" }, { status: 400 });
  }

  const kind =
    kindParam === "teaching" || kindParam === "non_teaching" ? kindParam : undefined;

  try {
    const detail = await loadBranchStaffRecordById(supabaseAdmin, schoolSlug, staffId, {
      academicYearName: academicYear,
      kind,
    });

    if (!detail) {
      return Response.json({ error: "Staff member not found" }, { status: 404 });
    }

    return Response.json(detail);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load staff member";
    return Response.json({ error: message }, { status: 500 });
  }
}
