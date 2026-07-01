import { supabaseAdmin } from "@/lib/supabase/admin";
import { loadBranchFeePayments, upsertBranchFeePayment } from "@/lib/loadBranchFeePayments";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");

  if (!schoolSlug) {
    return Response.json({ error: "schoolId required" }, { status: 400 });
  }

  try {
    const payments = await loadBranchFeePayments(supabaseAdmin, schoolSlug);
    return Response.json({ payments });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load fee payments";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const schoolSlug = String(body.schoolId ?? "").trim();
    const payment = body.payment;

    if (!schoolSlug || !payment?.id) {
      return Response.json({ error: "schoolId and payment.id required" }, { status: 400 });
    }

    await upsertBranchFeePayment(supabaseAdmin, schoolSlug, payment);
    const payments = await loadBranchFeePayments(supabaseAdmin, schoolSlug);
    return Response.json({ ok: true, payments });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save fee payment";
    return Response.json({ error: message }, { status: 400 });
  }
}
