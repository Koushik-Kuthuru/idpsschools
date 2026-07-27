"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
const SafeLink = Link as any;
import { Search } from "lucide-react";
import ExportButton from "@/components/ui/ExportButton";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useFeePaidUnpaid } from "@/hooks/useFeePaidUnpaid";
import { formatInr } from "@/lib/feeDepositUtils";
import type { FeePaidUnpaidListKind, FeePaidUnpaidRow } from "@/lib/feePaidUnpaidRegistry";

type Props = {
  list: FeePaidUnpaidListKind;
};

export default function StudentFeePaidUnpaidTab({ list }: Props) {
  const schoolId = useSchoolId();
  const { currentYear } = useAcademicYear();
  const {
    paid,
    unpaid,
    paidTotals,
    unpaidTotals,
    loading,
    error,
    source,
  } = useFeePaidUnpaid(schoolId, currentYear?.name);
  const [query, setQuery] = useState("");

  const base = `/schools/${schoolId}/admin`;
  const rows = list === "paid" ? paid : unpaid;
  const totals = list === "paid" ? paidTotals : unpaidTotals;
  const title = list === "paid" ? "Students Fee Paid" : "Students Fee Unpaid";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      return (
        r.studentName.toLowerCase().includes(q) ||
        r.admissionNo.toLowerCase().includes(q) ||
        r.className.toLowerCase().includes(q) ||
        r.section.toLowerCase().includes(q) ||
        r.fatherName.toLowerCase().includes(q) ||
        r.mobile.toLowerCase().includes(q)
      );
    });
  }, [rows, query]);

  const exportRows = filtered.map((r) => ({
    SR: r.sr,
    "Adm No.": r.admissionNo,
    "Student Name": r.studentName,
    "Old/New": r.oldNew,
    Class: r.className,
    Sec: r.section,
    "Father's Name": r.fatherName,
    "Visibility Status": r.visibilityStatus,
    "Mobile No.": r.mobile,
    "Last Year Due": r.lastYearDue,
    "Last Year Due Paid": r.lastYearDuePaid,
    "Fee Due": r.feeDue,
    "Fee Paid": r.feePaid,
    Balance: r.balance,
  }));

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <p className="text-xs text-gray-500 leading-relaxed">
        {title} for {currentYear?.name ?? "the active academic year"} — same columns as the school
        fee paid / unpaid report (Adm No, Old/New, Class, Sec, dues, paid, balance).
        {source === "profiles" ? " Showing live feeDetails when no Excel registry is seeded." : null}
      </p>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Students</p>
          <p className="text-lg font-extrabold text-gray-900 mt-0.5">{totals.students}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Last Year Due</p>
          <p className="text-lg font-extrabold text-gray-900 mt-0.5">{formatInr(totals.lastYearDue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Fee Due</p>
          <p className="text-lg font-extrabold text-gray-900 mt-0.5">{formatInr(totals.feeDue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Fee Paid</p>
          <p className="text-lg font-extrabold text-[#144835] mt-0.5">{formatInr(totals.feePaid)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Balance</p>
          <p className="text-lg font-extrabold text-rose-600 mt-0.5">{formatInr(totals.balance)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-gray-50/60">
          <p className="text-xs font-bold text-gray-700">{title}</p>
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
              filename={list === "paid" ? "student-fee-paid" : "student-fee-unpaid"}
              className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50"
              iconSize={14}
            />
          </div>
        </div>

        <div className="overflow-auto max-h-[min(70vh,640px)]">
          <table className="w-full text-xs min-w-[1100px]">
            <thead className="sticky top-0 bg-white border-b border-gray-100">
              <tr className="text-[10px] uppercase tracking-wide text-gray-400 font-bold">
                <th className="px-3 py-2 text-left">SR</th>
                <th className="px-3 py-2 text-left">Adm No.</th>
                <th className="px-3 py-2 text-left">Student Name</th>
                <th className="px-3 py-2 text-left">Old/New</th>
                <th className="px-3 py-2 text-left">Class</th>
                <th className="px-3 py-2 text-left">Sec</th>
                <th className="px-3 py-2 text-left">Father&apos;s Name</th>
                <th className="px-3 py-2 text-left">Visibility</th>
                <th className="px-3 py-2 text-left">Mobile No.</th>
                <th className="px-3 py-2 text-right">Last Year Due</th>
                <th className="px-3 py-2 text-right">LY Due Paid</th>
                <th className="px-3 py-2 text-right">Fee Due</th>
                <th className="px-3 py-2 text-right">Fee Paid</th>
                <th className="px-3 py-2 text-right">Balance</th>
                <th className="px-3 py-2 text-right">Profile</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={15} className="px-4 py-10 text-center text-gray-400 font-semibold">
                    {loading ? `Loading ${title.toLowerCase()}…` : `No ${list} fee students found`}
                  </td>
                </tr>
              ) : (
                filtered.map((r) => <FeeRow key={`${r.list}-${r.admissionNo}-${r.sr}`} row={r} base={base} />)
              )}
            </tbody>
            {filtered.length > 0 ? (
              <tfoot className="sticky bottom-0 bg-gray-50 border-t border-gray-200">
                <tr className="text-xs font-extrabold text-gray-900">
                  <td className="px-3 py-2.5" colSpan={9}>
                    Totals ({filtered.length})
                  </td>
                  <td className="px-3 py-2.5 text-right">{formatInr(sumField(filtered, "lastYearDue"))}</td>
                  <td className="px-3 py-2.5 text-right">{formatInr(sumField(filtered, "lastYearDuePaid"))}</td>
                  <td className="px-3 py-2.5 text-right">{formatInr(sumField(filtered, "feeDue"))}</td>
                  <td className="px-3 py-2.5 text-right text-[#144835]">{formatInr(sumField(filtered, "feePaid"))}</td>
                  <td className="px-3 py-2.5 text-right text-rose-600">{formatInr(sumField(filtered, "balance"))}</td>
                  <td className="px-3 py-2.5" />
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      </div>
    </div>
  );
}

function sumField(rows: FeePaidUnpaidRow[], key: keyof FeePaidUnpaidRow): number {
  return rows.reduce((sum, row) => sum + Number(row[key] ?? 0), 0);
}

function FeeRow({ row, base }: { row: FeePaidUnpaidRow; base: string }) {
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50">
      <td className="px-3 py-2.5 text-gray-500">{row.sr}</td>
      <td className="px-3 py-2.5 font-semibold text-gray-700">{row.admissionNo}</td>
      <td className="px-3 py-2.5 font-bold text-gray-900">{row.studentName}</td>
      <td className="px-3 py-2.5 text-gray-600">{row.oldNew || "—"}</td>
      <td className="px-3 py-2.5 text-gray-600">{row.className || "—"}</td>
      <td className="px-3 py-2.5 text-gray-600">{row.section || "—"}</td>
      <td className="px-3 py-2.5 text-gray-600">{row.fatherName || "—"}</td>
      <td className="px-3 py-2.5 text-gray-600">{row.visibilityStatus || "—"}</td>
      <td className="px-3 py-2.5 text-gray-600">{row.mobile || "—"}</td>
      <td className="px-3 py-2.5 text-right text-gray-700">{formatInr(row.lastYearDue)}</td>
      <td className="px-3 py-2.5 text-right text-gray-700">{formatInr(row.lastYearDuePaid)}</td>
      <td className="px-3 py-2.5 text-right font-semibold text-gray-900">{formatInr(row.feeDue)}</td>
      <td className="px-3 py-2.5 text-right font-extrabold text-[#144835]">{formatInr(row.feePaid)}</td>
      <td className="px-3 py-2.5 text-right font-extrabold text-rose-600">{formatInr(row.balance)}</td>
      <td className="px-3 py-2.5 text-right">
        {row.studentId ? (
          <SafeLink
            href={`${base}/academic/students/${row.studentId}/profile?tab=Fees`}
            className="text-[#144835] font-bold hover:underline"
          >
            View
          </SafeLink>
        ) : (
          "—"
        )}
      </td>
    </tr>
  );
}
