import { withSupabaseRoute } from "@/lib/supabase/route-handler";
import { requirePortalUser, requireSchoolSlug } from "@/lib/portalRouteAuth";
import { buildStudentFees, loadStudentDetailForAuth } from "@/lib/portalMobileData";
import { getSchoolBranch } from "@/lib/schools";
import {
  getRazorpayClient,
  getRazorpayKeyId,
  inrToPaise,
  isRazorpayConfigured,
  savePendingOrder,
  signCheckoutToken,
  type RazorpayPendingOrder,
} from "@/lib/razorpay";

export const POST = withSupabaseRoute("user", async (req, ctx) => {
  const user = await requirePortalUser(ctx);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const schoolSlug = requireSchoolSlug(req);
  if (!schoolSlug) return Response.json({ error: "schoolId required" }, { status: 400 });

  if (!isRazorpayConfigured()) {
    return Response.json(
      { error: "Online payments are not configured yet. Contact the school office." },
      { status: 503 },
    );
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      amount?: number;
      academicYear?: string;
      feeMonth?: string;
      remark?: string;
    };

    const academicYear = String(body.academicYear ?? "").trim() || null;
    const detail = await loadStudentDetailForAuth(ctx.supabaseAdmin, {
      schoolSlug,
      authId: user.authId,
      email: user.email,
      academicYear,
    });
    if (!detail) return Response.json({ error: "Student record not found" }, { status: 404 });

    const fees = await buildStudentFees(detail, schoolSlug, ctx.supabaseAdmin);
    const dueAmount = Math.max(0, Math.round(Number(fees.dueAmount) || 0));
    if (dueAmount <= 0) {
      return Response.json({ error: "No outstanding fees to pay" }, { status: 400 });
    }

    let amountInr = Math.round(Number(body.amount) || 0);
    if (!amountInr || amountInr <= 0) amountInr = dueAmount;
    if (amountInr > dueAmount) {
      return Response.json(
        { error: `Amount cannot exceed outstanding dues (₹${dueAmount.toLocaleString("en-IN")})` },
        { status: 400 },
      );
    }
    if (amountInr < 1) {
      return Response.json({ error: "Enter a valid amount" }, { status: 400 });
    }

    const amountPaise = inrToPaise(amountInr);
    const studentId = String(detail.id);
    const admissionNo = String(detail.admissionNo ?? "").trim();
    const studentName = String(detail.name ?? detail.studentName ?? "Student").trim();
    const receipt = `fee_${admissionNo || studentId}_${Date.now()}`.slice(0, 40);

    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt,
      notes: {
        schoolSlug,
        studentId,
        admissionNo,
        academicYear: academicYear || "",
      },
    });

    const pending: RazorpayPendingOrder = {
      orderId: String(order.id),
      amountPaise,
      amountInr,
      currency: "INR",
      studentId,
      admissionNo,
      studentName,
      schoolSlug,
      academicYear,
      feeMonth: String(body.feeMonth ?? "").trim() || undefined,
      remark: String(body.remark ?? "").trim() || undefined,
      status: "created",
      createdAt: new Date().toISOString(),
    };
    await savePendingOrder(ctx.supabaseAdmin, schoolSlug, pending);

    const keyId = getRazorpayKeyId();
    const branch = getSchoolBranch(schoolSlug);
    const checkoutToken = signCheckoutToken({
      orderId: pending.orderId,
      amount: amountPaise,
      currency: "INR",
      keyId,
      schoolSlug,
      studentId,
      studentName,
      admissionNo,
      academicYear: academicYear || "",
    });

    const origin =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
      new URL(req.url).origin;
    const checkoutUrl = `${origin}/pay/razorpay?token=${encodeURIComponent(checkoutToken)}`;

    return Response.json({
      keyId,
      orderId: pending.orderId,
      amount: amountPaise,
      amountInr,
      currency: "INR",
      name: branch?.name || "IDPS Schools",
      description: `Fee payment${admissionNo ? ` · Adm ${admissionNo}` : ""}`,
      prefill: {
        name: studentName,
        contact: String(detail.parentPhone ?? detail.mobileNumber ?? "").trim() || undefined,
        email: String(detail.contactEmail ?? detail.email ?? user.email ?? "").trim() || undefined,
      },
      notes: {
        schoolSlug,
        studentId,
        admissionNo,
      },
      checkoutToken,
      checkoutUrl,
      dueAmount,
    });
  } catch (err) {
    console.error("portal/student/payments/create-order", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to create payment order" },
      { status: 500 },
    );
  }
});
