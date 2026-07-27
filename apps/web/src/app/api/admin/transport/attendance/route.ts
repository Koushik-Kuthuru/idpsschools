import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import {
  getTransportAttendanceForDate,
  getTransportAttendanceForMonth,
  loadBranchTransportAttendance,
  saveTransportAttendanceForDate,
} from "@/lib/branchTransportAttendanceStore";

export const GET = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");
  const academicYear = url.searchParams.get("academicYear");
  const date = url.searchParams.get("date");
  const month = url.searchParams.get("month");

  if (!schoolSlug || !academicYear) {
    return noStoreJson({ error: "schoolId and academicYear required" }, { status: 400 });
  }

  try {
    if (date) {
      const marks = await getTransportAttendanceForDate(supabaseAdmin, schoolSlug, academicYear, date);
      return noStoreJson({ date, marks });
    }

    if (month) {
      const marks = await getTransportAttendanceForMonth(supabaseAdmin, schoolSlug, academicYear, month);
      return noStoreJson({ month, marks });
    }

    const store = await loadBranchTransportAttendance(supabaseAdmin, schoolSlug, academicYear);
    return noStoreJson({ store });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load transport attendance";
    return noStoreJson({ error: message }, { status: 500 });
  }
});

export const POST = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  try {
    const body = await req.json();
    const schoolSlug = String(body.schoolId ?? "").trim();
    const academicYear = String(body.academicYear ?? "").trim();
    const date = String(body.date ?? "").trim();
    const marks = body.marks as Record<string, { status?: string; remarks?: string }> | undefined;

    if (!schoolSlug || !academicYear || !date || !marks) {
      return noStoreJson({ error: "schoolId, academicYear, date, and marks required" }, { status: 400 });
    }

    const normalized: Record<string, { status: "P" | "A" | "HD" | "None"; remarks?: string }> = {};
    for (const [studentId, mark] of Object.entries(marks)) {
      const status = String(mark?.status ?? "None");
      normalized[studentId] = {
        status: status === "P" || status === "A" || status === "HD" ? status : "None",
        remarks: mark?.remarks?.trim() || undefined,
      };
    }

    const saved = await saveTransportAttendanceForDate(
      supabaseAdmin,
      schoolSlug,
      academicYear,
      date,
      normalized
    );

    return noStoreJson({ date, marks: saved });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save transport attendance";
    return noStoreJson({ error: message }, { status: 500 });
  }
});
