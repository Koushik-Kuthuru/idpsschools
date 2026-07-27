"use client";

type CreateOrderResponse = {
  keyId: string;
  orderId: string;
  amount: number;
  amountInr: number;
  currency: string;
  name: string;
  description: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  checkoutUrl?: string;
  error?: string;
};

type VerifyResponse = {
  ok?: boolean;
  receiptNo?: string;
  paymentId?: string;
  error?: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-razorpay="1"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.razorpay = "1";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function startStudentRazorpayCheckout(options: {
  schoolId: string;
  accessToken: string;
  amount?: number;
  academicYear?: string | null;
  onSuccess?: (result: VerifyResponse) => void;
  onError?: (message: string) => void;
  onDismiss?: () => void;
}): Promise<void> {
  const params = new URLSearchParams({ schoolId: options.schoolId });
  const createRes = await fetch(`/api/portal/student/payments/create-order?${params}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${options.accessToken}`,
    },
    body: JSON.stringify({
      amount: options.amount,
      academicYear: options.academicYear || undefined,
    }),
  });
  const order = (await createRes.json().catch(() => ({}))) as CreateOrderResponse;
  if (!createRes.ok) {
    throw new Error(order.error || "Could not start payment");
  }

  const scriptOk = await loadRazorpayScript();
  if (!scriptOk || !window.Razorpay) {
    throw new Error("Could not load Razorpay Checkout");
  }

  const rzp = new window.Razorpay({
    key: order.keyId,
    amount: order.amount,
    currency: order.currency || "INR",
    name: order.name || "IDPS Schools",
    description: order.description || "Fee payment",
    order_id: order.orderId,
    prefill: order.prefill || {},
    notes: order.notes || {},
    theme: { color: "#144835" },
    handler: async (response: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) => {
      try {
        const verifyRes = await fetch(`/api/portal/student/payments/verify?${params}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${options.accessToken}`,
          },
          body: JSON.stringify(response),
        });
        const data = (await verifyRes.json().catch(() => ({}))) as VerifyResponse;
        if (!verifyRes.ok || !data.ok) {
          options.onError?.(data.error || "Payment verification failed");
          return;
        }
        options.onSuccess?.(data);
      } catch (err) {
        options.onError?.(err instanceof Error ? err.message : "Payment verification failed");
      }
    },
    modal: {
      ondismiss: () => options.onDismiss?.(),
    },
  });

  rzp.open();
}
