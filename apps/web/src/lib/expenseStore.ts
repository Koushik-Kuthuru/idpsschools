import type { SupabaseClient } from "@supabase/supabase-js";

export const EXPENSE_NOTICE_PREFIX = "__expense__:";

export const EXPENSE_CATEGORIES = [
  "Mess",
  "Hostel",
  "Staff",
  "Academic",
  "Transport",
  "Utilities",
  "Maintenance",
  "Supplies",
  "Operations",
  "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type ExpenseStatus = "Pending" | "Approved" | "Paid";

export type ExpenseDocData = {
  title?: string;
  category?: string;
  amount?: number;
  date?: string;
  status?: ExpenseStatus;
  vendor?: string;
  notes?: string;
  department?: string;
  paymentMode?: string;
  updatedAt?: string;
};

function parseJsonContent(content: unknown): ExpenseDocData | null {
  if (!content) return null;
  try {
    const parsed = JSON.parse(String(content));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as ExpenseDocData;
  } catch {
    return null;
  }
}

export function expenseNoticeTitle(docId: string) {
  return `${EXPENSE_NOTICE_PREFIX}${docId}`;
}

export function docIdFromExpenseTitle(title: string) {
  if (!title.startsWith(EXPENSE_NOTICE_PREFIX)) return null;
  return title.slice(EXPENSE_NOTICE_PREFIX.length);
}

export async function loadAllExpenseDocs(
  client: SupabaseClient<any>,
  branchId: string
): Promise<Array<{ id: string; data: ExpenseDocData }>> {
  const { data, error } = await client
    .from("notices")
    .select("title, content")
    .eq("branch_id", branchId)
    .like("title", `${EXPENSE_NOTICE_PREFIX}%`);

  if (error || !data) return [];

  const rows: Array<{ id: string; data: ExpenseDocData }> = [];
  for (const row of data) {
    const id = docIdFromExpenseTitle(String(row.title ?? ""));
    if (!id) continue;
    const parsed = parseJsonContent(row.content);
    if (!parsed) continue;
    rows.push({ id, data: parsed });
  }

  return rows.sort((a, b) =>
    String(b.data.date ?? "").localeCompare(String(a.data.date ?? ""))
  );
}

export async function loadExpenseDoc(
  client: SupabaseClient<any>,
  branchId: string,
  docId: string
): Promise<(ExpenseDocData & { id: string }) | null> {
  const { data, error } = await client
    .from("notices")
    .select("content")
    .eq("branch_id", branchId)
    .eq("title", expenseNoticeTitle(docId))
    .maybeSingle();

  if (error || !data?.content) return null;
  const parsed = parseJsonContent(data.content);
  if (!parsed) return null;
  return { id: docId, ...parsed };
}

export async function saveExpenseDoc(
  client: SupabaseClient<any>,
  branchId: string,
  docId: string,
  payload: ExpenseDocData
): Promise<void> {
  const title = expenseNoticeTitle(docId);
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

export async function deleteExpenseDoc(
  client: SupabaseClient<any>,
  branchId: string,
  docId: string
): Promise<void> {
  const { data, error: loadError } = await client
    .from("notices")
    .select("id")
    .eq("branch_id", branchId)
    .eq("title", expenseNoticeTitle(docId))
    .maybeSingle();

  if (loadError) throw new Error(loadError.message);
  if (!data?.id) return;

  const { error } = await client.from("notices").delete().eq("id", data.id);
  if (error) throw new Error(error.message);
}
