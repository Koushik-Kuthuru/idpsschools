"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Receipt,
  RotateCw,
  Search,
  XCircle,
} from "lucide-react";
import AdminPageHeader from "@/components/admin/PageHeader";
import ExportButton from "@/components/ui/ExportButton";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { adminFetch } from "@/lib/adminApi";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ChequeRow = {
  id: string;
  receiptNo: string;
  studentName: string;
  admissionNo: string;
  amount: number;
  mode: string;
  feeMonth: string;
  date: string;
  status: string;
  chequeStatus: string;
  chequeNo?: string;
  bankName?: string;
  remark?: string;
  transNo?: string;
  transactionId?: string;
};

function formatInr(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function formatDisplayDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(`${String(iso).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN");
}

function isChequeMode(mode: string) {
  return String(mode ?? "").toLowerCase().includes("cheq");
}

function displayChequeStatus(row: Pick<ChequeRow, "chequeStatus" | "status">) {
  const clearing = String(row.chequeStatus ?? "").trim();
  if (clearing) return clearing;
  const s = String(row.status ?? "").toLowerCase();
  if (s === "cancelled" || s === "failed" || s === "bounced") return "Bounced";
  if (s === "pending" || s === "processing") return "Uncleared";
  return "Cleared";
}

function statusTone(status: string) {
  const s = status.toLowerCase();
  if (s === "cancelled" || s === "failed" || s === "bounced") {
    return "bg-rose-50 text-rose-700 border-rose-100";
  }
  if (s === "pending" || s === "processing" || s === "uncleared") {
    return "bg-amber-50 text-amber-700 border-amber-100";
  }
  return "bg-emerald-50 text-emerald-700 border-emerald-100";
}

function isBouncedStatus(status: string) {
  const s = status.toLowerCase();
  return s === "cancelled" || s === "failed" || s === "bounced";
}

export default function AdminChequesView() {
  const schoolId = useSchoolId();
  const { currentYear } = useAcademicYear();
  const [rows, setRows] = useState<ChequeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "cleared" | "uncleared" | "bounced">("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ schoolId });
      if (currentYear?.name) params.set("academicYear", currentYear.name);
      const res = await adminFetch(`/api/admin/fee-payments?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load cheques");
      const payments = Array.isArray(data.payments) ? data.payments : [];
      const cheques: ChequeRow[] = payments
        .filter((p: Record<string, unknown>) => isChequeMode(String(p.mode ?? "")))
        .map((p: Record<string, unknown>) => {
          const chequeNo = String(p.chequeNo ?? p.chqNo ?? p.transNo ?? p.transactionId ?? "").trim();
          return {
            id: String(p.id ?? ""),
            receiptNo: String(p.receiptNo ?? "—"),
            studentName: String(p.studentName ?? "—"),
            admissionNo: String(p.admissionNo ?? "—"),
            amount: Number(p.amount ?? 0) || 0,
            mode: String(p.mode ?? "Cheque"),
            feeMonth: String(p.feeMonth ?? p.month ?? "—"),
            date: String(p.date ?? "").slice(0, 10),
            status: String(p.status ?? "Completed"),
            chequeStatus: String(p.chequeStatus ?? "").trim(),
            chequeNo: chequeNo || undefined,
            bankName: p.bankName ? String(p.bankName) : undefined,
            remark: p.remark ? String(p.remark) : undefined,
            transNo: p.transNo ? String(p.transNo) : undefined,
            transactionId: p.transactionId ? String(p.transactionId) : undefined,
          };
        })
        .sort((a, b) => String(b.date).localeCompare(String(a.date)) || a.receiptNo.localeCompare(b.receiptNo));
      setRows(cheques);
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : "Failed to load cheques");
    } finally {
      setLoading(false);
    }
  }, [schoolId, currentYear?.name]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const clearing = displayChequeStatus(r).toLowerCase();
      if (statusFilter === "cleared" && clearing !== "cleared") return false;
      if (statusFilter === "uncleared" && clearing !== "uncleared") return false;
      if (statusFilter === "bounced" && clearing !== "bounced") return false;
      if (!q) return true;
      return (
        r.receiptNo.toLowerCase().includes(q) ||
        r.studentName.toLowerCase().includes(q) ||
        r.admissionNo.toLowerCase().includes(q) ||
        String(r.chequeNo ?? "").toLowerCase().includes(q) ||
        String(r.bankName ?? "").toLowerCase().includes(q) ||
        String(r.transNo ?? "").toLowerCase().includes(q) ||
        String(r.transactionId ?? "").toLowerCase().includes(q) ||
        String(r.remark ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, query, statusFilter]);

  const stats = useMemo(() => {
    const cleared = filtered.filter((r) => displayChequeStatus(r).toLowerCase() === "cleared");
    const uncleared = filtered.filter((r) => displayChequeStatus(r).toLowerCase() === "uncleared");
    const bounced = filtered.filter((r) => displayChequeStatus(r).toLowerCase() === "bounced");
    return {
      count: filtered.length,
      clearedCount: cleared.length,
      unclearedCount: uncleared.length,
      bouncedCount: bounced.length,
      clearedAmount: cleared.reduce((s, r) => s + r.amount, 0),
      unclearedAmount: uncleared.reduce((s, r) => s + r.amount, 0),
      bouncedAmount: bounced.reduce((s, r) => s + r.amount, 0),
    };
  }, [filtered]);

  const clearingCounts = useMemo(() => {
    let cleared = 0;
    let uncleared = 0;
    let bounced = 0;
    for (const r of rows) {
      const s = displayChequeStatus(r).toLowerCase();
      if (s === "cleared") cleared += 1;
      else if (s === "uncleared") uncleared += 1;
      else if (s === "bounced") bounced += 1;
    }
    return { cleared, uncleared, bounced };
  }, [rows]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
      <AdminPageHeader
        title="Cheques"
        description={
          currentYear?.name
            ? `Cheque fee receipts for ${currentYear.name}`
            : "Cheque fee receipts"
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="h-10 px-3 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1.5"
            >
              <RotateCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <ExportButton
              data={filtered.map((r) => ({
                Receipt: r.receiptNo,
                Student: r.studentName,
                Admission: r.admissionNo,
                Date: r.date,
                Month: r.feeMonth,
                Amount: r.amount,
                Clearing: displayChequeStatus(r),
                Status: r.status,
                ChequeNo: r.chequeNo || "",
                Bank: r.bankName || "",
                Remark: r.remark || "",
              }))}
              filename={`cheques-${currentYear?.name ?? "all"}`}
            />
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Cheque receipts", value: String(stats.count), icon: Receipt, tone: "text-[#144835]" },
          { label: "Cleared", value: formatInr(stats.clearedAmount), icon: CheckCircle2, tone: "text-emerald-700" },
          { label: "Uncleared", value: formatInr(stats.unclearedAmount), icon: Clock, tone: "text-amber-700" },
          { label: "Bounced", value: formatInr(stats.bouncedAmount), icon: XCircle, tone: "text-rose-700" },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-gray-200 px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{card.label}</p>
              <card.icon size={14} className={card.tone} />
            </div>
            <p className={cn("text-lg font-extrabold mt-1", card.tone)}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search receipt, student, admission, cheque no…"
              className="w-full h-10 rounded-xl border border-gray-200 pl-9 pr-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="h-10 rounded-xl border border-gray-200 px-3 text-xs font-bold text-gray-700 bg-white"
          >
            <option value="all">All clearing</option>
            <option value="cleared">Cleared ({clearingCounts.cleared})</option>
            <option value="uncleared">Uncleared ({clearingCounts.uncleared})</option>
            <option value="bounced">Bounced ({clearingCounts.bounced})</option>
          </select>
        </div>

        {error ? (
          <div className="p-8 text-center">
            <AlertCircle className="mx-auto text-rose-400 mb-2" size={28} />
            <p className="text-sm font-bold text-rose-700">{error}</p>
          </div>
        ) : loading ? (
          <SkeletonTable rows={8} columns={8} showHeader={false} className="rounded-none border-0" />
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="mx-auto text-gray-300 mb-2" size={32} />
            <p className="text-sm font-bold text-gray-500">No cheque receipts found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-[10px] uppercase tracking-wide text-gray-400 font-bold">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Receipt</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Month</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Cheque / Bank</th>
                  <th className="px-4 py-3">Clearing</th>
                  <th className="px-4 py-3">Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((r) => {
                  const clearing = displayChequeStatus(r);
                  return (
                    <tr key={r.id} className="hover:bg-gray-50/60">
                      <td className="px-4 py-3 font-semibold text-gray-600">{formatDisplayDate(r.date)}</td>
                      <td className="px-4 py-3 font-bold text-gray-900">{r.receiptNo}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-gray-900">{r.studentName}</p>
                        <p className="text-[10px] font-semibold text-gray-400 mt-0.5">Adm. {r.admissionNo}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-600">{r.feeMonth || "—"}</td>
                      <td className="px-4 py-3 text-right font-extrabold text-[#144835]">{formatInr(r.amount)}</td>
                      <td className="px-4 py-3">
                        <p className="font-mono text-[11px] text-gray-700">{r.chequeNo || "—"}</p>
                        {r.bankName ? (
                          <p className="text-[10px] font-semibold text-gray-400 mt-0.5">{r.bankName}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase",
                            statusTone(clearing)
                          )}
                        >
                          {clearing}
                        </span>
                        {isBouncedStatus(r.status) && clearing !== "Bounced" ? (
                          <p className="text-[10px] font-semibold text-rose-500 mt-1">{r.status}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate" title={r.remark}>
                        {r.remark || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
