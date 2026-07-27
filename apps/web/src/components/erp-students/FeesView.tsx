"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AdminPageHeader from "@/components/admin/PageHeader";
import { SkeletonPage, SkeletonStats } from "@/components/ui/Skeleton";
import { supabase } from "@/lib/supabase/client";
import { startStudentRazorpayCheckout } from "@/lib/startStudentRazorpayCheckout";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
} from "lucide-react";

type FeesPayload = {
  totalFees: number;
  paidAmount: number;
  dueAmount: number;
  dueDate: string;
  category: string;
  structure: Array<{ label: string; amount: number }>;
  recentPayments: Array<{
    id: string;
    period: string;
    paidOn: string;
    amount: number;
    status: "success" | "pending" | "failed";
    transactionId?: string;
    receiptNumber?: string;
    method?: string;
  }>;
};

export default function FeesView() {
  const { schoolId, loading: authLoading } = useAuth();
  const [fees, setFees] = useState<FeesPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const loadFees = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    setError("");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Please sign in again");

      const res = await fetch(
        `/api/portal/student/fees?schoolId=${encodeURIComponent(schoolId)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = (await res.json().catch(() => ({}))) as FeesPayload & { error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to load fees");
      setFees(data);
      setPayAmount(String(Math.max(0, Math.round(Number(data.dueAmount) || 0))));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load fees");
      setFees(null);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    void loadFees();
  }, [loadFees]);

  const handlePay = async () => {
    if (!schoolId || !fees) return;
    const amount = Math.round(Number(payAmount) || 0);
    if (amount <= 0) {
      setNotice("Enter a valid amount");
      return;
    }
    if (amount > fees.dueAmount) {
      setNotice(`Amount cannot exceed ₹${fees.dueAmount.toLocaleString("en-IN")}`);
      return;
    }

    setPaying(true);
    setNotice("");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Please sign in again");

      await startStudentRazorpayCheckout({
        schoolId,
        accessToken: token,
        amount,
        onSuccess: (result) => {
          setIsPayModalOpen(false);
          setNotice(
            result.receiptNo
              ? `Payment successful. Receipt ${result.receiptNo}`
              : "Payment successful.",
          );
          void loadFees();
        },
        onError: (message) => setNotice(message),
        onDismiss: () => setPaying(false),
      });
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not start payment");
    } finally {
      setPaying(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="erp-body space-y-4 sm:space-y-6 pb-10 max-w-[1600px] mx-auto">
        <SkeletonStats count={3} />
        <SkeletonPage stats={0} rows={5} columns={4} toolbar={false} />
      </div>
    );
  }

  if (error || !fees) {
    return (
      <div className="erp-body max-w-[1600px] mx-auto py-16 text-center">
        <p className="text-sm font-semibold text-red-700">{error || "Fees unavailable"}</p>
        <button
          type="button"
          onClick={() => void loadFees()}
          className="mt-4 h-10 px-4 rounded-lg bg-[#144835] text-white text-xs font-bold"
        >
          Retry
        </button>
      </div>
    );
  }

  const transactions = fees.recentPayments ?? [];

  return (
    <div className="erp-body space-y-4 sm:space-y-6 animate-in fade-in duration-500 pb-10 max-w-[1600px] mx-auto">
      <AdminPageHeader
        title="Fees"
        description="Fee balances, billing ledgers, and online Razorpay payments"
        actions={
          <button
            type="button"
            disabled={fees.dueAmount <= 0}
            onClick={() => {
              setPayAmount(String(Math.round(fees.dueAmount)));
              setNotice("");
              setIsPayModalOpen(true);
            }}
            className="h-10 inline-flex items-center justify-center gap-2 rounded-lg bg-[#144835] px-4 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 whitespace-nowrap transition-all disabled:opacity-50"
          >
            <CreditCard size={14} />
            Pay Online Now
          </button>
        }
      />

      {notice ? (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {notice}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 p-6 rounded-[16px] flex flex-col justify-between shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Structured Fee</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-bold text-[#144835]">₹{fees.totalFees.toLocaleString("en-IN")}</span>
            </div>
          </div>
          <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-4">
            Category: {fees.category || "GENERAL"}
          </div>
        </div>

        <div className="bg-white border border-gray-100 p-6 rounded-[16px] flex flex-col justify-between shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Paid Amount</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-bold text-emerald-700">₹{fees.paidAmount.toLocaleString("en-IN")}</span>
            </div>
          </div>
          <div className="text-xs text-emerald-600 font-bold uppercase tracking-wider mt-4 flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-500" /> Includes online & counter payments
          </div>
        </div>

        <div className="bg-red-50/20 border border-dashed border-red-200 p-6 rounded-[16px] flex flex-col justify-between shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
          <div>
            <span className="text-xs font-bold text-red-800 uppercase tracking-wider">Net Due Balance</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-bold text-red-700">₹{fees.dueAmount.toLocaleString("en-IN")}</span>
            </div>
          </div>
          <div className="text-xs text-red-600 font-bold uppercase tracking-wider mt-4 flex items-center gap-1.5">
            <Clock size={13} className="text-red-500" /> Due: {fees.dueDate || "Contact school"}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-[16px] overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
        <div className="px-6 py-4 border-b border-gray-100 bg-[#F8FAFB]">
          <h3 className="text-xs font-bold text-[#144835] uppercase tracking-wider">Transaction Ledger</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-3">Transaction ID</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Fee Category</th>
                <th className="px-6 py-3 text-center">Amount</th>
                <th className="px-6 py-3 text-center">Payment Method</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-bold text-gray-700">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    No payments recorded yet
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-[#144835] font-bold">
                      {txn.transactionId || txn.receiptNumber || txn.id}
                    </td>
                    <td className="px-6 py-4 text-gray-400">{txn.paidOn}</td>
                    <td className="px-6 py-4 text-gray-900">{txn.period}</td>
                    <td className="px-6 py-4 text-center">₹{txn.amount.toLocaleString("en-IN")}</td>
                    <td className="px-6 py-4 text-center text-gray-400">{txn.method || "—"}</td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                          txn.status === "success"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : txn.status === "pending"
                              ? "bg-amber-50 text-amber-700 border border-amber-100"
                              : "bg-red-50 text-red-700 border border-red-100"
                        }`}
                      >
                        {txn.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {txn.status === "success" && txn.receiptNumber ? (
                        <span className="text-[#144835] font-bold uppercase tracking-wider text-xs inline-flex items-center gap-1">
                          <Download size={11} /> {txn.receiptNumber}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white border border-gray-100 rounded-[16px] w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-sm font-bold text-[#144835] uppercase tracking-wider">
                  Pay with Razorpay
                </h3>
                <p className="text-xs text-gray-400 font-bold uppercase mt-1">
                  Outstanding: ₹{fees.dueAmount.toLocaleString("en-IN")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="text-gray-400 hover:text-gray-900 font-extrabold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                  Payment Amount (INR)
                </label>
                <input
                  type="number"
                  min={1}
                  max={fees.dueAmount}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm font-bold text-[#144835]"
                />
              </div>

              <div className="bg-emerald-50/50 p-4 border border-emerald-100 rounded-lg">
                <p className="text-xs text-emerald-800 font-bold leading-normal uppercase">
                  Secured by Razorpay
                </p>
                <p className="text-xs text-emerald-600 font-semibold mt-0.5 leading-normal">
                  UPI, cards, and net banking. Receipt is posted to your fee ledger after verification.
                </p>
              </div>

              {notice ? <p className="text-xs font-semibold text-red-600">{notice}</p> : null}

              <button
                type="button"
                disabled={paying || fees.dueAmount <= 0}
                onClick={() => void handlePay()}
                className="w-full py-3.5 bg-[#144835] hover:bg-[#144835]/90 text-white rounded-lg text-xs font-bold uppercase tracking-wide transition-colors shadow-md mt-2 disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {paying ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                {paying ? "Opening Razorpay…" : "Pay Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
