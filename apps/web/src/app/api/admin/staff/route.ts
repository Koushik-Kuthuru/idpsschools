import { supabaseAdmin } from "@/lib/supabase/admin";
import { loadBranchStaffRecords } from "@/lib/loadBranchStaff";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");
  const kind = url.searchParams.get("kind") ?? "all";
  const academicYear = url.searchParams.get("academicYear");

  if (!schoolSlug) {
    return Response.json({ error: "schoolId required" }, { status: 400 });
  }

  const validKind =
    kind === "teaching" || kind === "non_teaching" || kind === "all" ? kind : "all";

  try {
    const staff = await loadBranchStaffRecords(supabaseAdmin, schoolSlug, validKind, academicYear);
    return Response.json({ staff });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load staff";
    return Response.json({ error: message }, { status: 500 });
  }
}
