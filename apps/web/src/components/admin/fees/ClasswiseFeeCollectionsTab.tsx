"use client";

import { useMemo, useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import ExportButton from "@/components/ui/ExportButton";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useBranchStudents } from "@/hooks/useBranchStudents";
import { useFeePayments } from "@/hooks/useFeePayments";
import {
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

export default function ClasswiseFeeCollectionsTab() {
  const schoolId = useSchoolId();
  const { currentYear } = useAcademicYear();
  const { students, loading: studentsLoading } = useBranchStudents(schoolId, currentYear?.name);
  const { receipts, loading: paymentsLoading } = useFeePayments(schoolId);
  const [period, setPeriod] = useState<CollectionPeriod>("month");

  const loading = studentsLoading || paymentsLoading;

  const studentClassByKey = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of students) {
      const label = [s.className, s.section].filter(Boolean).join(" - ");
      map.set(s.id, label || s.className);
      if (s.admissionNo) map.set(s.admissionNo.toLowerCase(), label || s.className);
    }
    return map;
  }, [students]);

  const periodReceipts = useMemo(
    () => filterReceiptsByPeriod(receipts, period),
    [receipts, period]
  );

  const classRows = useMemo(() => {
    const byClass = new Map<
      string,
      { classLabel: string; students: Set<string>; collected: number; receipts: number }
    >();

    for (const s of students) {
      const label = [s.className, s.section].filter(Boolean).join(" - ") || "Unassigned";
      if (!byClass.has(label)) {
        byClass.set(label, { classLabel: label, students: new Set(), collected: 0, receipts: 0 });
      }
      byClass.get(label)!.students.add(s.id);
    }

    for (const r of periodReceipts) {
      const classLabel =
        (r.studentId && studentClassByKey.get(r.studentId)) ||
        (r.admissionNo && studentClassByKey.get(r.admissionNo.toLowerCase())) ||
        "Unassigned";
      if (!byClass.has(classLabel)) {
        byClass.set(classLabel, { classLabel, students: new Set(), collected: 0, receipts: 0 });
      }
      const row = byClass.get(classLabel)!;
      row.collected += r.amount;
      row.receipts += 1;
    }

    return [...byClass.values()]
      .map((row) => ({
        classLabel: row.classLabel,
        studentCount: row.students.size,
        collected: row.collected,
        receipts: row.receipts,
      }))
      .sort((a, b) => a.classLabel.localeCompare(b.classLabel));
  }, [students, periodReceipts, studentClassByKey]);

  const totals = useMemo(
    () => ({
      collected: classRows.reduce((s, r) => s + r.collected, 0),
      receipts: classRows.reduce((s, r) => s + r.receipts, 0),
    }),
    [classRows]
  );

  const exportRows = classRows.map((r) => ({
    Class: r.classLabel,
    Students: r.studentCount,
    Collected: r.collected,
    Receipts: r.receipts,
  }));

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Classes</p>
          <p className="text-lg font-extrabold text-gray-900 mt-0.5">{classRows.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Total Collected</p>
          <p className="text-lg font-extrabold text-[#144835] mt-0.5">{formatInr(totals.collected)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Receipts</p>
          <p className="text-lg font-extrabold text-gray-900 mt-0.5">{totals.receipts}</p>
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
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                  period === p.id ? "bg-[#144835] text-white" : "text-gray-500 hover:bg-gray-100"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <ExportButton
            data={exportRows}
            filename={`classwise-fee-collections-${period}`}
            className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50"
            iconSize={14}
          />
        </div>
        <div className="overflow-auto max-h-[min(70vh,640px)]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-white border-b border-gray-100">
              <tr className="text-[10px] uppercase tracking-wide text-gray-400 font-bold">
                <th className="px-3 py-2 text-left">Class</th>
                <th className="px-3 py-2 text-right">Students</th>
                <th className="px-3 py-2 text-right">Receipts</th>
                <th className="px-3 py-2 text-right">Collected</th>
              </tr>
            </thead>
            <tbody>
              {classRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-gray-400 font-semibold">
                    {loading ? "Loading classwise collections…" : "No collections in this period"}
                  </td>
                </tr>
              ) : (
                classRows.map((r) => (
                  <tr key={r.classLabel} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-3 py-2.5 font-bold text-gray-900">{r.classLabel}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-gray-700">{r.studentCount}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-gray-700">{r.receipts}</td>
                    <td className="px-3 py-2.5 text-right font-extrabold text-[#144835]">
                      {formatInr(r.collected)}
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
