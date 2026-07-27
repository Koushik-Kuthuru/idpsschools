import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import {
  loadBranchHostelAttendance,
  saveBranchHostelAttendance,
} from "@/lib/loadBranchHostel";
import type { HostelAttendanceSession } from "@/lib/hostelStore";

export const GET = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");
  const date = url.searchParams.get("date");
  const session = (url.searchParams.get("session") ?? "morning") as HostelAttendanceSession;

  if (!schoolSlug || !date) {
    return noStoreJson({ error: "schoolId and date required" }, { status: 400 });
  }

  try {
    const attendance = await loadBranchHostelAttendance(supabaseAdmin, schoolSlug, date, session);
    return noStoreJson({
      attendance: attendance ?? { date, session, entries: [] },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load hostel attendance";
    return noStoreJson({ error: message }, { status: 500 });
  }
});

export const POST = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  try {
    const body = await req.json();
    const schoolSlug = String(body.schoolId ?? "").trim();
    const date = String(body.date ?? "").trim();
    const session = String(body.session ?? "morning").trim() as HostelAttendanceSession;
    const entries = Array.isArray(body.entries) ? body.entries : [];

    if (!schoolSlug || !date) {
      return noStoreJson({ error: "schoolId and date required" }, { status: 400 });
    }

    await saveBranchHostelAttendance(supabaseAdmin, schoolSlug, {
      date,
      session,
      entries,
    });

    return noStoreJson({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save hostel attendance";
    return noStoreJson({ error: message }, { status: 500 });
  }
});
