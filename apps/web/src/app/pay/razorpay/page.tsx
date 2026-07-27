import { Suspense } from "react";
import RazorpayCheckoutClient from "./RazorpayCheckoutClient";

export default function RazorpayCheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F4F7F5] flex items-center justify-center p-6">
          <p className="text-sm text-gray-600">Loading checkout…</p>
        </main>
      }
    >
      <RazorpayCheckoutClient />
    </Suspense>
  );
}
