import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import { loadBranchFeePayments, upsertBranchFeePayment } from "@/lib/loadBranchFeePayments";

export const GET = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");
  const academicYear = url.searchParams.get("academicYear");
  const studentId = url.searchParams.get("studentId");
  const admissionNo = url.searchParams.get("admissionNo");
  const dateFrom = url.searchParams.get("dateFrom");
  const dateTo = url.searchParams.get("dateTo");
  const limitRaw = url.searchParams.get("limit");
  const limit = limitRaw ? Number.parseInt(limitRaw, 10) : null;

  if (!schoolSlug) {
    return noStoreJson({ error: "schoolId required" }, { status: 400 });
  }

  try {
    const payments = await loadBranchFeePayments(supabaseAdmin, schoolSlug, {
      academicYear,
      studentId,
      admissionNo,
      dateFrom,
      dateTo,
      limit: Number.isFinite(limit) ? limit : null,
    });
    return noStoreJson({ payments });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load fee payments";
    return noStoreJson({ error: message }, { status: 500 });
  }
});

export const POST = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  try {
    const body = await req.json();
    const schoolSlug = String(body.schoolId ?? "").trim();
    const payment = body.payment;

    if (!schoolSlug || !payment?.id) {
      return noStoreJson({ error: "schoolId and payment.id required" }, { status: 400 });
    }

    await upsertBranchFeePayment(supabaseAdmin, schoolSlug, payment);
    // Do not reload the entire branch payment history after every save.
    return noStoreJson({ ok: true, payment });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save fee payment";
    return noStoreJson({ error: message }, { status: 400 });
  }
});
