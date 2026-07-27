"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type CheckoutPayload = {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  schoolSlug: string;
  studentName?: string;
  admissionNo?: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

function decodeTokenPayload(token: string): CheckoutPayload | null {
  try {
    const [data] = token.split(".");
    if (!data) return null;
    const json = JSON.parse(atob(data.replace(/-/g, "+").replace(/_/g, "/")));
    return {
      orderId: String(json.orderId ?? ""),
      amount: Number(json.amount ?? 0),
      currency: String(json.currency ?? "INR"),
      keyId: String(json.keyId ?? ""),
      schoolSlug: String(json.schoolSlug ?? ""),
      studentName: json.studentName ? String(json.studentName) : undefined,
      admissionNo: json.admissionNo ? String(json.admissionNo) : undefined,
    };
  } catch {
    return null;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function RazorpayCheckoutPage() {
  const searchParams = useSearchParams();
  const token = String(searchParams.get("token") ?? "");
  const redirect = String(searchParams.get("redirect") ?? "");
  const payload = useMemo(() => (token ? decodeTokenPayload(token) : null), [token]);
  const [status, setStatus] = useState<"idle" | "opening" | "success" | "error">("idle");
  const [message, setMessage] = useState("Preparing secure checkout…");
  const [receiptNo, setReceiptNo] = useState("");

  const finish = useCallback(
    (ok: boolean, detail?: { receiptNo?: string; paymentId?: string; error?: string }) => {
      if (ok) {
        setStatus("success");
        setReceiptNo(detail?.receiptNo || "");
        setMessage("Payment successful. You can return to the app.");
        if (redirect) {
          const url = new URL(redirect);
          url.searchParams.set("status", "success");
          if (detail?.receiptNo) url.searchParams.set("receiptNo", detail.receiptNo);
          if (detail?.paymentId) url.searchParams.set("paymentId", detail.paymentId);
          window.location.href = url.toString();
        }
        return;
      }
      setStatus("error");
      setMessage(detail?.error || "Payment failed or was cancelled.");
      if (redirect) {
        const url = new URL(redirect);
        url.searchParams.set("status", "failed");
        if (detail?.error) url.searchParams.set("error", detail.error);
        window.location.href = url.toString();
      }
    },
    [redirect],
  );

  useEffect(() => {
    if (!token || !payload?.orderId || !payload.keyId) {
      setStatus("error");
      setMessage("Invalid or expired checkout link.");
      return;
    }

    let cancelled = false;
    (async () => {
      setStatus("opening");
      const ok = await loadRazorpayScript();
      if (cancelled) return;
      if (!ok || !window.Razorpay) {
        finish(false, { error: "Could not load Razorpay Checkout" });
        return;
      }

      const rzp = new window.Razorpay({
        key: payload.keyId,
        amount: payload.amount,
        currency: payload.currency || "INR",
        name: "IDPS Schools",
        description: payload.admissionNo
          ? `Fee payment · Adm ${payload.admissionNo}`
          : "Fee payment",
        order_id: payload.orderId,
        prefill: {
          name: payload.studentName || "",
        },
        theme: { color: "#144835" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const res = await fetch("/api/portal/student/payments/confirm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                token,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const data = (await res.json().catch(() => ({}))) as {
              ok?: boolean;
              receiptNo?: string;
              error?: string;
            };
            if (!res.ok || !data.ok) {
              finish(false, { error: data.error || "Verification failed" });
              return;
            }
            finish(true, {
              receiptNo: data.receiptNo,
              paymentId: response.razorpay_payment_id,
            });
          } catch (err) {
            finish(false, {
              error: err instanceof Error ? err.message : "Verification failed",
            });
          }
        },
        modal: {
          ondismiss: () => finish(false, { error: "Payment cancelled" }),
        },
      });

      rzp.open();
    })();

    return () => {
      cancelled = true;
    };
  }, [token, payload, finish]);

  return (
    <main className="min-h-screen bg-[#F4F7F5] flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-white border border-gray-100 shadow-sm p-8 text-center">
        <p className="text-xs font-bold uppercase tracking-wider text-[#144835]/70">IDPS Fee Payment</p>
        <h1 className="mt-2 text-2xl font-bold text-[#144835]">
          {status === "success" ? "Payment complete" : "Razorpay Checkout"}
        </h1>
        <p className="mt-3 text-sm text-gray-600">{message}</p>
        {receiptNo ? (
          <p className="mt-4 text-sm font-semibold text-emerald-700">Receipt: {receiptNo}</p>
        ) : null}
        {status === "error" ? (
          <p className="mt-6 text-xs text-gray-400">Close this window and try again from the Fees screen.</p>
        ) : null}
      </div>
    </main>
  );
}
