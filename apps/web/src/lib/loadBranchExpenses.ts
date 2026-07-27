import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";
import {
  deleteExpenseDoc,
  loadAllExpenseDocs,
  loadExpenseDoc,
  saveExpenseDoc,
  type ExpenseDocData,
  type ExpenseStatus,
} from "@/lib/expenseStore";

export type BranchExpenseRecord = {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  status: ExpenseStatus;
  vendor: string;
  notes: string;
  department: string;
  paymentMode: string;
};

function shapeExpense(id: string, data: ExpenseDocData): BranchExpenseRecord {
  const statusRaw = String(data.status ?? "Pending");
  const status: ExpenseStatus =
    statusRaw === "Paid" || statusRaw === "Approved" ? statusRaw : "Pending";

  return {
    id,
    title: String(data.title ?? "Untitled Expense").trim() || "Untitled Expense",
    category: String(data.category ?? "Other").trim() || "Other",
    amount: Number(data.amount) || 0,
    date: String(data.date ?? "").trim(),
    status,
    vendor: String(data.vendor ?? "").trim() || "—",
    notes: String(data.notes ?? "").trim(),
    department: String(data.department ?? "").trim(),
    paymentMode: String(data.paymentMode ?? "").trim(),
  };
}

export async function loadBranchExpenses(
  admin: SupabaseClient<any>,
  schoolSlug: string
): Promise<BranchExpenseRecord[]> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return [];

  const docs = await loadAllExpenseDocs(admin, branchId);
  return docs.map(({ id, data }) => shapeExpense(id, data));
}

export async function loadBranchExpenseById(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  expenseId: string
): Promise<BranchExpenseRecord | null> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return null;
  const doc = await loadExpenseDoc(admin, branchId, expenseId);
  if (!doc) return null;
  const { id, ...data } = doc;
  return shapeExpense(id, data);
}

export async function saveBranchExpense(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  payload: ExpenseDocData & { id?: string }
): Promise<BranchExpenseRecord> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) throw new Error("Branch not found");

  const title = String(payload.title ?? "").trim();
  const amount = Number(payload.amount) || 0;
  if (!title) throw new Error("Expense title is required");
  if (amount <= 0) throw new Error("Amount must be greater than 0");

  const id =
    String(payload.id ?? "").trim() ||
    `EXP-${Date.now().toString().slice(-8)}`;

  await saveExpenseDoc(admin, branchId, id, {
    title,
    category: String(payload.category ?? "Other").trim() || "Other",
    amount,
    date: String(payload.date ?? new Date().toISOString().slice(0, 10)),
    status: payload.status ?? "Pending",
    vendor: String(payload.vendor ?? "").trim(),
    notes: String(payload.notes ?? "").trim(),
    department: String(payload.department ?? "").trim(),
    paymentMode: String(payload.paymentMode ?? "").trim(),
  });

  const saved = await loadExpenseDoc(admin, branchId, id);
  if (!saved) throw new Error("Failed to load saved expense");
  const { id: savedId, ...data } = saved;
  return shapeExpense(savedId, data);
}

export async function deleteBranchExpense(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  expenseId: string
): Promise<void> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) throw new Error("Branch not found");
  await deleteExpenseDoc(admin, branchId, expenseId);
}
