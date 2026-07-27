import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import { loadBranchTransportBuses } from "@/lib/branchTransportStore";
import { loadBranchTransportStudents } from "@/lib/loadBranchStudents";
import { aggregateTransportDrivers } from "@/lib/transportDriversUtils";

export const GET = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");
  const academicYear = url.searchParams.get("academicYear");

  if (!schoolSlug) {
    return noStoreJson({ error: "schoolId required" }, { status: 400 });
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

    return noStoreJson({ drivers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load drivers";
    return noStoreJson({ error: message }, { status: 500 });
  }
});
