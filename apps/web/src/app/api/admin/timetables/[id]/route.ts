import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import { loadBranchTimetableById, saveBranchTimetable } from "@/lib/loadBranchTimetables";

export const GET = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  const docId = decodeURIComponent(
    new URL(req.url).pathname.split("/").filter(Boolean).at(-1) ?? ""
  );
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");

  if (!schoolSlug) {
    return noStoreJson({ error: "schoolId required" }, { status: 400 });
  }
  if (!docId) {
    return noStoreJson({ error: "timetable id required" }, { status: 400 });
  }

  try {
    const timetable = await loadBranchTimetableById(supabaseAdmin, schoolSlug, docId);
    if (!timetable) {
      return noStoreJson({ error: "Timetable not found" }, { status: 404 });
    }
    return noStoreJson({ timetable });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load timetable";
    return noStoreJson({ error: message }, { status: 500 });
  }
});

export const PATCH = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  const docId = decodeURIComponent(
    new URL(req.url).pathname.split("/").filter(Boolean).at(-1) ?? ""
  );

  try {
    const body = await req.json();
    const schoolSlug = String(body.schoolId ?? "").trim();
    if (!schoolSlug) {
      return noStoreJson({ error: "schoolId required" }, { status: 400 });
    }
    if (!docId) {
      return noStoreJson({ error: "timetable id required" }, { status: 400 });
    }

    const { schoolId: _ignored, id: _id, ...payload } = body;
    const timetable = await saveBranchTimetable(supabaseAdmin, schoolSlug, docId, payload);
    return noStoreJson({ timetable });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update timetable";
    return noStoreJson({ error: message }, { status: 500 });
  }
});
