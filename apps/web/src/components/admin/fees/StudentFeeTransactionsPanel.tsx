"use client";

import { useMemo } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useFeePayments } from "@/hooks/useFeePayments";
import { extractFeeTransactions } from "@/lib/studentFeeResolver";
import {
  cleanTransactionId,
  formatInr,
  formatReceiptDateTime,
  type FeeReceiptRow,
} from "@/lib/feeDepositUtils";

/** Excel "Trans. No." only — never the internal abc8-… import reference. */
function excelTransNo(row: FeeReceiptRow): string {
  return cleanTransactionId(String(row.transNo ?? row.transactionId ?? "").trim());
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function lineItemsSummary(row: FeeReceiptRow): string {
  if (!row.lineItems?.length) return row.particular ?? "—";
  return row.lineItems
    .map((item) => `${item.particular ?? "Fee"} ₹${Number(item.amount ?? 0).toLocaleString("en-IN")}`)
    .join(" · ");
}

function sortReceipts(rows: FeeReceiptRow[]): FeeReceiptRow[] {
  return [...rows].sort((a, b) => {
    const recDiff =
      Number.parseInt(String(a.receiptNo).replace(/\D/g, ""), 10) -
      Number.parseInt(String(b.receiptNo).replace(/\D/g, ""), 10);
    if (recDiff !== 0) return recDiff;
    return String(b.date).localeCompare(String(a.date));
  });
}

type Props = {
  student: Record<string, unknown> | null | undefined;
};

export default function StudentFeeTransactionsPanel({ student }: Props) {
  const schoolId = useSchoolId();
  const studentId = String(student?.id ?? "").trim() || null;
  const admissionNo =
    String(student?.admissionNo ?? student?.admission_number ?? "").trim() || null;
  const { receipts, loading } = useFeePayments(schoolId, {
    studentId,
    admissionNo: studentId ? null : admissionNo,
    enabled: Boolean(studentId || admissionNo),
    requireAcademicYear: false,
    limit: null,
  });

  const rows = useMemo(() => {
    if (!student) return [];

    const sid = String(student.id ?? "");
    const adm = String(student.admissionNo ?? student.admission_number ?? "").toLowerCase();
    const name = String(student.name ?? student.studentName ?? "").toLowerCase();

    const fromPayments = receipts.filter(
      (r) =>
        (sid && r.studentId === sid) ||
        (adm && r.admissionNo?.toLowerCase() === adm) ||
        (name && r.studentName?.toLowerCase() === name)
    );

    const fromProfile = extractFeeTransactions(student, {
      id: sid,
      admissionNo: String(student.admissionNo ?? student.admission_number ?? ""),
      name: String(student.name ?? student.studentName ?? ""),
    });

    const seen = new Set<string>();
    return sortReceipts(
      [...fromPayments, ...fromProfile].filter((r) => {
        // Prefer stable payment id — profile embeds + notice store often share the same id
        // but differ slightly on reference/remark, which used to leak duplicates into the table.
        const id = String(r.id ?? "").trim();
        const key = id
          ? `id:${id}`
          : `${r.receiptNo}|${r.date}|${r.amount}|${r.reference ?? ""}|${r.particular ?? ""}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
    );
  }, [student, receipts]);

  const totalPaid = rows
    .filter((r) => r.status === "Completed")
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 flex flex-wrap items-center justify-between gap-3 bg-gray-50/50">
        <div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Fee Transactions</h3>
          <p className="text-[11px] font-semibold text-gray-500 mt-0.5">
            {rows.length} receipt{rows.length === 1 ? "" : "s"} · Paid{" "}
            <span className="text-emerald-700">{formatInr(totalPaid)}</span>
          </p>
        </div>
      </div>

      <div className="overflow-auto max-h-[min(50vh,480px)]">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-white border-b border-gray-100">
            <tr className="text-[10px] uppercase tracking-wide text-gray-400 font-bold">
              <th className="px-3 py-2 text-left">Receipt</th>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Time</th>
              <th className="px-3 py-2 text-left">Month</th>
              <th className="px-3 py-2 text-left">Particulars</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2 text-left">Mode</th>
              <th className="px-3 py-2 text-left">Trans. No.</th>
              <th className="px-3 py-2 text-left">Collected By</th>
              <th className="px-3 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-400 font-semibold">
                  {loading ? "Loading transactions…" : "No fee transactions recorded"}
                </td>
              </tr>
            ) : (
              rows.map((r, idx) => {
                const { date, time } = formatReceiptDateTime(r);
                return (
                <tr
                  key={r.id ? `${r.id}:${idx}` : `tx-${r.receiptNo}-${r.date}-${idx}`}
                  className="border-b border-gray-50 hover:bg-gray-50/50"
                >
                  <td className="px-3 py-2.5 font-bold text-gray-800">{r.receiptNo}</td>
                  <td className="px-3 py-2.5 text-gray-600">{date}</td>
                  <td className="px-3 py-2.5 text-gray-500">{time}</td>
                  <td className="px-3 py-2.5 text-gray-600">{r.month}</td>
                  <td className="px-3 py-2.5 text-gray-600 max-w-[220px] truncate" title={lineItemsSummary(r)}>
                    {lineItemsSummary(r)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-extrabold text-[#144835]">{formatInr(r.amount)}</td>
                  <td className="px-3 py-2.5 font-semibold text-gray-600">{r.mode}</td>
                  <td
                    className="px-3 py-2.5 font-mono text-[11px] text-gray-500 max-w-[120px] truncate"
                    title={excelTransNo(r) || undefined}
                  >
                    {excelTransNo(r) || "—"}
                  </td>
                  <td className="px-3 py-2.5 text-gray-700">{r.collectedByName ?? "—"}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={cn(
                        "inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold",
                        r.status === "Cancelled"
                          ? "bg-rose-50 text-rose-700"
                          : r.status === "Completed"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-600"
                      )}
                    >
                      {r.status || "Completed"}
                    </span>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

}
