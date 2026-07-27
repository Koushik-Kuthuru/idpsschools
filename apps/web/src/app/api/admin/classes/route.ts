import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import { loadBranchClassRecords } from "@/lib/loadBranchClasses";

export const GET = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");
  const academicYear = url.searchParams.get("academicYear");

  if (!schoolSlug) {
    return noStoreJson({ error: "schoolId required" }, { status: 400 });
  }

  try {
    const classes = await loadBranchClassRecords(supabaseAdmin, schoolSlug, academicYear);
    return noStoreJson({ classes });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load classes";
    const status = /branch not found/i.test(message) ? 404 : 500;
    return noStoreJson({ error: message }, { status });
  }
});
