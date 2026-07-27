import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import { loadBranchMicroSchedules, saveBranchMicroSchedule } from "@/lib/loadBranchMicroSchedules";

export const GET = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");
  const termKey = url.searchParams.get("termKey");

  if (!schoolSlug) {
    return noStoreJson({ error: "schoolId required" }, { status: 400 });
  }

  try {
    const schedules = await loadBranchMicroSchedules(supabaseAdmin, schoolSlug, termKey || undefined);
    return noStoreJson({ schedules });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load micro schedules";
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
    const schedule = await saveBranchMicroSchedule(supabaseAdmin, schoolSlug, payload);
    return noStoreJson({ schedule });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save micro schedule";
    return noStoreJson({ error: message }, { status: 500 });
  }
});
