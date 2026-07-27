import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import {
  loadBranchTimetableTemplate,
  saveBranchTimetableTemplate,
} from "@/lib/loadBranchTimetables";

export const GET = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");

  if (!schoolSlug) {
    return noStoreJson({ error: "schoolId required" }, { status: 400 });
  }

  try {
    const template = await loadBranchTimetableTemplate(supabaseAdmin, schoolSlug);
    return noStoreJson({ template });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load timetable template";
    return noStoreJson({ error: message }, { status: 500 });
  }
});

export const POST = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  try {
    const body = await req.json();
    const schoolSlug = String(body.schoolId ?? "").trim();
    if (!schoolSlug) {
      return noStoreJson({ error: "schoolId required" }, { status: 400 });
    }

    const { schoolId: _ignored, ...payload } = body;
    const template = await saveBranchTimetableTemplate(supabaseAdmin, schoolSlug, payload);
    return noStoreJson({ template });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save timetable template";
    return noStoreJson({ error: message }, { status: 500 });
  }
});
