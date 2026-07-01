import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchAllPaginated } from "@/lib/studentProfileStore";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";

export const FEE_PAYMENT_NOTICE_PREFIX = "__fee_payment__:";

export type BranchFeePaymentRecord = {
  id: string;
  receiptNo: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  amount: number;
  mode: string;
  feeMonth: string;
  month: string;
  date: string;
  dateDisplay?: string;
  time?: string;
  status: string;
  remark?: string;
  collectedByName?: string;
  reference?: string;
  particular?: string;
  createdAt: string;
};

function paymentNoticeTitle(paymentId: string) {
  return `${FEE_PAYMENT_NOTICE_PREFIX}${paymentId}`;
}

export async function loadBranchFeePayments(
  admin: SupabaseClient<any>,
  schoolSlug: string
): Promise<BranchFeePaymentRecord[]> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return [];

  const notices = await fetchAllPaginated<{ title: string; content: string }>(
    admin,
    "notices",
    "title, content",
    (query) => query.eq("branch_id", branchId).like("title", `${FEE_PAYMENT_NOTICE_PREFIX}%`)
  );

  const payments: BranchFeePaymentRecord[] = [];
  for (const notice of notices) {
    const id = String(notice.title).slice(FEE_PAYMENT_NOTICE_PREFIX.length);
    try {
      const parsed = JSON.parse(String(notice.content ?? "{}")) as BranchFeePaymentRecord;
      payments.push({ ...parsed, id: parsed.id ?? id });
    } catch {
      /* skip malformed */
    }
  }

  return payments.sort((a, b) => String(b.createdAt ?? b.date).localeCompare(String(a.createdAt ?? a.date)));
}

export async function upsertBranchFeePayment(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  payment: BranchFeePaymentRecord
): Promise<void> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) throw new Error("Branch not found");

  const id = String(payment.id ?? "").trim();
  if (!id) throw new Error("Payment id required");

  const title = paymentNoticeTitle(id);
  const content = JSON.stringify(payment);
  const { data: existing } = await admin
    .from("notices")
    .select("id")
    .eq("branch_id", branchId)
    .eq("title", title)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await admin.from("notices").update({ content }).eq("id", existing.id);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await admin.from("notices").insert({
    branch_id: branchId,
    title,
    content,
    target: "system",
    posted_on: String(payment.date || payment.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10)),
  });
  if (error) throw new Error(error.message);
}
