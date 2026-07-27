import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import { loadBranchStaffRecordById } from "@/lib/loadBranchStaff";

export const GET = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  const staffId = decodeURIComponent(
    new URL(req.url).pathname.split("/").filter(Boolean).at(-1) ?? ""
  );
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");
  const academicYear = url.searchParams.get("academicYear");
  const kindParam = url.searchParams.get("kind");

  if (!schoolSlug || !staffId) {
    return noStoreJson({ error: "schoolId and staff id required" }, { status: 400 });
  }

  const kind =
    kindParam === "teaching" || kindParam === "non_teaching" ? kindParam : undefined;

  try {
    const detail = await loadBranchStaffRecordById(supabaseAdmin, schoolSlug, staffId, {
      academicYearName: academicYear,
      kind,
    });

    if (!detail) {
      return noStoreJson({ error: "Staff member not found" }, { status: 404 });
    }

    return noStoreJson(detail);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load staff member";
    return noStoreJson({ error: message }, { status: 500 });
  }
});
