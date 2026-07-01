export const FEE_PAYMENT_PREFIX = "__fee_payment__:";

export function paymentNoticeTitle(paymentId) {
  return `${FEE_PAYMENT_PREFIX}${paymentId}`;
}

export async function fetchAllPaginated(supabase, table, select, applyFilters) {
  const rows = [];
  let from = 0;
  while (true) {
    let query = supabase.from(table).select(select).range(from, from + 999);
    query = applyFilters(query);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  return rows;
}

export async function loadBranchFeePayments(supabase, branchId) {
  const notices = await fetchAllPaginated(supabase, "notices", "title, content", (query) =>
    query.eq("branch_id", branchId).like("title", `${FEE_PAYMENT_PREFIX}%`)
  );

  const payments = [];
  for (const notice of notices) {
    const id = String(notice.title).slice(FEE_PAYMENT_PREFIX.length);
    try {
      const parsed = JSON.parse(String(notice.content ?? "{}"));
      payments.push({ id, ...parsed });
    } catch {
      /* skip malformed */
    }
  }
  return payments;
}

export async function saveFeePayment(supabase, branchId, payment) {
  const id = String(payment.id ?? "").trim();
  if (!id) throw new Error("Payment id required");

  const title = paymentNoticeTitle(id);
  const content = JSON.stringify(payment);
  const postedOn = (() => {
    const candidates = [payment.date, String(payment.createdAt ?? "").slice(0, 10)];
    for (const value of candidates) {
      const d = String(value ?? "").slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
      const year = Number.parseInt(d.slice(0, 4), 10);
      if (year >= 2000 && year <= 2100) return d;
    }
    return new Date().toISOString().slice(0, 10);
  })();
  const { data: existing } = await supabase
    .from("notices")
    .select("id")
    .eq("branch_id", branchId)
    .eq("title", title)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase.from("notices").update({ content }).eq("id", existing.id);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase.from("notices").insert({
    branch_id: branchId,
    title,
    content,
    target: "system",
    posted_on: postedOn,
  });
  if (error) throw new Error(error.message);
}
