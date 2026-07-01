"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import ExportButton from "@/components/ui/ExportButton";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useFeePayments } from "@/hooks/useFeePayments";
import {
  collectionBreakdown,
  filterReceiptsByPeriod,
  formatInr,
  type CollectionPeriod,
} from "@/lib/feeDepositUtils";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const PERIODS: { id: CollectionPeriod; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "all", label: "All Time" },
];

export default function FeeTransactionsTab() {
  const schoolId = useSchoolId();
  const { receipts, loading } = useFeePayments(schoolId);
  const [period, setPeriod] = useState<CollectionPeriod>("month");
  const [query, setQuery] = useState("");

  const periodReceipts = useMemo(
    () => filterReceiptsByPeriod(receipts, period),
    [receipts, period]
  );

  const stats = useMemo(() => collectionBreakdown(periodReceipts), [periodReceipts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return periodReceipts;
    return periodReceipts.filter((r) => {
      return (
        r.receiptNo.toLowerCase().includes(q) ||
        (r.studentName ?? "").toLowerCase().includes(q) ||
        (r.admissionNo ?? "").toLowerCase().includes(q) ||
        (r.collectedByName ?? "").toLowerCase().includes(q) ||
        r.mode.toLowerCase().includes(q) ||
        (r.remark ?? "").toLowerCase().includes(q)
      );
    });
  }, [periodReceipts, query]);

  const exportRows = filtered.map((r) => ({
    Date: r.date,
    Receipt: r.receiptNo,
    Month: r.month,
    Student: r.studentName ?? "",
    "Adm No": r.admissionNo ?? "",
    Amount: r.amount,
    Mode: r.mode,
    "Collected By": r.collectedByName ?? "",
    Remark: r.remark ?? "",
    Status: r.status,
  }));

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Collected", value: formatInr(stats.total) },
          { label: "Receipts", value: String(stats.count) },
          { label: "Cash", value: formatInr(stats.cash) },
          { label: "Digital", value: formatInr(stats.upi + stats.neft + stats.cheque) },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{kpi.label}</p>
            <p className="text-lg font-extrabold text-gray-900 mt-0.5">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-gray-50/60">
          <div className="flex flex-wrap gap-1.5">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                  period === p.id ? "bg-[#144835] text-white" : "text-gray-500 hover:bg-gray-100"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search transactions…"
                className="h-8 w-56 pl-8 pr-3 rounded-lg border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#144835]/20"
              />
            </div>
            <ExportButton
              data={exportRows}
              filename={`fee-transactions-${period}`}
              className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50"
              iconSize={14}
            />
          </div>
        </div>
        <div className="overflow-auto max-h-[min(70vh,640px)]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-white border-b border-gray-100">
              <tr className="text-[10px] uppercase tracking-wide text-gray-400 font-bold">
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Receipt</th>
                <th className="px-3 py-2 text-left">Student</th>
                <th className="px-3 py-2 text-left">Adm No</th>
                <th className="px-3 py-2 text-left">Month</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2 text-left">Mode</th>
                <th className="px-3 py-2 text-left">Collected By</th>
                <th className="px-3 py-2 text-left">Remark</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-gray-400 font-semibold">
                    {loading ? "Loading transactions…" : "No fee transactions found"}
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-3 py-2.5 text-gray-600 font-semibold">{r.date || "—"}</td>
                    <td className="px-3 py-2.5 font-bold text-gray-800">{r.receiptNo}</td>
                    <td className="px-3 py-2.5 font-semibold text-gray-800 max-w-[160px] truncate">
                      {r.studentName ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600">{r.admissionNo ?? "—"}</td>
                    <td className="px-3 py-2.5 text-gray-600">{r.month}</td>
                    <td className="px-3 py-2.5 text-right font-extrabold text-[#144835]">
                      {formatInr(r.amount)}
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-gray-600">{r.mode}</td>
                    <td className="px-3 py-2.5 text-gray-700">{r.collectedByName ?? "—"}</td>
                    <td className="px-3 py-2.5 text-gray-500 max-w-[140px] truncate">{r.remark ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
