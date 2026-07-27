import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import { loadBranchTimetables, saveBranchTimetable } from "@/lib/loadBranchTimetables";

export const GET = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");
  const termKey = url.searchParams.get("termKey");

  if (!schoolSlug) {
    return noStoreJson({ error: "schoolId required" }, { status: 400 });
  }

  try {
    const timetables = await loadBranchTimetables(
      supabaseAdmin,
      schoolSlug,
      termKey || undefined
    );
    return noStoreJson({ timetables });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load timetables";
    return noStoreJson({ error: message }, { status: 500 });
  }
});

export const POST = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  try {
    const body = await req.json();
    const schoolSlug = String(body.schoolId ?? "").trim();
    const docId = String(body.id ?? "").trim();

    if (!schoolSlug) {
      return noStoreJson({ error: "schoolId required" }, { status: 400 });
    }
    if (!docId) {
      return noStoreJson({ error: "id required" }, { status: 400 });
    }

    const { schoolId: _ignored, id: _id, ...payload } = body;
    const timetable = await saveBranchTimetable(supabaseAdmin, schoolSlug, docId, payload);
    return noStoreJson({ timetable });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save timetable";
    return noStoreJson({ error: message }, { status: 500 });
  }
});
