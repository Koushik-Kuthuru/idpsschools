import { withSupabaseRoute } from "@/lib/supabase/route-handler";
import { requirePortalUser, requireSchoolSlug } from "@/lib/portalRouteAuth";
import {
  fulfillRazorpayOrder,
  isRazorpayConfigured,
  loadPendingOrder,
  verifyPaymentSignature,
} from "@/lib/razorpay";

export const POST = withSupabaseRoute("user", async (req, ctx) => {
  const user = await requirePortalUser(ctx);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const schoolSlug = requireSchoolSlug(req);
  if (!schoolSlug) return Response.json({ error: "schoolId required" }, { status: 400 });

  if (!isRazorpayConfigured()) {
    return Response.json({ error: "Online payments are not configured" }, { status: 503 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      orderId?: string;
      paymentId?: string;
      signature?: string;
    };

    const orderId = String(body.razorpay_order_id || body.orderId || "").trim();
    const paymentId = String(body.razorpay_payment_id || body.paymentId || "").trim();
    const signature = String(body.razorpay_signature || body.signature || "").trim();

    if (!orderId || !paymentId || !signature) {
      return Response.json({ error: "Missing payment verification fields" }, { status: 400 });
    }

    if (!verifyPaymentSignature({ orderId, paymentId, signature })) {
      return Response.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    const pending = await loadPendingOrder(ctx.supabaseAdmin, schoolSlug, orderId);
    if (!pending) return Response.json({ error: "Order not found" }, { status: 404 });

    const result = await fulfillRazorpayOrder(ctx.supabaseAdmin, {
      orderId,
      paymentId,
      schoolSlug,
    });

    return Response.json({
      ok: true,
      duplicate: result.duplicate,
      receiptNo: result.receiptNo,
      paymentId,
      orderId,
      amountInr: pending.amountInr,
    });
  } catch (err) {
    console.error("portal/student/payments/verify", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Payment verification failed" },
      { status: 500 },
    );
  }
});
