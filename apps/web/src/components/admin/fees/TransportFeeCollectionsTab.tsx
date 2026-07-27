"use client";

import { useMemo, useState } from "react";
import { Bus, Search } from "lucide-react";
import ExportButton from "@/components/ui/ExportButton";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useBranchTransportStudents } from "@/hooks/useBranchTransportStudents";
import { useFeePayments } from "@/hooks/useFeePayments";
import {
  FEE_MONTHS,
  academicMonthIndexFromCalendarMonth,
  formatInr,
  sumRowValues,
} from "@/lib/feeDepositUtils";

type PeriodFilter = "year" | (typeof FEE_MONTHS)[number];

export default function TransportFeeCollectionsTab() {
  const schoolId = useSchoolId();
  const { currentYear } = useAcademicYear();
  const yearName = currentYear?.name ?? null;
  const { usingTransport, loading: transportLoading } = useBranchTransportStudents(
    schoolId,
    yearName
  );
  const { loading: paymentsLoading } = useFeePayments(schoolId, {
    academicYear: yearName,
  });
  const currentAcademicMonth = FEE_MONTHS[academicMonthIndexFromCalendarMonth(new Date().getMonth())];
  const [period, setPeriod] = useState<PeriodFilter>("year");
  const [query, setQuery] = useState("");

  const loading = transportLoading || paymentsLoading;

  const periodOptions = useMemo(
    () => [
      { id: "year" as const, label: "Full Year" },
      ...FEE_MONTHS.map((month) => ({ id: month, label: month })),
    ],
    []
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const monthIndex =
      period === "year" ? -1 : FEE_MONTHS.indexOf(period as (typeof FEE_MONTHS)[number]);

    return usingTransport
      .filter((s) => {
        if (!q) return true;
        return (
          s.name.toLowerCase().includes(q) ||
          s.admissionNo.toLowerCase().includes(q) ||
          s.route.toLowerCase().includes(q) ||
          s.busNo.toLowerCase().includes(q) ||
          s.className.toLowerCase().includes(q)
        );
      })
      .map((s) => {
        const fees = Array.isArray(s.transportFees) ? s.transportFees : [];
        const paidFees = Array.isArray(s.transportPaidFees) ? s.transportPaidFees : [];
        const expected =
          monthIndex < 0 ? sumRowValues(fees) : Math.max(0, Number(fees[monthIndex]) || 0);
        const paid =
          monthIndex < 0
            ? typeof s.transportFeePaid === "number"
              ? Math.max(0, s.transportFeePaid)
              : sumRowValues(paidFees)
            : Math.max(0, Number(paidFees[monthIndex]) || 0);
        const balance =
          monthIndex < 0 && typeof s.transportFeeBalance === "number"
            ? Math.max(0, s.transportFeeBalance)
            : Math.max(0, expected - paid);

        return {
          id: s.id,
          admissionNo: s.admissionNo,
          name: s.name,
          classLabel: [s.className, s.section].filter(Boolean).join(" - "),
          route: s.route,
          busNo: s.busNo,
          stoppage: s.stoppage,
          expected,
          paid,
          balance,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [usingTransport, period, query]);

  const totals = useMemo(
    () => ({
      students: rows.length,
      expected: rows.reduce((s, r) => s + r.expected, 0),
      paid: rows.reduce((s, r) => s + r.paid, 0),
      collected: rows.reduce((s, r) => s + r.paid, 0),
    }),
    [rows]
  );

  const exportRows = rows.map((r) => ({
    Year: yearName ?? "",
    Period: period === "year" ? "Full Year" : period,
    "Adm No": r.admissionNo,
    Student: r.name,
    Class: r.classLabel,
    Route: r.route,
    Bus: r.busNo,
    Stoppage: r.stoppage,
    "Transport Due": r.expected,
    Collected: r.paid,
    Balance: r.balance,
  }));

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 flex items-center gap-1">
            <Bus size={12} /> Transport Students
          </p>
          <p className="text-lg font-extrabold text-gray-900 mt-0.5">{totals.students}</p>
          <p className="text-[10px] font-semibold text-gray-400 mt-1">
            {yearName ? `Year ${yearName}` : "Select academic year"}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Transport Due</p>
          <p className="text-lg font-extrabold text-gray-900 mt-0.5">{formatInr(totals.expected)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Collected</p>
          <p className="text-lg font-extrabold text-[#144835] mt-0.5">{formatInr(totals.collected)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Balance</p>
          <p className="text-lg font-extrabold text-rose-600 mt-0.5">
            {formatInr(Math.max(0, totals.expected - totals.paid))}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-gray-50/60">
          <div className="flex flex-wrap gap-1.5 max-w-full">
            {periodOptions.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                  period === p.id
                    ? "bg-[#144835] text-white"
                    : p.id === currentAcademicMonth
                      ? "text-[#144835] bg-[#144835]/10 hover:bg-[#144835]/15"
                      : "text-gray-500 hover:bg-gray-100"
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
                placeholder="Search bus, route, student…"
                className="h-8 w-56 pl-8 pr-3 rounded-lg border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#144835]/20"
              />
            </div>
            <ExportButton
              data={exportRows}
              filename={`transport-fee-${yearName ?? "year"}-${period === "year" ? "full" : period}`}
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
                <th className="px-3 py-2 text-left">Route</th>
                <th className="px-3 py-2 text-left">Bus</th>
                <th className="px-3 py-2 text-left">Stoppage</th>
                <th className="px-3 py-2 text-right">Transport Due</th>
                <th className="px-3 py-2 text-right">Collected</th>
                <th className="px-3 py-2 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-gray-400 font-semibold">
                    {loading
                      ? `Loading transport fee data for ${yearName ?? "selected year"}…`
                      : `No transport students found for ${yearName ?? "this year"}`}
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={`${yearName}-${r.id}`} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-3 py-2.5 font-semibold text-gray-700">{r.admissionNo}</td>
                    <td className="px-3 py-2.5 font-bold text-gray-900">{r.name}</td>
                    <td className="px-3 py-2.5 text-gray-600">{r.classLabel || "—"}</td>
                    <td className="px-3 py-2.5 text-gray-600 max-w-[120px] truncate">{r.route}</td>
                    <td className="px-3 py-2.5 text-gray-600">{r.busNo}</td>
                    <td className="px-3 py-2.5 text-gray-600 max-w-[140px] truncate">{r.stoppage}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-gray-800">
                      {formatInr(r.expected)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-extrabold text-[#144835]">
                      {formatInr(r.paid)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-rose-600">
                      {formatInr(r.balance)}
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
