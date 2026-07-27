import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import { loadBranchHostelStudents } from "@/lib/loadBranchHostel";

export const GET = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");
  const academicYear = url.searchParams.get("academicYear");

  if (!schoolSlug) {
    return noStoreJson({ error: "schoolId required" }, { status: 400 });
  }

  try {
    const students = await loadBranchHostelStudents(supabaseAdmin, schoolSlug, academicYear);
    return noStoreJson({ students });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load hostel students";
    return noStoreJson({ error: message }, { status: 500 });
  }
});
