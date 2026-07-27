import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import { loadBranchMessAttendance, saveBranchMessAttendance } from "@/lib/loadBranchMess";
import type { MessMealType } from "@/lib/messStore";

export const GET = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");
  const date = url.searchParams.get("date");
  const meal = (url.searchParams.get("meal") ?? "lunch") as MessMealType;

  if (!schoolSlug || !date) {
    return noStoreJson({ error: "schoolId and date required" }, { status: 400 });
  }

  try {
    const attendance = await loadBranchMessAttendance(supabaseAdmin, schoolSlug, date, meal);
    return noStoreJson({
      attendance: attendance ?? { date, meal, entries: [] },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load attendance";
    return noStoreJson({ error: message }, { status: 500 });
  }
});

export const POST = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  try {
    const body = await req.json();
    const schoolSlug = String(body.schoolId ?? "").trim();
    const date = String(body.date ?? "").trim();
    const meal = String(body.meal ?? "lunch").trim() as MessMealType;
    const entries = Array.isArray(body.entries) ? body.entries : [];

    if (!schoolSlug || !date) {
      return noStoreJson({ error: "schoolId and date required" }, { status: 400 });
    }

    await saveBranchMessAttendance(supabaseAdmin, schoolSlug, { date, meal, entries });
    return noStoreJson({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save attendance";
    return noStoreJson({ error: message }, { status: 500 });
  }
});
