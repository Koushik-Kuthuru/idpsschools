import type { SupabaseClient } from "@supabase/supabase-js";

export const MICRO_SCHEDULE_NOTICE_PREFIX = "__micro_schedule__:";

export type MicroScheduleRow = {
  date: string;
  day: string;
  periods: number | null;
  board: string;
  topics: string;
  activity: string;
};

export type MicroScheduleDocData = {
  teacherName?: string;
  mobile?: string;
  grade?: string;
  section?: string;
  subject?: string;
  board?: string;
  fromDate?: string;
  toDate?: string;
  termKey?: string;
  title?: string;
  rows?: MicroScheduleRow[];
  updatedAt?: string;
};

function keyPart(v: string) {
  return encodeURIComponent(String(v || "").trim()).replace(/%/g, "_");
}

export function teacherSlug(name: string) {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/^(mr|mrs|ms|miss|dr|prof)\.?\s+/i, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function microScheduleDocId(
  termKey: string,
  teacherName: string,
  grade: string,
  section: string,
  subject: string
) {
  return `ms__${keyPart(termKey)}__${keyPart(teacherSlug(teacherName))}__${keyPart(grade)}__${keyPart(section)}__${keyPart(subject)}`;
}

function parseJsonContent(content: unknown): MicroScheduleDocData | null {
  if (!content) return null;
  try {
    const parsed = JSON.parse(String(content));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as MicroScheduleDocData;
  } catch {
    return null;
  }
}

export function microScheduleNoticeTitle(docId: string) {
  return `${MICRO_SCHEDULE_NOTICE_PREFIX}${docId}`;
}

export async function loadMicroScheduleDoc(
  client: SupabaseClient<any>,
  branchId: string,
  docId: string
): Promise<(MicroScheduleDocData & { id: string }) | null> {
  const { data, error } = await client
    .from("notices")
    .select("content")
    .eq("branch_id", branchId)
    .eq("title", microScheduleNoticeTitle(docId))
    .maybeSingle();

  if (error || !data?.content) return null;
  const parsed = parseJsonContent(data.content);
  if (!parsed) return null;
  return { ...parsed, id: docId };
}

export async function loadAllMicroScheduleDocs(
  client: SupabaseClient<any>,
  branchId: string,
  termKey?: string | null
): Promise<Array<{ id: string; data: MicroScheduleDocData }>> {
  const { data, error } = await client
    .from("notices")
    .select("title, content")
    .eq("branch_id", branchId)
    .like("title", `${MICRO_SCHEDULE_NOTICE_PREFIX}%`);

  if (error || !data) return [];

  const rows: Array<{ id: string; data: MicroScheduleDocData }> = [];
  for (const row of data) {
    const title = String(row.title ?? "");
    if (!title.startsWith(MICRO_SCHEDULE_NOTICE_PREFIX)) continue;
    const id = title.slice(MICRO_SCHEDULE_NOTICE_PREFIX.length);
    const parsed = parseJsonContent(row.content);
    if (!parsed) continue;
    if (termKey && parsed.termKey && parsed.termKey !== termKey) continue;
    rows.push({ id, data: parsed });
  }
  return rows;
}

export async function saveMicroScheduleDoc(
  client: SupabaseClient<any>,
  branchId: string,
  docId: string,
  payload: MicroScheduleDocData
): Promise<void> {
  const title = microScheduleNoticeTitle(docId);
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

export async function deleteMicroScheduleDoc(
  client: SupabaseClient<any>,
  branchId: string,
  docId: string
): Promise<void> {
  const { data, error: loadError } = await client
    .from("notices")
    .select("id")
    .eq("branch_id", branchId)
    .eq("title", microScheduleNoticeTitle(docId))
    .maybeSingle();

  if (loadError) throw new Error(loadError.message);
  if (!data?.id) return;

  const { error } = await client.from("notices").delete().eq("id", data.id);
  if (error) throw new Error(error.message);
}

export function emptyMicroScheduleRow(date = "", day = ""): MicroScheduleRow {
  return { date, day, periods: null, board: "", topics: "", activity: "" };
}

export function formatMicroScheduleTitle(doc: MicroScheduleDocData) {
  const teacher = String(doc.teacherName ?? "").trim();
  const grade = String(doc.grade ?? "").trim();
  const section = String(doc.section ?? "").trim();
  const subject = String(doc.subject ?? "").trim();
  const classLabel = grade && section ? `${grade}-${section}` : grade || section;
  return [teacher, classLabel, subject].filter(Boolean).join(" · ");
}
