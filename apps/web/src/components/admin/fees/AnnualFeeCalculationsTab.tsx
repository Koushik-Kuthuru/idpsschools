"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
const SafeLink = Link as any;
import { Search } from "lucide-react";
import ExportButton from "@/components/ui/ExportButton";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useBranchStudents } from "@/hooks/useBranchStudents";
import { useFeePayments } from "@/hooks/useFeePayments";
import { filterReceiptsByPeriod, formatInr, type CollectionPeriod } from "@/lib/feeDepositUtils";

const PERIODS: { id: CollectionPeriod; label: string }[] = [
  { id: "month", label: "This Month" },
  { id: "all", label: "All Time" },
];

export default function AnnualFeeCalculationsTab() {
  const schoolId = useSchoolId();
  const { currentYear } = useAcademicYear();
  const { students, loading: studentsLoading } = useBranchStudents(schoolId, currentYear?.name);
  const { receipts, loading: paymentsLoading } = useFeePayments(schoolId);
  const [period, setPeriod] = useState<CollectionPeriod>("all");
  const [query, setQuery] = useState("");

  const loading = studentsLoading || paymentsLoading;
  const base = `/schools/${schoolId}/admin`;

  const periodReceipts = useMemo(
    () => filterReceiptsByPeriod(receipts, period),
    [receipts, period]
  );

  const paidByStudent = useMemo(() => {
    const map = new Map<string, { paid: number; receipts: number; lastDate: string }>();
    for (const r of periodReceipts) {
      const key = r.studentId || r.admissionNo?.toLowerCase() || r.studentName?.toLowerCase() || r.id;
      const prev = map.get(key) ?? { paid: 0, receipts: 0, lastDate: "" };
      prev.paid += r.amount;
      prev.receipts += 1;
      if (r.date && r.date > prev.lastDate) prev.lastDate = r.date;
      map.set(key, prev);
    }
    return map;
  }, [periodReceipts]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students
      .map((s) => {
        const pay =
          paidByStudent.get(s.id) ||
          paidByStudent.get(s.admissionNo.toLowerCase()) ||
          paidByStudent.get(s.name.toLowerCase()) || { paid: 0, receipts: 0, lastDate: "" };
        return {
          id: s.id,
          admissionNo: s.admissionNo,
          name: s.name,
          classLabel: [s.className, s.section].filter(Boolean).join(" - "),
          paid: pay.paid,
          receipts: pay.receipts,
          lastDate: pay.lastDate,
        };
      })
      .filter((r) => {
        if (!q) return true;
        return (
          r.name.toLowerCase().includes(q) ||
          r.admissionNo.toLowerCase().includes(q) ||
          r.classLabel.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [students, paidByStudent, query]);

  const totals = useMemo(
    () => ({
      paid: rows.reduce((s, r) => s + r.paid, 0),
      students: rows.length,
    }),
    [rows]
  );

  const exportRows = rows.map((r) => ({
    "Adm No": r.admissionNo,
    Student: r.name,
    Class: r.classLabel,
    "Fee Paid": r.paid,
    Receipts: r.receipts,
    "Last Payment": r.lastDate || "—",
  }));

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <p className="text-xs text-gray-500 leading-relaxed">
        Annual fee summary for {currentYear?.name ?? "the active academic year"} — fee paid from recorded
        transactions. Open a student profile for the full fee grid, discounts, and balance due.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Students</p>
          <p className="text-lg font-extrabold text-gray-900 mt-0.5">{totals.students}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Total Fee Paid</p>
          <p className="text-lg font-extrabold text-[#144835] mt-0.5">{formatInr(totals.paid)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Period</p>
          <p className="text-sm font-extrabold text-gray-900 mt-1">
            {PERIODS.find((p) => p.id === period)?.label}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-gray-50/60">
          <div className="flex flex-wrap gap-1.5">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  period === p.id ? "bg-[#144835] text-white" : "text-gray-500 hover:bg-gray-100"
                }`}
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
                placeholder="Search student…"
                className="h-8 w-52 pl-8 pr-3 rounded-lg border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#144835]/20"
              />
            </div>
            <ExportButton
              data={exportRows}
              filename="annual-fee-calculations"
              className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50"
              iconSize={14}
            />
          </div>
        </div>
        <div className="overflow-auto max-h-[min(70vh,640px)]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-white border-b border-gray-100">
              <tr className="text-[10px] uppercase tracking-wide text-gray-400 font-bold">
                <th className="px-3 py-2 text-left">Adm No</th>
                <th className="px-3 py-2 text-left">Student</th>
                <th className="px-3 py-2 text-left">Class</th>
                <th className="px-3 py-2 text-right">Fee Paid</th>
                <th className="px-3 py-2 text-right">Receipts</th>
                <th className="px-3 py-2 text-left">Last Payment</th>
                <th className="px-3 py-2 text-right">Profile</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400 font-semibold">
                    {loading ? "Loading annual fee data…" : "No students found"}
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-3 py-2.5 font-semibold text-gray-700">{r.admissionNo}</td>
                    <td className="px-3 py-2.5 font-bold text-gray-900">{r.name}</td>
                    <td className="px-3 py-2.5 text-gray-600">{r.classLabel || "—"}</td>
                    <td className="px-3 py-2.5 text-right font-extrabold text-[#144835]">
                      {formatInr(r.paid)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-700">{r.receipts}</td>
                    <td className="px-3 py-2.5 text-gray-600">{r.lastDate || "—"}</td>
                    <td className="px-3 py-2.5 text-right">
                      <SafeLink
                        href={`${base}/academic/students/${r.id}/profile?tab=Fees`}
                        className="text-[#144835] font-bold hover:underline"
                      >
                        View
                      </SafeLink>
                    </td>
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
