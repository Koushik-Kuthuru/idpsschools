"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Banknote,
  CalendarDays,
  CreditCard,
  IndianRupee,
  Receipt,
  Search,
  User,
  Users,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import AdminPageHeader from "@/components/admin/PageHeader";
import ExportButton from "@/components/ui/ExportButton";
import { useSchoolId } from "@/hooks/useSchoolId";
import {
  collectionBreakdown,
  filterReceiptsByPeriod,
  formatInr,
  groupByCollector,
  monthLabelFromIndex,
  parseAmount,
  type CollectionPeriod,
  type FeeReceiptRow,
} from "@/lib/feeDepositUtils";
import { buildPath, buildQuery, fetchMany, sortBy, db } from "@/lib/db-client";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const PERIODS: { id: CollectionPeriod; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
];

function mapPaymentDoc(id: string, data: Record<string, unknown>): FeeReceiptRow {
  const monthRaw = String(data.feeMonth ?? data.month ?? "");
  const dateRaw = String(data.date ?? data.payment_date ?? "").slice(0, 10);
  return {
    id,
    receiptNo: String(data.receiptNo ?? data.id ?? id).slice(0, 16),
    month: monthRaw || monthLabelFromIndex(new Date(dateRaw || Date.now()).getMonth()),
    date: dateRaw,
    amount: parseAmount(data.amount),
    mode: String(data.mode ?? data.paymentMode ?? "Cash"),
    fine: parseAmount(data.fine),
    status: String(data.status ?? "Completed"),
    studentId: data.studentId ? String(data.studentId) : undefined,
    studentName: data.studentName ? String(data.studentName) : undefined,
    admissionNo: data.admissionNo ? String(data.admissionNo) : undefined,
    collectedBy: data.collectedBy ? String(data.collectedBy) : undefined,
    collectedByName: data.collectedByName ? String(data.collectedByName) : undefined,
    remark: data.remark ? String(data.remark) : undefined,
  };
}

export default function AdminFeeCollectionReport() {
  const schoolId = useSchoolId();
  const [period, setPeriod] = useState<CollectionPeriod>("today");
  const [receipts, setReceipts] = useState<FeeReceiptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await fetchMany(
        buildQuery(buildPath(db, "schools", schoolId, "payments"), sortBy("createdAt", "desc"))
      );
      setReceipts(snap.docs.map((d) => mapPaymentDoc(d.id, d.data() as Record<string, unknown>)));
    } catch {
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  const periodReceipts = useMemo(
    () => filterReceiptsByPeriod(receipts, period),
    [receipts, period]
  );

  const stats = useMemo(() => collectionBreakdown(periodReceipts), [periodReceipts]);
  const collectors = useMemo(() => groupByCollector(periodReceipts), [periodReceipts]);

  const filteredLedger = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return periodReceipts;
    return periodReceipts.filter((r) => {
      return (
        r.receiptNo.toLowerCase().includes(q) ||
        (r.studentName ?? "").toLowerCase().includes(q) ||
        (r.admissionNo ?? "").toLowerCase().includes(q) ||
        (r.collectedByName ?? "").toLowerCase().includes(q) ||
        r.mode.toLowerCase().includes(q)
      );
    });
  }, [periodReceipts, query]);

  const periodLabel = PERIODS.find((p) => p.id === period)?.label ?? "Today";

  const exportRows = filteredLedger.map((r) => ({
    Receipt: r.receiptNo,
    Date: r.date,
    Month: r.month,
    Student: r.studentName ?? "",
    "Adm No": r.admissionNo ?? "",
    Amount: r.amount,
    Mode: r.mode,
    "Collected By": r.collectedByName ?? "Unknown",
    Remark: r.remark ?? "",
    Status: r.status,
  }));

  return (
    <div className="space-y-5 pb-6">
      <AdminPageHeader
        title="Fee Collection"
        description={`${periodLabel} collections — amounts, payment modes, and who collected each receipt.`}
        actions={
          <div className="flex flex-wrap gap-1.5 bg-gray-100 p-1 rounded-xl">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                  period === p.id ? "bg-white text-[#144835] shadow-sm" : "text-gray-500 hover:text-gray-800"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          { label: "Total Collected", value: formatInr(stats.total), icon: IndianRupee, tone: "text-emerald-700 bg-emerald-50" },
          { label: "Receipts", value: String(stats.count), icon: Receipt, tone: "text-blue-700 bg-blue-50" },
          { label: "Cash", value: formatInr(stats.cash), icon: Banknote, tone: "text-sky-700 bg-sky-50" },
          { label: "UPI", value: formatInr(stats.upi), icon: CreditCard, tone: "text-violet-700 bg-violet-50" },
          { label: "Cheque", value: formatInr(stats.cheque), icon: Receipt, tone: "text-rose-700 bg-rose-50" },
          { label: "NEFT / Bank", value: formatInr(stats.neft), icon: CalendarDays, tone: "text-amber-700 bg-amber-50" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center mb-2", kpi.tone)}>
              <kpi.icon size={18} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{kpi.label}</p>
            <p className="text-lg font-extrabold text-gray-900 mt-0.5">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-1 bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60 flex items-center gap-2">
            <Users size={16} className="text-[#144835]" />
            <h3 className="text-sm font-extrabold text-gray-900">Collected By</h3>
          </div>
          <div className="overflow-auto max-h-[360px]">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white border-b border-gray-100">
                <tr className="text-[10px] uppercase tracking-wide text-gray-400 font-bold">
                  <th className="px-3 py-2 text-left">Staff</th>
                  <th className="px-3 py-2 text-right">Rcpts</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {collectors.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-400 font-semibold">
                      {loading ? "Loading…" : "No collections in this period"}
                    </td>
                  </tr>
                ) : (
                  collectors.map((c) => (
                    <tr key={c.name} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="h-7 w-7 rounded-full bg-[#144835]/10 text-[#144835] flex items-center justify-center shrink-0">
                            <User size={14} />
                          </span>
                          <div>
                            <p className="font-bold text-gray-900">{c.name}</p>
                            <p className="text-[10px] text-gray-400 font-semibold">
                              Cash {formatInr(c.cash)} · Digital {formatInr(c.digital)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-gray-700">{c.count}</td>
                      <td className="px-3 py-2.5 text-right font-extrabold text-[#144835]">
                        {formatInr(c.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col min-h-[360px]">
          <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-extrabold text-gray-900">Collection Ledger</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search student, receipt, collector…"
                  className="h-8 w-52 pl-8 pr-3 rounded-lg border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#144835]/20"
                />
              </div>
              <ExportButton
                data={exportRows}
                filename={`fee-collection-${period}`}
                className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50"
                iconSize={14}
              />
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white border-b border-gray-100">
                <tr className="text-[10px] uppercase tracking-wide text-gray-400 font-bold">
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Receipt</th>
                  <th className="px-3 py-2 text-left">Student</th>
                  <th className="px-3 py-2 text-left">Adm No</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="px-3 py-2 text-left">Mode</th>
                  <th className="px-3 py-2 text-left">Collected By</th>
                </tr>
              </thead>
              <tbody>
                {filteredLedger.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-gray-400 font-semibold">
                      {loading ? "Loading collections…" : "No receipts found"}
                    </td>
                  </tr>
                ) : (
                  filteredLedger.map((r) => (
                    <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-3 py-2.5 text-gray-600 font-semibold">{r.date || "—"}</td>
                      <td className="px-3 py-2.5 font-bold text-gray-800">{r.receiptNo}</td>
                      <td className="px-3 py-2.5 font-semibold text-gray-800 max-w-[140px] truncate">
                        {r.studentName ?? "—"}
                      </td>
                      <td className="px-3 py-2.5 text-gray-600">{r.admissionNo ?? "—"}</td>
                      <td className="px-3 py-2.5 text-right font-extrabold text-[#144835]">
                        {formatInr(r.amount)}
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-gray-600">{r.mode}</td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center gap-1.5 font-bold text-gray-700">
                          <User size={12} className="text-gray-400" />
                          {r.collectedByName ?? "Unknown"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
