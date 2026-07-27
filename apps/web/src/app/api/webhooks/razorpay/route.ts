import { withSupabaseRoute } from "@/lib/supabase/route-handler";
import {
  fulfillRazorpayOrder,
  getRazorpayWebhookSecret,
  verifyWebhookSignature,
} from "@/lib/razorpay";

/**
 * Razorpay webhook — configure payment.captured / order.paid
 * URL: /api/webhooks/razorpay
 * Header: X-Razorpay-Signature
 */
export const POST = withSupabaseRoute("none", async (req, ctx) => {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";

  if (!getRazorpayWebhookSecret()) {
    console.error("RAZORPAY_WEBHOOK_SECRET is not set");
    return Response.json({ error: "Webhook not configured" }, { status: 503 });
  }

  if (!verifyWebhookSignature(rawBody, signature)) {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const event = JSON.parse(rawBody) as {
      event?: string;
      payload?: {
        payment?: { entity?: Record<string, unknown> };
        order?: { entity?: Record<string, unknown> };
      };
    };

    const eventName = String(event.event ?? "");
    if (eventName !== "payment.captured" && eventName !== "order.paid") {
      return Response.json({ ok: true, ignored: eventName });
    }

    const payment = event.payload?.payment?.entity ?? {};
    const orderId = String(payment.order_id ?? event.payload?.order?.entity?.id ?? "").trim();
    const paymentId = String(payment.id ?? "").trim();
    const status = String(payment.status ?? "").toLowerCase();

    if (!orderId || !paymentId) {
      return Response.json({ ok: true, skipped: "missing ids" });
    }
    if (status && status !== "captured" && status !== "authorized") {
      return Response.json({ ok: true, skipped: status });
    }

    const result = await fulfillRazorpayOrder(ctx.supabaseAdmin, {
      orderId,
      paymentId,
    });

    return Response.json({
      ok: true,
      duplicate: result.duplicate,
      receiptNo: result.receiptNo,
    });
  } catch (err) {
    console.error("webhooks/razorpay", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Webhook handler failed" },
      { status: 500 },
    );
  }
});
