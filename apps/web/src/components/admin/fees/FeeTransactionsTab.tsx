"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Columns3, RotateCw, Search, X } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import ExportButton from "@/components/ui/ExportButton";
import SelectMenu from "@/components/ui/SelectMenu";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useFeePayments, DEFAULT_TRANSACTIONS_LIMIT } from "@/hooks/useFeePayments";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import { useBranchStudents } from "@/hooks/useBranchStudents";
import { compareGrades } from "@/lib/gradeOrder";
import {
  FEE_MONTHS,
  buildExcelGroupedTxnRows,
  collectionBreakdown,
  excelShortTxnDate,
  feeMonthDateRange,
  filterReceiptsByPeriod,
  cleanTransactionId,
  formatInr,
  formatReceiptDateTime,
  matchesFeePaymentMode,
  type CollectionPeriod,
  type FeePaymentModeFilter,
  type FeeReceiptRow,
  type FeeTxnTableRow,
} from "@/lib/feeDepositUtils";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Excel "Trans. No." only — never the internal abc8-… import reference. */
function excelTransNo(row: FeeReceiptRow): string {
  return cleanTransactionId(String(row.transNo ?? row.transactionId ?? "").trim());
}

const PERIODS: { id: CollectionPeriod; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "all", label: "All Time" },
];

const MODE_OPTIONS: { id: FeePaymentModeFilter; label: string }[] = [
  { id: "all", label: "All Modes" },
  { id: "cash", label: "Cash" },
  { id: "upi", label: "UPI" },
  { id: "digital", label: "Digital (UPI/NEFT/Card)" },
  { id: "neft", label: "NEFT / Bank" },
  { id: "cheque", label: "Cheque" },
  { id: "card", label: "Card" },
];

type OptionalColumn = "time" | "remark" | "status";

const OPTIONAL_COLUMNS: { id: OptionalColumn; label: string }[] = [
  { id: "time", label: "Time" },
  { id: "remark", label: "Remark" },
  { id: "status", label: "Status" },
];

const fieldLabelClass = "text-xs font-bold text-gray-500 uppercase tracking-wider";
const fieldInputClass =
  "w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all hover:bg-gray-50";

export default function FeeTransactionsTab() {
  const schoolId = useSchoolId();
  const { years, currentYear } = useAcademicYear();
  const [yearName, setYearName] = useState<string>("");
  const [period, setPeriod] = useState<CollectionPeriod>("all");
  const [feeMonth, setFeeMonth] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [classFilter, setClassFilter] = useState<string>("");
  const [modeFilter, setModeFilter] = useState<FeePaymentModeFilter>("all");
  const [query, setQuery] = useState("");
  const [optionalCols, setOptionalCols] = useState<Set<OptionalColumn>>(new Set());
  const [columnsOpen, setColumnsOpen] = useState(false);
  const columnsRef = useRef<HTMLDivElement>(null);

  const academicYear = yearName || currentYear?.name || null;

  const dateRange = useMemo(() => {
    if (selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      return { from: selectedDate, to: selectedDate };
    }
    if (feeMonth && academicYear) {
      return feeMonthDateRange(academicYear, feeMonth);
    }
    return null;
  }, [selectedDate, feeMonth, academicYear]);

  const scopedByDate = Boolean(dateRange);
  const { receipts, loading, error, hasMore, limit } = useFeePayments(schoolId, {
    academicYear,
    dateFrom: dateRange?.from ?? null,
    dateTo: dateRange?.to ?? null,
    // Month/date scopes are small enough to load fully; otherwise keep newest N.
    limit: scopedByDate ? null : DEFAULT_TRANSACTIONS_LIMIT,
  });
  const { students } = useBranchStudents(schoolId, academicYear);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (columnsRef.current && !columnsRef.current.contains(event.target as Node)) {
        setColumnsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sortedYears = useMemo(
    () => [...years].sort((a, b) => String(b.name).localeCompare(String(a.name))),
    [years]
  );

  const studentClassByKey = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of students) {
      const label = [s.className, s.section].filter(Boolean).join(" - ") || s.className || "Unassigned";
      map.set(s.id, label);
      if (s.admissionNo) map.set(s.admissionNo.toLowerCase(), label);
    }
    return map;
  }, [students]);

  const classOptions = useMemo(() => {
    const labels = new Set<string>();
    for (const s of students) {
      const label = [s.className, s.section].filter(Boolean).join(" - ") || s.className;
      if (label) labels.add(label);
    }
    return [...labels].sort((a, b) => {
      const [classA, sectionA = ""] = a.split(" - ");
      const [classB, sectionB = ""] = b.split(" - ");
      const classCmp = compareGrades(classA, classB);
      if (classCmp !== 0) return classCmp;
      return sectionA.localeCompare(sectionB);
    });
  }, [students]);

  const yearOptions = useMemo(
    () =>
      (sortedYears.length
        ? sortedYears
        : currentYear
          ? [currentYear]
          : []
      ).map((y) => ({
        value: y.name,
        label: y.is_current ? `${y.name} (current)` : y.name,
      })),
    [sortedYears, currentYear]
  );

  const periodOptions = useMemo(
    () => PERIODS.map((p) => ({ value: p.id, label: p.label })),
    []
  );

  const monthOptions = useMemo(
    () => [{ value: "", label: "All Months" }, ...FEE_MONTHS.map((m) => ({ value: m, label: m }))],
    []
  );

  const classFilterOptions = useMemo(
    () => [{ value: "", label: "All Classes" }, ...classOptions.map((c) => ({ value: c, label: c }))],
    [classOptions]
  );

  const modeFilterOptions = useMemo(
    () => MODE_OPTIONS.map((m) => ({ value: m.id, label: m.label })),
    []
  );

  const hasActiveFilters = Boolean(
    (yearName && yearName !== currentYear?.name) ||
      period !== "all" ||
      feeMonth ||
      selectedDate ||
      classFilter ||
      modeFilter !== "all" ||
      query.trim()
  );

  const clearFilters = () => {
    setYearName("");
    setPeriod("all");
    setFeeMonth("");
    setSelectedDate("");
    setClassFilter("");
    setModeFilter("all");
    setQuery("");
  };

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

  const periodReceipts = useMemo(() => {
    // Date/month already applied server-side — don't also clip by Today/Week/Month.
    if (scopedByDate) return receipts;
    return filterReceiptsByPeriod(receipts, period, { includeCancelled: true });
  }, [receipts, period, scopedByDate]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = periodReceipts.filter((r) => {
      if (!matchesFeePaymentMode(r.mode, modeFilter)) return false;
      if (classFilter) {
        const classLabel =
          (r.studentId && studentClassByKey.get(r.studentId)) ||
          (r.admissionNo && studentClassByKey.get(r.admissionNo.toLowerCase())) ||
          "Unassigned";
        if (classLabel !== classFilter) return false;
      }
      if (!q) return true;
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
        excelTransNo(r).toLowerCase().includes(q) ||
        (r.month ?? "").toLowerCase().includes(q) ||
        particulars.toLowerCase().includes(q)
      );
    });

    return [...base].sort((a, b) => {
      const recDiff =
        Number.parseInt(String(a.receiptNo).replace(/\D/g, ""), 10) -
        Number.parseInt(String(b.receiptNo).replace(/\D/g, ""), 10);

      if (period === "all" || scopedByDate) {
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
  }, [periodReceipts, query, period, scopedByDate, modeFilter, classFilter, studentClassByKey]);

  const stats = useMemo(
    () => collectionBreakdown(filtered.filter((r) => r.status !== "Cancelled" && r.status !== "Failed")),
    [filtered]
  );

  const useExcelDateFormat = period === "all" || scopedByDate;

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
    if (period !== "all" && !scopedByDate) {
      return filtered.map((receipt) => ({ kind: "txn", key: receipt.id, receipt }));
    }
    return buildExcelGroupedTxnRows(filtered);
  }, [filtered, period, scopedByDate]);

  const exportRows = useMemo(() => {
    if (period !== "all" && !scopedByDate) {
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
          transNo: excelTransNo(r),
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
        rows.push({
          date: entry.label,
          receipt: "",
          month: "",
          student: "",
          admNo: "",
          particulars: "",
          amount: "",
          mode: "",
          transNo: "",
          collectedBy: "",
        });
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
        transNo: excelTransNo(r),
        collectedBy: r.collectedByName ?? "",
      };
      if (showTime) row.time = time;
      if (showRemark) row.remark = r.remark ?? "";
      if (showStatus) row.status = r.status;
      rows.push(row);
    }
    return rows;
  }, [filtered, tableRows, period, scopedByDate, showTime, showRemark, showStatus, useExcelDateFormat]);

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

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
          <div className="flex flex-wrap items-end gap-3 flex-1">
            <div className="flex flex-col gap-1.5 w-[calc(50%-6px)] sm:w-[130px]">
              <label className={fieldLabelClass}>Year</label>
              <SelectMenu
                value={yearName || currentYear?.name || ""}
                onChange={(value) => {
                  setYearName(value);
                  setClassFilter("");
                }}
                options={yearOptions}
                aria-label="Academic year"
              />
            </div>

            <div className="flex flex-col gap-1.5 w-[calc(50%-6px)] sm:w-[130px]">
              <label className={fieldLabelClass}>Period</label>
              <SelectMenu
                value={scopedByDate ? "all" : period}
                onChange={(value) => {
                  setPeriod(value as CollectionPeriod);
                  setFeeMonth("");
                  setSelectedDate("");
                }}
                options={periodOptions}
                aria-label="Collection period"
              />
            </div>

            <div className="flex flex-col gap-1.5 w-[calc(50%-6px)] sm:w-[120px]">
              <label className={fieldLabelClass}>Month</label>
              <SelectMenu
                value={feeMonth}
                onChange={(value) => {
                  setFeeMonth(value);
                  if (value) {
                    setSelectedDate("");
                    setPeriod("all");
                  }
                }}
                options={monthOptions}
                aria-label="Fee month"
              />
            </div>

            <div className="flex flex-col gap-1.5 w-[calc(50%-6px)] sm:w-[150px]">
              <label className={fieldLabelClass}>Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  if (e.target.value) {
                    setFeeMonth("");
                    setPeriod("all");
                  }
                }}
                className={fieldInputClass}
                aria-label="Filter by date"
              />
            </div>

            <div className="flex flex-col gap-1.5 w-[calc(50%-6px)] sm:w-[150px]">
              <label className={fieldLabelClass}>Class</label>
              <SelectMenu
                value={classFilter}
                onChange={setClassFilter}
                options={classFilterOptions}
                aria-label="Filter by class"
              />
            </div>

            <div className="flex flex-col gap-1.5 w-[calc(50%-6px)] sm:w-[160px]">
              <label className={fieldLabelClass}>Mode</label>
              <SelectMenu
                value={modeFilter}
                onChange={(value) => setModeFilter(value as FeePaymentModeFilter)}
                options={modeFilterOptions}
                aria-label="Payment mode"
              />
            </div>

          </div>

          <div className="flex flex-col gap-1.5 w-full xl:w-[320px] order-first xl:order-none">
            <label className={fieldLabelClass}>Search</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-0">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Receipt, student, admission…"
                  className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 pl-9 pr-9 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all hover:bg-gray-50"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                ) : null}
              </div>
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  title="Reset filters"
                  aria-label="Reset filters"
                  className="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50/50 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                >
                  <RotateCw size={14} />
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {hasActiveFilters ? (
          <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active filters</span>
            {yearName && yearName !== currentYear?.name ? (
              <button
                type="button"
                onClick={() => setYearName("")}
                className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Year {yearName} <X size={10} />
              </button>
            ) : null}
            {period !== "all" && !scopedByDate ? (
              <button
                type="button"
                onClick={() => setPeriod("all")}
                className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                {PERIODS.find((p) => p.id === period)?.label ?? period} <X size={10} />
              </button>
            ) : null}
            {feeMonth ? (
              <button
                type="button"
                onClick={() => setFeeMonth("")}
                className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Month {feeMonth} <X size={10} />
              </button>
            ) : null}
            {selectedDate ? (
              <button
                type="button"
                onClick={() => setSelectedDate("")}
                className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Date {selectedDate} <X size={10} />
              </button>
            ) : null}
            {classFilter ? (
              <button
                type="button"
                onClick={() => setClassFilter("")}
                className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                {classFilter} <X size={10} />
              </button>
            ) : null}
            {modeFilter !== "all" ? (
              <button
                type="button"
                onClick={() => setModeFilter("all")}
                className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                {MODE_OPTIONS.find((m) => m.id === modeFilter)?.label ?? modeFilter} <X size={10} />
              </button>
            ) : null}
            {query.trim() ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Search “{query.trim()}” <X size={10} />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-gray-50/60">
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900">Fee Transactions</p>
            <p className="text-[11px] font-semibold text-gray-500 mt-0.5">
              {loading
                ? `Loading${academicYear ? ` ${academicYear}` : ""}…`
                : `${filtered.length} transaction${filtered.length === 1 ? "" : "s"}${
                    academicYear ? ` · ${academicYear}` : ""
                  }${hasMore && limit ? ` (latest ${limit})` : ""}`}
            </p>
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
                <div className="absolute right-0 z-[9999] mt-2 w-44 rounded-xl border border-gray-100 bg-white p-2 shadow-lg ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-200">
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
            <ExportButton
              data={exportRows}
              columns={exportColumns}
              filename={`fee-transactions-${academicYear ?? "all"}-${period}`}
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
                    {loading
                      ? `Loading transactions${academicYear ? ` for ${academicYear}` : ""}…`
                      : error
                        ? "Could not load transactions"
                        : "No fee transactions found"}
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
                  const dateLabel =
                    period === "all" || scopedByDate ? excelShortTxnDate(fullDate) : fullDate;

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
                      <td
                        className="px-3 py-2.5 font-mono text-[11px] text-gray-500 max-w-[120px] truncate"
                        title={excelTransNo(r) || undefined}
                      >
                        {excelTransNo(r) || "—"}
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
