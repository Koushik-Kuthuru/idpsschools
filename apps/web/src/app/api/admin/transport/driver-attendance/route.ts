import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getTransportDriverAttendanceForDate,
  getTransportDriverAttendanceForMonth,
  loadBranchTransportDriverAttendance,
  saveTransportDriverAttendanceForDate,
} from "@/lib/branchTransportDriverAttendanceStore";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");
  const academicYear = url.searchParams.get("academicYear");
  const date = url.searchParams.get("date");
  const month = url.searchParams.get("month");

  if (!schoolSlug || !academicYear) {
    return Response.json({ error: "schoolId and academicYear required" }, { status: 400 });
  }

  try {
    if (date) {
      const marks = await getTransportDriverAttendanceForDate(supabaseAdmin, schoolSlug, academicYear, date);
      return Response.json({ date, marks });
    }

    if (month) {
      const marks = await getTransportDriverAttendanceForMonth(supabaseAdmin, schoolSlug, academicYear, month);
      return Response.json({ month, marks });
    }

    const store = await loadBranchTransportDriverAttendance(supabaseAdmin, schoolSlug, academicYear);
    return Response.json({ store });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load driver attendance";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const schoolSlug = String(body.schoolId ?? "").trim();
    const academicYear = String(body.academicYear ?? "").trim();
    const date = String(body.date ?? "").trim();
    const marks = body.marks as Record<string, { status?: string; remarks?: string }> | undefined;

    if (!schoolSlug || !academicYear || !date || !marks) {
      return Response.json({ error: "schoolId, academicYear, date, and marks required" }, { status: 400 });
    }

    const normalized: Record<string, { status: "P" | "A" | "HD" | "None"; remarks?: string }> = {};
    for (const [driverId, mark] of Object.entries(marks)) {
      const status = String(mark?.status ?? "None");
      normalized[driverId] = {
        status: status === "P" || status === "A" || status === "HD" ? status : "None",
        remarks: mark?.remarks?.trim() || undefined,
      };
    }

    const saved = await saveTransportDriverAttendanceForDate(
      supabaseAdmin,
      schoolSlug,
      academicYear,
      date,
      normalized
    );

    return Response.json({ date, marks: saved });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save driver attendance";
    return Response.json({ error: message }, { status: 500 });
  }
}
