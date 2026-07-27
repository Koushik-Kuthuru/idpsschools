import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import { loadBranchStaffRecords } from "@/lib/loadBranchStaff";

export const GET = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");
  const kind = url.searchParams.get("kind") ?? "all";
  const academicYear = url.searchParams.get("academicYear");

  if (!schoolSlug) {
    return noStoreJson({ error: "schoolId required" }, { status: 400 });
  }

  const validKind =
    kind === "teaching" || kind === "non_teaching" || kind === "all" ? kind : "all";

  try {
    const staff = await loadBranchStaffRecords(supabaseAdmin, schoolSlug, validKind, academicYear);
    return noStoreJson({ staff });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load staff";
    return noStoreJson({ error: message }, { status: 500 });
  }
});
