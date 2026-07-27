import type { SupabaseClient } from "@supabase/supabase-js";

export const MESS_MENU_PREFIX = "__mess_menu__:";
export const MESS_ATTENDANCE_PREFIX = "__mess_attendance__:";
export const MESS_FEEDBACK_PREFIX = "__mess_feedback__:";
export const MESS_DISH_PREFIX = "__mess_dish__:";

export type MessMealType = "breakfast" | "lunch" | "snacks" | "dinner";

export type MessMenuDay = {
  day: string;
  breakfast: string;
  lunch: string;
  snacks: string;
  dinner: string;
  notes: string;
};

export type MessMenuDoc = {
  weekStart: string;
  title: string;
  published: boolean;
  days: MessMenuDay[];
  updatedAt?: string;
};

export type MessAttendanceStatus = "present" | "absent" | "leave";

export type MessAttendanceEntry = {
  studentId: string;
  status: MessAttendanceStatus;
};

export type MessAttendanceDoc = {
  date: string;
  meal: MessMealType;
  entries: MessAttendanceEntry[];
  updatedAt?: string;
};

export type MessFeedbackDoc = {
  studentId: string;
  studentName: string;
  className: string;
  section: string;
  meal: MessMealType | "general";
  rating: number;
  comment: string;
  date: string;
  status: "new" | "reviewed";
  updatedAt?: string;
};

export type MessDishDoc = {
  name: string;
  category: MessMealType | "general";
  cuisine: string;
  ingredients: string;
  recipe: string;
  prepTime: string;
  servings: string;
  notes: string;
  isActive: boolean;
  updatedAt?: string;
};

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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

export function emptyMessMenuDays(): MessMenuDay[] {
  return WEEKDAYS.map((day) => ({
    day,
    breakfast: "",
    lunch: "",
    snacks: "",
    dinner: "",
    notes: "",
  }));
}

export function messMenuDocId(weekStart: string) {
  return `week__${keyPart(weekStart)}`;
}

export function messMenuTitle(docId: string) {
  return `${MESS_MENU_PREFIX}${docId}`;
}

export function messAttendanceDocId(date: string, meal: MessMealType) {
  return `${keyPart(date)}__${keyPart(meal)}`;
}

export function messAttendanceTitle(docId: string) {
  return `${MESS_ATTENDANCE_PREFIX}${docId}`;
}

export function messFeedbackTitle(docId: string) {
  return `${MESS_FEEDBACK_PREFIX}${docId}`;
}

export async function loadAllMessMenus(
  client: SupabaseClient<any>,
  branchId: string
): Promise<Array<MessMenuDoc & { id: string }>> {
  const { data, error } = await client
    .from("notices")
    .select("title, content")
    .eq("branch_id", branchId)
    .like("title", `${MESS_MENU_PREFIX}%`);

  if (error || !data) return [];

  const rows: Array<MessMenuDoc & { id: string }> = [];
  for (const row of data) {
    const title = String(row.title ?? "");
    if (!title.startsWith(MESS_MENU_PREFIX)) continue;
    const id = title.slice(MESS_MENU_PREFIX.length);
    const parsed = parseJson<MessMenuDoc>(row.content);
    if (!parsed?.weekStart) continue;
    rows.push({
      id,
      weekStart: String(parsed.weekStart),
      title: String(parsed.title ?? `Week of ${parsed.weekStart}`),
      published: Boolean(parsed.published),
      days: Array.isArray(parsed.days) && parsed.days.length ? parsed.days : emptyMessMenuDays(),
      updatedAt: parsed.updatedAt,
    });
  }

  return rows.sort((a, b) => String(b.weekStart).localeCompare(String(a.weekStart)));
}

export async function loadMessMenu(
  client: SupabaseClient<any>,
  branchId: string,
  weekStart: string
): Promise<(MessMenuDoc & { id: string }) | null> {
  const id = messMenuDocId(weekStart);
  const { data, error } = await client
    .from("notices")
    .select("content")
    .eq("branch_id", branchId)
    .eq("title", messMenuTitle(id))
    .maybeSingle();

  if (error || !data?.content) return null;
  const parsed = parseJson<MessMenuDoc>(data.content);
  if (!parsed) return null;
  return {
    id,
    weekStart,
    title: String(parsed.title ?? `Week of ${weekStart}`),
    published: Boolean(parsed.published),
    days: Array.isArray(parsed.days) && parsed.days.length ? parsed.days : emptyMessMenuDays(),
    updatedAt: parsed.updatedAt,
  };
}

export async function saveMessMenu(
  client: SupabaseClient<any>,
  branchId: string,
  payload: MessMenuDoc
): Promise<void> {
  const id = messMenuDocId(payload.weekStart);
  await upsertNotice(client, branchId, messMenuTitle(id), payload);
}

export async function deleteMessMenu(
  client: SupabaseClient<any>,
  branchId: string,
  weekStart: string
): Promise<void> {
  const id = messMenuDocId(weekStart);
  const { data, error: loadError } = await client
    .from("notices")
    .select("id")
    .eq("branch_id", branchId)
    .eq("title", messMenuTitle(id))
    .maybeSingle();

  if (loadError) throw new Error(loadError.message);
  if (!data?.id) return;

  const { error } = await client.from("notices").delete().eq("id", data.id);
  if (error) throw new Error(error.message);
}

export async function loadMessAttendance(
  client: SupabaseClient<any>,
  branchId: string,
  date: string,
  meal: MessMealType
): Promise<MessAttendanceDoc | null> {
  const id = messAttendanceDocId(date, meal);
  const { data, error } = await client
    .from("notices")
    .select("content")
    .eq("branch_id", branchId)
    .eq("title", messAttendanceTitle(id))
    .maybeSingle();

  if (error || !data?.content) return null;
  const parsed = parseJson<MessAttendanceDoc>(data.content);
  if (!parsed) return null;
  return {
    date,
    meal,
    entries: Array.isArray(parsed.entries) ? parsed.entries : [],
    updatedAt: parsed.updatedAt,
  };
}

export async function saveMessAttendance(
  client: SupabaseClient<any>,
  branchId: string,
  payload: MessAttendanceDoc
): Promise<void> {
  const id = messAttendanceDocId(payload.date, payload.meal);
  await upsertNotice(client, branchId, messAttendanceTitle(id), payload);
}

export async function loadMessFeedback(
  client: SupabaseClient<any>,
  branchId: string
): Promise<Array<{ id: string } & MessFeedbackDoc>> {
  const { data, error } = await client
    .from("notices")
    .select("title, content")
    .eq("branch_id", branchId)
    .like("title", `${MESS_FEEDBACK_PREFIX}%`);

  if (error || !data) return [];

  const rows: Array<{ id: string } & MessFeedbackDoc> = [];
  for (const row of data) {
    const title = String(row.title ?? "");
    if (!title.startsWith(MESS_FEEDBACK_PREFIX)) continue;
    const id = title.slice(MESS_FEEDBACK_PREFIX.length);
    const parsed = parseJson<MessFeedbackDoc>(row.content);
    if (!parsed?.studentName && !parsed?.comment) continue;
    rows.push({ id, ...parsed });
  }

  return rows.sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

export async function saveMessFeedback(
  client: SupabaseClient<any>,
  branchId: string,
  docId: string,
  payload: MessFeedbackDoc
): Promise<void> {
  await upsertNotice(client, branchId, messFeedbackTitle(docId), payload);
}

export async function deleteMessFeedback(
  client: SupabaseClient<any>,
  branchId: string,
  docId: string
): Promise<void> {
  const { data, error: loadError } = await client
    .from("notices")
    .select("id")
    .eq("branch_id", branchId)
    .eq("title", messFeedbackTitle(docId))
    .maybeSingle();

  if (loadError) throw new Error(loadError.message);
  if (!data?.id) return;

  const { error } = await client.from("notices").delete().eq("id", data.id);
  if (error) throw new Error(error.message);
}

export function messDishDocId(name: string) {
  return `dish__${keyPart(name.toLowerCase())}`;
}

export function messDishTitle(docId: string) {
  return `${MESS_DISH_PREFIX}${docId}`;
}

export async function loadMessDishes(
  client: SupabaseClient<any>,
  branchId: string
): Promise<Array<{ id: string } & MessDishDoc>> {
  const { data, error } = await client
    .from("notices")
    .select("title, content")
    .eq("branch_id", branchId)
    .like("title", `${MESS_DISH_PREFIX}%`);

  if (error || !data) return [];

  const rows: Array<{ id: string } & MessDishDoc> = [];
  for (const row of data) {
    const title = String(row.title ?? "");
    if (!title.startsWith(MESS_DISH_PREFIX)) continue;
    const id = title.slice(MESS_DISH_PREFIX.length);
    const parsed = parseJson<MessDishDoc>(row.content);
    if (!parsed?.name) continue;
    rows.push({
      id,
      name: String(parsed.name).trim(),
      category: parsed.category ?? "general",
      cuisine: String(parsed.cuisine ?? "").trim(),
      ingredients: String(parsed.ingredients ?? "").trim(),
      recipe: String(parsed.recipe ?? "").trim(),
      prepTime: String(parsed.prepTime ?? "").trim(),
      servings: String(parsed.servings ?? "").trim(),
      notes: String(parsed.notes ?? "").trim(),
      isActive: parsed.isActive !== false,
      updatedAt: parsed.updatedAt,
    });
  }

  return rows.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}

export async function saveMessDish(
  client: SupabaseClient<any>,
  branchId: string,
  docId: string,
  payload: MessDishDoc
): Promise<void> {
  await upsertNotice(client, branchId, messDishTitle(docId), payload);
}

export async function deleteMessDish(
  client: SupabaseClient<any>,
  branchId: string,
  docId: string
): Promise<void> {
  const { data, error: loadError } = await client
    .from("notices")
    .select("id")
    .eq("branch_id", branchId)
    .eq("title", messDishTitle(docId))
    .maybeSingle();

  if (loadError) throw new Error(loadError.message);
  if (!data?.id) return;

  const { error } = await client.from("notices").delete().eq("id", data.id);
  if (error) throw new Error(error.message);
}
