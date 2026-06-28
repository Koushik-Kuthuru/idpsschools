import { supabaseAdmin } from "@/lib/supabase/admin";
import { loadBranchTransportBuses } from "@/lib/branchTransportStore";
import { loadBranchTransportStudents } from "@/lib/loadBranchStudents";
import { aggregateTransportDrivers } from "@/lib/transportDriversUtils";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");
  const academicYear = url.searchParams.get("academicYear");

  if (!schoolSlug) {
    return Response.json({ error: "schoolId required" }, { status: 400 });
  }

  try {
    const [students, buses] = await Promise.all([
      loadBranchTransportStudents(supabaseAdmin, schoolSlug, academicYear),
      loadBranchTransportBuses(supabaseAdmin, schoolSlug),
    ]);

    const drivers = aggregateTransportDrivers(
      students.filter((s) => s.usesTransport),
      buses
    );

    return Response.json({ drivers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load drivers";
    return Response.json({ error: message }, { status: 500 });
  }
}
