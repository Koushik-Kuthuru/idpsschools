import type { SupabaseClient } from "@supabase/supabase-js";

export const TIMETABLE_NOTICE_PREFIX = "__timetable__:";
export const TIMETABLE_TEMPLATE_NOTICE_TITLE = "__timetable_template__";

export type TimetableDocData = {
  scope?: string;
  key?: string;
  grade?: string;
  section?: string;
  teacherName?: string;
  subject?: string;
  periodGrid?: Record<string, unknown>;
  timetable?: Record<string, unknown>;
  updatedAt?: string;
};

function parseJsonContent(content: unknown): TimetableDocData | null {
  if (!content) return null;
  try {
    const parsed = JSON.parse(String(content));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as TimetableDocData;
  } catch {
    return null;
  }
}

export function timetableNoticeTitle(docId: string) {
  return `${TIMETABLE_NOTICE_PREFIX}${docId}`;
}

export function docIdFromTimetableTitle(title: string) {
  if (!title.startsWith(TIMETABLE_NOTICE_PREFIX)) return null;
  return title.slice(TIMETABLE_NOTICE_PREFIX.length);
}

export async function loadTimetableDoc(
  client: SupabaseClient<any>,
  branchId: string,
  docId: string
): Promise<TimetableDocData | null> {
  const { data, error } = await client
    .from("notices")
    .select("content")
    .eq("branch_id", branchId)
    .eq("title", timetableNoticeTitle(docId))
    .maybeSingle();

  if (error || !data?.content) return null;
  const parsed = parseJsonContent(data.content);
  if (!parsed) return null;
  return { ...parsed, id: docId } as TimetableDocData & { id: string };
}

export async function saveTimetableDoc(
  client: SupabaseClient<any>,
  branchId: string,
  docId: string,
  payload: TimetableDocData
): Promise<void> {
  const title = timetableNoticeTitle(docId);
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

export async function loadAllTimetableDocs(
  client: SupabaseClient<any>,
  branchId: string,
  termKey?: string | null
): Promise<Array<{ id: string; data: TimetableDocData }>> {
  const { data, error } = await client
    .from("notices")
    .select("title, content")
    .eq("branch_id", branchId)
    .like("title", `${TIMETABLE_NOTICE_PREFIX}%`);

  if (error || !data) return [];

  const rows: Array<{ id: string; data: TimetableDocData }> = [];
  for (const row of data) {
    const id = docIdFromTimetableTitle(String(row.title ?? ""));
    if (!id) continue;
    const parsed = parseJsonContent(row.content);
    if (!parsed) continue;
    if (termKey && parsed.key && parsed.key !== termKey) continue;
    rows.push({ id, data: parsed });
  }
  return rows;
}

export async function loadTimetableTemplate(
  client: SupabaseClient<any>,
  branchId: string
): Promise<Record<string, unknown> | null> {
  const { data, error } = await client
    .from("notices")
    .select("content")
    .eq("branch_id", branchId)
    .eq("title", TIMETABLE_TEMPLATE_NOTICE_TITLE)
    .maybeSingle();

  if (error || !data?.content) return null;
  return parseJsonContent(data.content);
}

export async function saveTimetableTemplate(
  client: SupabaseClient<any>,
  branchId: string,
  payload: Record<string, unknown>
): Promise<void> {
  const content = JSON.stringify({ ...payload, updatedAt: new Date().toISOString() });

  const { data: existing, error: loadError } = await client
    .from("notices")
    .select("id")
    .eq("branch_id", branchId)
    .eq("title", TIMETABLE_TEMPLATE_NOTICE_TITLE)
    .maybeSingle();

  if (loadError) throw new Error(loadError.message);

  if (existing?.id) {
    const { error } = await client.from("notices").update({ content }).eq("id", existing.id);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await client.from("notices").insert({
    branch_id: branchId,
    title: TIMETABLE_TEMPLATE_NOTICE_TITLE,
    content,
    target: "system",
    posted_on: new Date().toISOString().slice(0, 10),
  });

  if (error) throw new Error(error.message);
}
