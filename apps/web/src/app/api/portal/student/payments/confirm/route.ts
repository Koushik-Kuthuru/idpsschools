import { withSupabaseRoute } from "@/lib/supabase/route-handler";
import {
  fulfillRazorpayOrder,
  isRazorpayConfigured,
  verifyCheckoutToken,
  verifyPaymentSignature,
} from "@/lib/razorpay";

/**
 * Verify endpoint for hosted Checkout page (mobile WebBrowser flow).
 * Auth is the signed checkout token + Razorpay payment signature.
 */
export const POST = withSupabaseRoute("none", async (req, ctx) => {
  if (!isRazorpayConfigured()) {
    return Response.json({ error: "Online payments are not configured" }, { status: 503 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      token?: string;
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    };

    const tokenPayload = verifyCheckoutToken(String(body.token ?? ""));
    if (!tokenPayload) {
      return Response.json({ error: "Invalid or expired checkout session" }, { status: 401 });
    }

    const orderId = String(body.razorpay_order_id || tokenPayload.orderId || "").trim();
    const paymentId = String(body.razorpay_payment_id || "").trim();
    const signature = String(body.razorpay_signature || "").trim();
    const schoolSlug = String(tokenPayload.schoolSlug || "").trim();

    if (!orderId || !paymentId || !signature || !schoolSlug) {
      return Response.json({ error: "Missing payment fields" }, { status: 400 });
    }
    if (String(tokenPayload.orderId) !== orderId) {
      return Response.json({ error: "Order mismatch" }, { status: 400 });
    }
    if (!verifyPaymentSignature({ orderId, paymentId, signature })) {
      return Response.json({ error: "Invalid payment signature" }, { status: 400 });
    }

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
      amountInr: Number(tokenPayload.amount ? Number(tokenPayload.amount) / 100 : 0),
      schoolSlug,
    });
  } catch (err) {
    console.error("portal/student/payments/confirm", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Payment confirmation failed" },
      { status: 500 },
    );
  }
});
