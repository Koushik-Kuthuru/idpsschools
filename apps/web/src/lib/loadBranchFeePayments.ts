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
  academicYear?: string;
  transNo?: string;
  transactionId?: string;
  createdAt: string;
};

export type LoadFeePaymentsOptions = {
  academicYear?: string | null;
  studentId?: string | null;
  admissionNo?: string | null;
  /** Inclusive YYYY-MM-DD — filters on notices.posted_on when present. */
  dateFrom?: string | null;
  /** Inclusive YYYY-MM-DD — filters on notices.posted_on when present. */
  dateTo?: string | null;
  /** Cap rows after sort (newest first). */
  limit?: number | null;
};

function paymentNoticeTitle(paymentId: string) {
  return `${FEE_PAYMENT_NOTICE_PREFIX}${paymentId}`;
}

function parsePaymentNotice(notice: { title: string; content: string }): BranchFeePaymentRecord | null {
  const id = String(notice.title).slice(FEE_PAYMENT_NOTICE_PREFIX.length);
  try {
    const parsed = JSON.parse(String(notice.content ?? "{}")) as BranchFeePaymentRecord;
    return { ...parsed, id: parsed.id ?? id };
  } catch {
    return null;
  }
}

function matchesFilters(
  payment: BranchFeePaymentRecord,
  options: LoadFeePaymentsOptions
): boolean {
  const year = String(options.academicYear ?? "").trim();
  if (year) {
    const payYear = String(payment.academicYear ?? "").trim();
    const id = String(payment.id ?? "");
    const ref = String(payment.reference ?? "");
    const inMeta = payYear === year || id.includes(year) || ref.includes(year);
    if (!inMeta) return false;
  }

  const studentId = String(options.studentId ?? "").trim();
  if (studentId && String(payment.studentId ?? "") !== studentId) return false;

  const admissionNo = String(options.admissionNo ?? "").trim().toLowerCase();
  if (admissionNo) {
    const adm = String(payment.admissionNo ?? "").trim().toLowerCase();
    if (adm !== admissionNo) return false;
  }

  return true;
}

function inDateRange(payment: BranchFeePaymentRecord, options: LoadFeePaymentsOptions): boolean {
  const from = String(options.dateFrom ?? "").trim().slice(0, 10);
  const to = String(options.dateTo ?? "").trim().slice(0, 10);
  if (!from && !to) return true;
  const day = String(payment.date ?? payment.createdAt ?? "").trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
}

/**
 * Load fee payment notices. Prefer academicYear / student filters so admin UI stays fast
 * (full-branch history is thousands of notice rows).
 */
export async function loadBranchFeePayments(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  options: LoadFeePaymentsOptions = {}
): Promise<BranchFeePaymentRecord[]> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return [];

  const year = String(options.academicYear ?? "").trim();
  const studentId = String(options.studentId ?? "").trim();
  const admissionNo = String(options.admissionNo ?? "").trim();
  const studentScoped = Boolean(studentId || admissionNo);
  const dateFrom = String(options.dateFrom ?? "").trim().slice(0, 10);
  const dateTo = String(options.dateTo ?? "").trim().slice(0, 10);
  const hasDateRange = Boolean(dateFrom || dateTo);
  const limit = options.limit != null && options.limit > 0 ? options.limit : null;
  // When the UI only needs the newest N rows, stop scanning early (newest first).
  // Date ranges are usually small — scan the filtered set fully (still capped).
  const scanCap =
    hasDateRange
      ? Math.min(Math.max(limit ?? 8000, 8000), 12000)
      : limit == null
        ? null
        : studentScoped
          ? Math.min(limit * 2, 4000)
          : Math.min(limit + 200, 4000);
  const listOrder =
    limit != null || hasDateRange
      ? ({ orderBy: "posted_on" as const, ascending: false, maxRows: scanCap })
      : ({ orderBy: "title" as const, ascending: true, maxRows: null });

  const applyDateRange = (query: any) => {
    let q = query;
    if (dateFrom) q = q.gte("posted_on", dateFrom);
    if (dateTo) q = q.lte("posted_on", dateTo);
    return q;
  };

  // Student/admission scope: content filter only (do not pull the whole year).
  // Year-only: title prefix RCP-{year}-% (import receipt ids).
  // No filters: full payment notice dump (slow — avoid in admin UI).
  let notices: Array<{ title: string; content: string }> = [];

  if (studentScoped) {
    notices = await fetchAllPaginated<{ title: string; content: string }>(
      admin,
      "notices",
      "title, content",
      (query) => {
        let q = query.eq("branch_id", branchId).like("title", `${FEE_PAYMENT_NOTICE_PREFIX}%`);
        if (studentId) {
          q = q.ilike("content", `%"studentId":"${studentId}"%`);
        } else {
          q = q.ilike("content", `%"admissionNo":"${admissionNo}"%`);
        }
        return applyDateRange(q);
      },
      listOrder
    );
  } else if (year) {
    notices = await fetchAllPaginated<{ title: string; content: string }>(
      admin,
      "notices",
      "title, content",
      (query) =>
        applyDateRange(
          query
            .eq("branch_id", branchId)
            .like("title", `${FEE_PAYMENT_NOTICE_PREFIX}RCP-${year}-%`)
        ),
      listOrder
    );
    // Fallback for older receipts that only store academicYear inside JSON.
    if (notices.length === 0) {
      notices = await fetchAllPaginated<{ title: string; content: string }>(
        admin,
        "notices",
        "title, content",
        (query) =>
          applyDateRange(
            query
              .eq("branch_id", branchId)
              .like("title", `${FEE_PAYMENT_NOTICE_PREFIX}%`)
              .ilike("content", `%"academicYear":"${year}"%`)
          ),
        listOrder
      );
    }
  } else {
    notices = await fetchAllPaginated<{ title: string; content: string }>(
      admin,
      "notices",
      "title, content",
      (query) =>
        applyDateRange(
          query.eq("branch_id", branchId).like("title", `${FEE_PAYMENT_NOTICE_PREFIX}%`)
        ),
      listOrder
    );
  }

  const byId = new Map<string, BranchFeePaymentRecord>();
  for (const notice of notices) {
    const payment = parsePaymentNotice(notice);
    if (!payment) continue;
    if (!matchesFilters(payment, options)) continue;
    if (!inDateRange(payment, options)) continue;
    byId.set(payment.id, payment);
  }

  let payments = [...byId.values()].sort((a, b) =>
    String(b.createdAt ?? b.date).localeCompare(String(a.createdAt ?? a.date))
  );

  if (limit != null) payments = payments.slice(0, limit);

  return payments;
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
