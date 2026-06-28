import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";
import type { AttendanceMarkStatus } from "@/utils/attendance";
import type { TransportAttendanceMark } from "@/lib/transportAttendanceUtils";

export type { TransportAttendanceMark };

export const BRANCH_TRANSPORT_ATTENDANCE_PREFIX = "__branch_transport_attendance__:";

export type BranchTransportAttendanceData = {
  byDate: Record<string, Record<string, TransportAttendanceMark>>;
  updatedAt?: string;
};

function noticeTitle(academicYear: string) {
  return `${BRANCH_TRANSPORT_ATTENDANCE_PREFIX}${academicYear}`;
}

function normalizeStore(raw: unknown): BranchTransportAttendanceData {
  if (!raw || typeof raw !== "object") return { byDate: {} };
  const obj = raw as Record<string, unknown>;
  const byDate: BranchTransportAttendanceData["byDate"] = {};

  if (obj.byDate && typeof obj.byDate === "object") {
    for (const [date, marks] of Object.entries(obj.byDate as Record<string, unknown>)) {
      if (!marks || typeof marks !== "object") continue;
      byDate[date] = {};
      for (const [studentId, mark] of Object.entries(marks as Record<string, unknown>)) {
        const item = mark as Record<string, unknown>;
        const status = String(item.status ?? "None") as AttendanceMarkStatus;
        byDate[date][studentId] = {
          status: status === "P" || status === "A" || status === "HD" ? status : "None",
          remarks: String(item.remarks ?? "").trim() || undefined,
        };
      }
    }
  }

  return { byDate, updatedAt: String(obj.updatedAt ?? "") || undefined };
}

async function loadStore(
  admin: SupabaseClient<any>,
  branchId: string,
  academicYear: string
): Promise<BranchTransportAttendanceData> {
  const { data, error } = await admin
    .from("notices")
    .select("content")
    .eq("branch_id", branchId)
    .eq("title", noticeTitle(academicYear))
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data?.content) return { byDate: {} };

  try {
    return normalizeStore(JSON.parse(String(data.content)));
  } catch {
    return { byDate: {} };
  }
}

async function saveStore(
  admin: SupabaseClient<any>,
  branchId: string,
  academicYear: string,
  store: BranchTransportAttendanceData
): Promise<void> {
  const payload: BranchTransportAttendanceData = {
    byDate: store.byDate,
    updatedAt: new Date().toISOString(),
  };
  const title = noticeTitle(academicYear);

  const { data: existing, error: readError } = await admin
    .from("notices")
    .select("id")
    .eq("branch_id", branchId)
    .eq("title", title)
    .maybeSingle();

  if (readError) throw new Error(readError.message);

  if (existing?.id) {
    const { error } = await admin
      .from("notices")
      .update({ content: JSON.stringify(payload) })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await admin.from("notices").insert({
    branch_id: branchId,
    title,
    content: JSON.stringify(payload),
    target: "system",
    posted_on: new Date().toISOString().slice(0, 10),
  });
  if (error) throw new Error(error.message);
}

export async function loadBranchTransportAttendance(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  academicYear: string
): Promise<BranchTransportAttendanceData> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId || !academicYear) return { byDate: {} };
  return loadStore(admin, branchId, academicYear);
}

export async function getTransportAttendanceForDate(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  academicYear: string,
  date: string
): Promise<Record<string, TransportAttendanceMark>> {
  const store = await loadBranchTransportAttendance(admin, schoolSlug, academicYear);
  return store.byDate[date] ?? {};
}

export async function getTransportAttendanceForMonth(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  academicYear: string,
  monthKey: string
): Promise<Record<string, Record<string, TransportAttendanceMark>>> {
  const store = await loadBranchTransportAttendance(admin, schoolSlug, academicYear);
  const prefix = `${monthKey}-`;
  const result: Record<string, Record<string, TransportAttendanceMark>> = {};
  for (const [date, marks] of Object.entries(store.byDate)) {
    if (date.startsWith(prefix)) result[date] = marks;
  }
  return result;
}

export async function saveTransportAttendanceForDate(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  academicYear: string,
  date: string,
  marks: Record<string, TransportAttendanceMark>
): Promise<Record<string, TransportAttendanceMark>> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) throw new Error("Branch not found");

  const store = await loadStore(admin, branchId, academicYear);
  const nextMarks: Record<string, TransportAttendanceMark> = { ...(store.byDate[date] ?? {}) };

  for (const [studentId, mark] of Object.entries(marks)) {
    if (!mark || mark.status === "None") {
      delete nextMarks[studentId];
      continue;
    }
    nextMarks[studentId] = {
      status: mark.status,
      remarks: mark.remarks?.trim() || undefined,
    };
  }

  store.byDate[date] = nextMarks;
  await saveStore(admin, branchId, academicYear, store);
  return nextMarks;
}
