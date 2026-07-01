"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Columns3, Search } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import ExportButton from "@/components/ui/ExportButton";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useFeePayments } from "@/hooks/useFeePayments";
import {
  buildExcelGroupedTxnRows,
  collectionBreakdown,
  excelShortTxnDate,
  filterReceiptsByPeriod,
  formatInr,
  formatReceiptDateTime,
  type CollectionPeriod,
  type FeeTxnTableRow,
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

type OptionalColumn = "time" | "remark" | "status";

const OPTIONAL_COLUMNS: { id: OptionalColumn; label: string }[] = [
  { id: "time", label: "Time" },
  { id: "remark", label: "Remark" },
  { id: "status", label: "Status" },
];

export default function FeeTransactionsTab() {
  const schoolId = useSchoolId();
  const { receipts, loading, error } = useFeePayments(schoolId);
  const [period, setPeriod] = useState<CollectionPeriod>("all");
  const [query, setQuery] = useState("");
  const [optionalCols, setOptionalCols] = useState<Set<OptionalColumn>>(new Set());
  const [columnsOpen, setColumnsOpen] = useState(false);
  const columnsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (columnsRef.current && !columnsRef.current.contains(event.target as Node)) {
        setColumnsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showTime = optionalCols.has("time");
  const showRemark = optionalCols.has("remark");
  const showStatus = optionalCols.has("status");

  const toggleOptionalCol = (id: OptionalColumn) => {
    setOptionalCols((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const periodReceipts = useMemo(
    () => filterReceiptsByPeriod(receipts, period, { includeCancelled: true }),
    [receipts, period]
  );

  const stats = useMemo(
    () => collectionBreakdown(periodReceipts.filter((r) => r.status !== "Cancelled" && r.status !== "Failed")),
    [periodReceipts]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = [...periodReceipts].sort((a, b) => {
      const recDiff =
        Number.parseInt(String(a.receiptNo).replace(/\D/g, ""), 10) -
        Number.parseInt(String(b.receiptNo).replace(/\D/g, ""), 10);

      if (period === "all") {
        const dateDiff = String(a.date).localeCompare(String(b.date));
        if (dateDiff !== 0) return dateDiff;
        return recDiff;
      }

      const dateDiff = String(b.date).localeCompare(String(a.date));
      if (dateDiff !== 0) return dateDiff;
      return (
        Number.parseInt(String(b.receiptNo).replace(/\D/g, ""), 10) -
        Number.parseInt(String(a.receiptNo).replace(/\D/g, ""), 10)
      );
    });
    if (!q) return base;
    return base.filter((r) => {
      const particulars = (r.lineItems ?? [])
        .map((item) => String(item.particular ?? ""))
        .join(" ");
      return (
        r.receiptNo.toLowerCase().includes(q) ||
        (r.studentName ?? "").toLowerCase().includes(q) ||
        (r.admissionNo ?? "").toLowerCase().includes(q) ||
        (r.collectedByName ?? "").toLowerCase().includes(q) ||
        r.mode.toLowerCase().includes(q) ||
        (r.remark ?? "").toLowerCase().includes(q) ||
        (r.reference ?? "").toLowerCase().includes(q) ||
        particulars.toLowerCase().includes(q)
      );
    });
  }, [periodReceipts, query, period]);

  const useExcelDateFormat = period === "all";

  function receiptDateTime(row: (typeof filtered)[number]) {
    return formatReceiptDateTime(row, { excelStyle: useExcelDateFormat });
  }

  function lineItemsSummary(row: (typeof filtered)[number]): string {
    if (!row.lineItems?.length) return row.particular ?? "—";
    return row.lineItems
      .map((item) => `${item.particular ?? "Fee"} ₹${Number(item.amount ?? 0).toLocaleString("en-IN")}`)
      .join(" · ");
  }

  const exportColumns = useMemo(() => {
    const cols = [
      { header: "Date", key: "date" },
      ...(showTime ? [{ header: "Time", key: "time" }] : []),
      { header: "Receipt", key: "receipt" },
      { header: "Month", key: "month" },
      { header: "Student", key: "student" },
      { header: "Adm No", key: "admNo" },
      { header: "Particulars", key: "particulars" },
      { header: "Amount", key: "amount" },
      { header: "Mode", key: "mode" },
      { header: "Trans. No.", key: "transNo" },
      { header: "Collected By", key: "collectedBy" },
      ...(showRemark ? [{ header: "Remark", key: "remark" }] : []),
      ...(showStatus ? [{ header: "Status", key: "status" }] : []),
    ];
    return cols;
  }, [showTime, showRemark, showStatus]);

  const tableRows = useMemo((): FeeTxnTableRow[] => {
    if (period !== "all") {
      return filtered.map((receipt) => ({ kind: "txn", key: receipt.id, receipt }));
    }
    return buildExcelGroupedTxnRows(filtered);
  }, [filtered, period]);

  const exportRows = useMemo(() => {
    if (period !== "all") {
      return filtered.map((r) => {
        const { date, time } = receiptDateTime(r);
        const row: Record<string, string | number> = {
          date,
          receipt: r.receiptNo,
          month: r.month,
          student: r.studentName ?? "",
          admNo: r.admissionNo ?? "",
          particulars: lineItemsSummary(r),
          amount: r.amount,
          mode: r.mode,
          transNo: r.reference ?? "",
          collectedBy: r.collectedByName ?? "",
        };
        if (showTime) row.time = time;
        if (showRemark) row.remark = r.remark ?? "";
        if (showStatus) row.status = r.status;
        return row;
      });
    }

    const rows: Record<string, string | number>[] = [];
    for (const entry of tableRows) {
      if (entry.kind === "date-header") {
        rows.push({ date: entry.label, receipt: "", month: "", student: "", admNo: "", particulars: "", amount: "", mode: "", transNo: "", collectedBy: "" });
        continue;
      }
      if (entry.kind === "date-summary") {
        rows.push({
          date: `(RECEIPT COUNT : ${entry.count} ) Total ( Date : ${entry.label} )`,
          receipt: "",
          month: "",
          student: "",
          admNo: "",
          particulars: "",
          amount: entry.total,
          mode: "",
          transNo: "",
          collectedBy: "",
        });
        continue;
      }
      if (entry.kind === "mode-label") {
        rows.push({
          date: entry.label,
          receipt: "",
          month: "",
          student: "",
          admNo: "",
          particulars: `${entry.count} receipt${entry.count === 1 ? "" : "s"}`,
          amount: entry.amount,
          mode: entry.label,
          transNo: "",
          collectedBy: "",
        });
        continue;
      }

      const r = entry.receipt;
      const { date: fullDate, time } = receiptDateTime(r);
      const row: Record<string, string | number> = {
        date: excelShortTxnDate(fullDate),
        receipt: r.receiptNo,
        month: r.month,
        student: r.studentName ?? "",
        admNo: r.admissionNo ?? "",
        particulars: lineItemsSummary(r),
        amount: r.amount,
        mode: r.mode,
        transNo: r.reference ?? "",
        collectedBy: r.collectedByName ?? "",
      };
      if (showTime) row.time = time;
      if (showRemark) row.remark = r.remark ?? "";
      if (showStatus) row.status = r.status;
      rows.push(row);
    }
    return rows;
  }, [filtered, tableRows, period, showTime, showRemark, showStatus, useExcelDateFormat]);

  const columnCount = 10 + (showTime ? 1 : 0) + (showRemark ? 1 : 0) + (showStatus ? 1 : 0);
  const colsBeforeAmount = 6 + (showTime ? 1 : 0);
  const colsAfterAmount = columnCount - colsBeforeAmount - 1;

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
          {error}
        </div>
      ) : null}
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
          <div className="flex flex-wrap items-center gap-2">
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
            <span className="text-[11px] font-bold text-gray-500">
              {loading ? "Loading…" : `${filtered.length} transaction${filtered.length === 1 ? "" : "s"}`}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative" ref={columnsRef}>
              <button
                type="button"
                onClick={() => setColumnsOpen((open) => !open)}
                className={cn(
                  "h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-bold shadow-sm transition-colors whitespace-nowrap",
                  columnsOpen || optionalCols.size > 0
                    ? "border-[#144835]/30 bg-[#144835]/5 text-[#144835]"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                )}
              >
                <Columns3 size={14} />
                Columns
                {optionalCols.size > 0 ? (
                  <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#144835] px-1 text-[9px] font-extrabold text-white">
                    {optionalCols.size}
                  </span>
                ) : null}
                <ChevronDown size={14} className={cn("transition-transform", columnsOpen && "rotate-180")} />
              </button>
              {columnsOpen ? (
                <div className="absolute left-0 z-[9999] mt-2 w-44 rounded-xl border border-gray-100 bg-white p-2 shadow-lg ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                    Show columns
                  </p>
                  {OPTIONAL_COLUMNS.map((col) => (
                    <label
                      key={col.id}
                      className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={optionalCols.has(col.id)}
                        onChange={() => toggleOptionalCol(col.id)}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-[#144835] focus:ring-[#144835]/30"
                      />
                      {col.label}
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search transactions…"
                className="h-9 w-56 pl-8 pr-3 rounded-lg border border-gray-200 bg-white text-xs font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-[#144835]/20"
              />
            </div>
            <ExportButton
              data={exportRows}
              columns={exportColumns}
              filename={`fee-transactions-${period}`}
            />
          </div>
        </div>
        <div className="overflow-auto max-h-[min(70vh,640px)]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-white border-b border-gray-100">
              <tr className="text-[10px] uppercase tracking-wide text-gray-400 font-bold">
                <th className="px-3 py-2 text-left">Date</th>
                {showTime ? <th className="px-3 py-2 text-left">Time</th> : null}
                <th className="px-3 py-2 text-left">Receipt</th>
                <th className="px-3 py-2 text-left">Student</th>
                <th className="px-3 py-2 text-left">Adm No</th>
                <th className="px-3 py-2 text-left">Month</th>
                <th className="px-3 py-2 text-left">Particulars</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2 text-left">Mode</th>
                <th className="px-3 py-2 text-left">Trans. No.</th>
                <th className="px-3 py-2 text-left">Collected By</th>
                {showRemark ? <th className="px-3 py-2 text-left">Remark</th> : null}
                {showStatus ? <th className="px-3 py-2 text-left">Status</th> : null}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={columnCount} className="px-4 py-10 text-center text-gray-400 font-semibold">
                    {loading ? "Loading transactions…" : "No fee transactions found"}
                  </td>
                </tr>
              ) : (
                tableRows.map((entry) => {
                  if (entry.kind === "date-header") {
                    return (
                      <tr key={entry.key} className="bg-[#144835]/8 border-y border-[#144835]/15">
                        <td
                          colSpan={columnCount}
                          className="px-3 py-2 text-[13px] font-extrabold text-[#144835] tracking-wide"
                        >
                          {entry.label}
                        </td>
                      </tr>
                    );
                  }

                  if (entry.kind === "date-summary") {
                    return (
                      <tr key={entry.key} className="bg-gray-100/90 border-b border-gray-200">
                        <td
                          colSpan={colsBeforeAmount}
                          className="px-3 py-2 text-[11px] font-extrabold text-gray-800"
                        >
                          (RECEIPT COUNT : {entry.count} ) Total ( Date : {entry.label} )
                        </td>
                        <td className="px-3 py-2 text-right font-extrabold text-[#144835]">
                          {formatInr(entry.total)}
                        </td>
                        <td colSpan={colsAfterAmount} />
                      </tr>
                    );
                  }

                  if (entry.kind === "mode-label") {
                    return (
                      <tr key={entry.key} className="border-b border-gray-100 bg-gray-50/40">
                        <td
                          colSpan={colsBeforeAmount}
                          className="px-3 py-1.5 text-[11px] font-bold text-gray-600 uppercase tracking-wide"
                        >
                          {entry.label}
                          <span className="ml-2 normal-case font-semibold text-gray-400">
                            ({entry.count} receipt{entry.count === 1 ? "" : "s"})
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-right font-extrabold text-gray-800">
                          {formatInr(entry.amount)}
                        </td>
                        <td colSpan={colsAfterAmount} />
                      </tr>
                    );
                  }

                  const r = entry.receipt;
                  const { date: fullDate, time } = receiptDateTime(r);
                  const dateLabel = period === "all" ? excelShortTxnDate(fullDate) : fullDate;

                  return (
                    <tr key={entry.key} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-3 py-2.5 text-gray-600 font-semibold">{dateLabel}</td>
                      {showTime ? (
                        <td className="px-3 py-2.5 text-gray-500 font-medium">{time}</td>
                      ) : null}
                      <td className="px-3 py-2.5 font-bold text-gray-800">{r.receiptNo}</td>
                      <td className="px-3 py-2.5 font-semibold text-gray-800 max-w-[160px] truncate">
                        {r.studentName ?? "—"}
                      </td>
                      <td className="px-3 py-2.5 text-gray-600">{r.admissionNo ?? "—"}</td>
                      <td className="px-3 py-2.5 text-gray-600">{r.month}</td>
                      <td className="px-3 py-2.5 text-gray-600 max-w-[200px] truncate" title={lineItemsSummary(r)}>
                        {lineItemsSummary(r)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-extrabold text-[#144835]">
                        {formatInr(r.amount)}
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-gray-600">{r.mode}</td>
                      <td className="px-3 py-2.5 font-mono text-[11px] text-gray-500 max-w-[120px] truncate">
                        {r.reference || "—"}
                      </td>
                      <td className="px-3 py-2.5 text-gray-700">{r.collectedByName ?? "—"}</td>
                      {showRemark ? (
                        <td className="px-3 py-2.5 text-gray-500 max-w-[140px] truncate">{r.remark ?? "—"}</td>
                      ) : null}
                      {showStatus ? (
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
                      ) : null}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
