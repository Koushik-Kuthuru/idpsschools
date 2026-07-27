import crypto from "node:crypto";
import Razorpay from "razorpay";
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";
import { recordBranchStudentFeePayment } from "@/lib/portalMobileData";

export const RAZORPAY_ORDER_PREFIX = "__razorpay_order__:";
export const RAZORPAY_PAYMENT_PREFIX = "__razorpay_payment__:";

export type RazorpayPendingOrder = {
  orderId: string;
  amountPaise: number;
  amountInr: number;
  currency: string;
  studentId: string;
  admissionNo?: string;
  studentName?: string;
  schoolSlug: string;
  academicYear?: string | null;
  feeMonth?: string;
  remark?: string;
  status: "created" | "paid" | "failed";
  receiptNo?: string;
  paymentId?: string;
  createdAt: string;
  paidAt?: string;
};

export function getRazorpayKeyId(): string {
  return String(process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "").trim();
}

export function getRazorpayKeySecret(): string {
  return String(process.env.RAZORPAY_KEY_SECRET || "").trim();
}

export function getRazorpayWebhookSecret(): string {
  return String(process.env.RAZORPAY_WEBHOOK_SECRET || "").trim();
}

export function isRazorpayConfigured(): boolean {
  return Boolean(getRazorpayKeyId() && getRazorpayKeySecret());
}

export function getRazorpayClient(): Razorpay {
  const key_id = getRazorpayKeyId();
  const key_secret = getRazorpayKeySecret();
  if (!key_id || !key_secret) {
    throw new Error("Razorpay is not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)");
  }
  return new Razorpay({ key_id, key_secret });
}

export function inrToPaise(amountInr: number): number {
  return Math.round(Number(amountInr) * 100);
}

export function verifyPaymentSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = getRazorpayKeySecret();
  if (!secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(String(input.signature || ""));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = getRazorpayWebhookSecret();
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature || ""));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** Short-lived signed token so mobile can open hosted Checkout without cookies. */
export function signCheckoutToken(payload: Record<string, unknown>, ttlSeconds = 900): string {
  const secret = getRazorpayKeySecret();
  if (!secret) throw new Error("Razorpay secret missing");
  const body = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const data = Buffer.from(JSON.stringify(body)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifyCheckoutToken(token: string): Record<string, unknown> | null {
  const secret = getRazorpayKeySecret();
  if (!secret || !token.includes(".")) return null;
  const [data, sig] = token.split(".");
  const expected = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  const a = Buffer.from(expected);
  const b = Buffer.from(sig || "");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as Record<
      string,
      unknown
    >;
    if (Number(payload.exp ?? 0) < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function savePendingOrder(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  order: RazorpayPendingOrder,
): Promise<void> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) throw new Error("Branch not found");
  const title = `${RAZORPAY_ORDER_PREFIX}${order.orderId}`;
  const content = JSON.stringify(order);
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
    posted_on: new Date().toISOString().slice(0, 10),
  });
  if (error) throw new Error(error.message);
}

export async function loadPendingOrder(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  orderId: string,
): Promise<RazorpayPendingOrder | null> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return null;
  const { data } = await admin
    .from("notices")
    .select("content")
    .eq("branch_id", branchId)
    .eq("title", `${RAZORPAY_ORDER_PREFIX}${orderId}`)
    .maybeSingle();
  if (!data?.content) return null;
  try {
    return JSON.parse(data.content) as RazorpayPendingOrder;
  } catch {
    return null;
  }
}

export async function findPendingOrderById(
  admin: SupabaseClient<any>,
  orderId: string,
): Promise<{ schoolSlug: string; order: RazorpayPendingOrder } | null> {
  const { data } = await admin
    .from("notices")
    .select("content, branch_id")
    .eq("title", `${RAZORPAY_ORDER_PREFIX}${orderId}`)
    .maybeSingle();
  if (!data?.content) return null;
  try {
    const order = JSON.parse(data.content) as RazorpayPendingOrder;
    return { schoolSlug: order.schoolSlug, order };
  } catch {
    return null;
  }
}

async function alreadyRecordedPayment(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  paymentId: string,
): Promise<boolean> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return false;
  const { data } = await admin
    .from("notices")
    .select("id")
    .eq("branch_id", branchId)
    .eq("title", `${RAZORPAY_PAYMENT_PREFIX}${paymentId}`)
    .maybeSingle();
  return Boolean(data?.id);
}

async function markPaymentRecorded(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  paymentId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) throw new Error("Branch not found");
  await admin.from("notices").insert({
    branch_id: branchId,
    title: `${RAZORPAY_PAYMENT_PREFIX}${paymentId}`,
    content: JSON.stringify(payload),
    target: "system",
    posted_on: new Date().toISOString().slice(0, 10),
  });
}

export async function fulfillRazorpayOrder(
  admin: SupabaseClient<any>,
  input: {
    orderId: string;
    paymentId: string;
    schoolSlug?: string;
  },
) {
  const found =
    (input.schoolSlug
      ? {
          schoolSlug: input.schoolSlug,
          order: await loadPendingOrder(admin, input.schoolSlug, input.orderId),
        }
      : null) ?? (await findPendingOrderById(admin, input.orderId));

  if (!found?.order) throw new Error("Order not found");
  const { schoolSlug, order } = found;
  if (!order) throw new Error("Order not found");

  if (await alreadyRecordedPayment(admin, schoolSlug, input.paymentId)) {
    return { duplicate: true as const, order, receiptNo: order.receiptNo };
  }

  if (order.status === "paid" && order.paymentId === input.paymentId) {
    return { duplicate: true as const, order, receiptNo: order.receiptNo };
  }

  const result = await recordBranchStudentFeePayment(admin, schoolSlug, {
    studentId: order.studentId,
    amount: order.amountInr,
    mode: "Razorpay",
    feeMonth: order.feeMonth,
    remark: order.remark || "Online fee payment (Razorpay)",
    transactionId: input.paymentId,
    academicYear: order.academicYear,
    collectedByName: "Online (Razorpay)",
    collectedById: input.paymentId,
  });

  const updated: RazorpayPendingOrder = {
    ...order,
    status: "paid",
    paymentId: input.paymentId,
    receiptNo: result.payment.receiptNo,
    paidAt: new Date().toISOString(),
  };
  await savePendingOrder(admin, schoolSlug, updated);
  try {
    await markPaymentRecorded(admin, schoolSlug, input.paymentId, {
      orderId: input.orderId,
      paymentId: input.paymentId,
      receiptNo: result.payment.receiptNo,
      studentId: order.studentId,
      amountInr: order.amountInr,
      paidAt: updated.paidAt,
    });
  } catch {
    // Idempotency marker may race; ledger write already succeeded.
  }

  return {
    duplicate: false as const,
    order: updated,
    receiptNo: result.payment.receiptNo,
    payment: result.payment,
  };
}
