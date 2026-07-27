import type { SupabaseClient } from "@supabase/supabase-js";

export const HOSTEL_ATTENDANCE_PREFIX = "__hostel_attendance__:";
export const HOSTEL_VISITOR_PREFIX = "__hostel_visitor__:";
export const HOSTEL_ROOM_PREFIX = "__hostel_room__:";

export type HostelAttendanceStatus = "present" | "absent" | "leave" | "late";
export type HostelAttendanceSession = "morning" | "night" | "leave_out";

export type HostelAttendanceEntry = {
  studentId: string;
  status: HostelAttendanceStatus;
  note?: string;
};

export type HostelAttendanceDoc = {
  date: string;
  session: HostelAttendanceSession;
  entries: HostelAttendanceEntry[];
  updatedAt?: string;
};

export type HostelVisitorDoc = {
  visitorName: string;
  relation: string;
  visitorPhone: string;
  studentId: string;
  studentName: string;
  className: string;
  section: string;
  parentName: string;
  parentPhone: string;
  purpose: string;
  checkIn: string;
  checkOut: string;
  status: "inside" | "left";
  updatedAt?: string;
};

export type HostelRoomDoc = {
  block: string;
  roomNo: string;
  floor: string;
  capacity: number;
  roomType: string;
  status: "active" | "maintenance";
  notes: string;
  updatedAt?: string;
};

function keyPart(v: string) {
  return encodeURIComponent(String(v || "").trim()).replace(/%/g, "_");
}

function parseJson<T>(content: unknown): T | null {
  if (!content) return null;
  try {
    const parsed = JSON.parse(String(content));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as T;
  } catch {
    return null;
  }
}

export function hostelAttendanceDocId(date: string, session: HostelAttendanceSession) {
  return `${keyPart(date)}__${keyPart(session)}`;
}

export function hostelAttendanceTitle(docId: string) {
  return `${HOSTEL_ATTENDANCE_PREFIX}${docId}`;
}

export function hostelVisitorTitle(docId: string) {
  return `${HOSTEL_VISITOR_PREFIX}${docId}`;
}

async function upsertNotice(
  client: SupabaseClient<any>,
  branchId: string,
  title: string,
  payload: Record<string, unknown>
) {
  const content = JSON.stringify({ ...payload, updatedAt: new Date().toISOString() });
  const { data: existing, error: loadError } = await client
    .from("notices")
    .select("id")
    .eq("branch_id", branchId)
    .eq("title", title)
    .maybeSingle();

  if (loadError) throw new Error(loadError.message);

  if (existing?.id) {
    const { error } = await client.from("notices").update({ content }).eq("id", existing.id);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await client.from("notices").insert({
    branch_id: branchId,
    title,
    content,
    target: "system",
    posted_on: new Date().toISOString().slice(0, 10),
  });
  if (error) throw new Error(error.message);
}

export async function loadHostelAttendance(
  client: SupabaseClient<any>,
  branchId: string,
  date: string,
  session: HostelAttendanceSession
): Promise<HostelAttendanceDoc | null> {
  const docId = hostelAttendanceDocId(date, session);
  const { data, error } = await client
    .from("notices")
    .select("content")
    .eq("branch_id", branchId)
    .eq("title", hostelAttendanceTitle(docId))
    .maybeSingle();

  if (error || !data?.content) return null;
  const parsed = parseJson<HostelAttendanceDoc>(data.content);
  if (!parsed) return null;
  return {
    date,
    session,
    entries: Array.isArray(parsed.entries) ? parsed.entries : [],
    updatedAt: parsed.updatedAt,
  };
}

export async function saveHostelAttendance(
  client: SupabaseClient<any>,
  branchId: string,
  payload: HostelAttendanceDoc
): Promise<void> {
  const docId = hostelAttendanceDocId(payload.date, payload.session);
  await upsertNotice(client, branchId, hostelAttendanceTitle(docId), payload);
}

export async function loadHostelVisitors(
  client: SupabaseClient<any>,
  branchId: string
): Promise<Array<{ id: string } & HostelVisitorDoc>> {
  const { data, error } = await client
    .from("notices")
    .select("title, content")
    .eq("branch_id", branchId)
    .like("title", `${HOSTEL_VISITOR_PREFIX}%`)
    .order("posted_on", { ascending: false });

  if (error || !data) return [];

  const rows: Array<{ id: string } & HostelVisitorDoc> = [];
  for (const row of data) {
    const title = String(row.title ?? "");
    if (!title.startsWith(HOSTEL_VISITOR_PREFIX)) continue;
    const id = title.slice(HOSTEL_VISITOR_PREFIX.length);
    const parsed = parseJson<HostelVisitorDoc>(row.content);
    if (!parsed?.visitorName) continue;
    rows.push({ id, ...parsed });
  }

  return rows.sort((a, b) => String(b.checkIn).localeCompare(String(a.checkIn)));
}

export async function saveHostelVisitor(
  client: SupabaseClient<any>,
  branchId: string,
  docId: string,
  payload: HostelVisitorDoc
): Promise<void> {
  await upsertNotice(client, branchId, hostelVisitorTitle(docId), payload);
}

export async function deleteHostelVisitor(
  client: SupabaseClient<any>,
  branchId: string,
  docId: string
): Promise<void> {
  const { data, error: loadError } = await client
    .from("notices")
    .select("id")
    .eq("branch_id", branchId)
    .eq("title", hostelVisitorTitle(docId))
    .maybeSingle();

  if (loadError) throw new Error(loadError.message);
  if (!data?.id) return;

  const { error } = await client.from("notices").delete().eq("id", data.id);
  if (error) throw new Error(error.message);
}

export function hostelRoomDocId(block: string, roomNo: string) {
  return `room__${keyPart(block)}__${keyPart(roomNo)}`;
}

export function hostelRoomTitle(docId: string) {
  return `${HOSTEL_ROOM_PREFIX}${docId}`;
}

export async function loadHostelRooms(
  client: SupabaseClient<any>,
  branchId: string
): Promise<Array<{ id: string } & HostelRoomDoc>> {
  const { data, error } = await client
    .from("notices")
    .select("title, content")
    .eq("branch_id", branchId)
    .like("title", `${HOSTEL_ROOM_PREFIX}%`);

  if (error || !data) return [];

  const rows: Array<{ id: string } & HostelRoomDoc> = [];
  for (const row of data) {
    const title = String(row.title ?? "");
    if (!title.startsWith(HOSTEL_ROOM_PREFIX)) continue;
    const id = title.slice(HOSTEL_ROOM_PREFIX.length);
    const parsed = parseJson<HostelRoomDoc>(row.content);
    if (!parsed?.roomNo) continue;
    rows.push({
      id,
      block: String(parsed.block ?? "").trim() || "Main",
      roomNo: String(parsed.roomNo ?? "").trim(),
      floor: String(parsed.floor ?? "").trim(),
      capacity: Number(parsed.capacity) || 0,
      roomType: String(parsed.roomType ?? "Standard").trim() || "Standard",
      status: parsed.status === "maintenance" ? "maintenance" : "active",
      notes: String(parsed.notes ?? "").trim(),
      updatedAt: parsed.updatedAt,
    });
  }

  return rows.sort((a, b) =>
    `${a.block}-${a.roomNo}`.localeCompare(`${b.block}-${b.roomNo}`, undefined, {
      numeric: true,
      sensitivity: "base",
    })
  );
}

export async function saveHostelRoom(
  client: SupabaseClient<any>,
  branchId: string,
  docId: string,
  payload: HostelRoomDoc
): Promise<void> {
  await upsertNotice(client, branchId, hostelRoomTitle(docId), payload);
}

export async function deleteHostelRoom(
  client: SupabaseClient<any>,
  branchId: string,
  docId: string
): Promise<void> {
  const { data, error: loadError } = await client
    .from("notices")
    .select("id")
    .eq("branch_id", branchId)
    .eq("title", hostelRoomTitle(docId))
    .maybeSingle();

  if (loadError) throw new Error(loadError.message);
  if (!data?.id) return;

  const { error } = await client.from("notices").delete().eq("id", data.id);
  if (error) throw new Error(error.message);
}
