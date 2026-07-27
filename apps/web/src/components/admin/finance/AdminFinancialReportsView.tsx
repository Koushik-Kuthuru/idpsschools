"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  AlertCircle,
  CalendarRange,
  ChevronRight,
  Landmark,
  Receipt,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Wallet,
  FileText,
  type LucideIcon,
} from "lucide-react";
import AdminPageHeader from "@/components/admin/PageHeader";
import ExportButton from "@/components/ui/ExportButton";
import { useBranch } from "@/components/admin/BranchContext";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import { adminFetch } from "@/lib/adminApi";
import { datesFromYearName } from "@/lib/branchAcademicYears";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ReportKey = "pnl" | "balance" | "cashflow" | "fees" | "expenses" | "tax";

const reports: { key: ReportKey; label: string; icon: LucideIcon; desc: string }[] = [
  { key: "pnl", label: "Income Statement", icon: FileText, desc: "Revenue vs expenses" },
  { key: "balance", label: "Balance Sheet", icon: Landmark, desc: "Assets & liabilities" },
  { key: "cashflow", label: "Cash Flow", icon: Wallet, desc: "Inflow & outflow" },
  { key: "fees", label: "Fee Collections", icon: Receipt, desc: "Student payments" },
  { key: "expenses", label: "Expense Report", icon: TrendingDown, desc: "Operating costs" },
  { key: "tax", label: "Tax & Compliance", icon: ShieldCheck, desc: "GST, TDS, etc." },
];

type FeePaymentRow = {
  id: string;
  amount: number;
  mode: string;
  status: string;
  chequeStatus?: string;
  academicYear?: string;
  date?: string;
  feeMonth?: string;
  studentName?: string;
  admissionNo?: string;
  receiptNo?: string;
  className?: string;
};

type ExpenseRow = {
  id: string;
  amount: number;
  date: string;
  category?: string;
  title?: string;
};

/** Reject corrupted AccEvate amount blobs (e.g. 1.3e14) from report totals. */
const MAX_SANE_PAYMENT = 5_000_000;

function parseAmount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 0 && value <= MAX_SANE_PAYMENT ? value : 0;
  }
  const raw = String(value ?? "")
    .replace(/[₹,\s]/g, "")
    .trim();
  if (!raw) return 0;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0 || n > MAX_SANE_PAYMENT) return 0;
  return n;
}

function isCollectedPayment(p: FeePaymentRow): boolean {
  const status = String(p.status ?? "").toLowerCase();
  if (status === "cancelled" || status === "failed" || status === "bounced") return false;
  const cheque = String(p.chequeStatus ?? "").toLowerCase();
  if (cheque === "bounced") return false;
  return parseAmount(p.amount) > 0;
}

function formatInr(n: number, opts?: { compact?: boolean }) {
  return Math.round(n).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    ...(opts?.compact ? { notation: "compact" as const } : {}),
  });
}

function inDateRange(iso: string | undefined, from: string, to: string): boolean {
  const d = String(iso ?? "").slice(0, 10);
  if (!d) return true; // keep undated rows when filtering by academic year field
  return d >= from && d <= to;
}

function monthKeyFromPayment(p: FeePaymentRow): string {
  const feeMonth = String(p.feeMonth ?? "").trim();
  if (feeMonth) return feeMonth.toUpperCase();
  const d = String(p.date ?? "").slice(0, 10);
  if (!d) return "Unknown";
  const dt = new Date(`${d}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return "Unknown";
  return dt.toLocaleString("en-IN", { month: "short" }).toUpperCase();
}

export default function AdminFinancialReportsView() {
  const { activeBranch } = useBranch();
  const schoolId = useSchoolId();
  const { currentYear, loading: yearLoading } = useAcademicYear();
  const academicYear = currentYear?.name ?? null;

  const [activeReport, setActiveReport] = useState<ReportKey>("pnl");
  const [range, setRange] = useState<"full" | "this-month" | "last-30" | "quarter">("full");
  const [payments, setPayments] = useState<FeePaymentRow[]>([]);
  const [expensesList, setExpensesList] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const yearBounds = useMemo(() => {
    if (!academicYear) return null;
    return datesFromYearName(academicYear);
  }, [academicYear]);

  const periodBounds = useMemo(() => {
    if (!yearBounds) return null;
    const today = new Date();
    const todayIso = today.toISOString().slice(0, 10);
    if (range === "full") return yearBounds;

    if (range === "this-month") {
      const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);
      return {
        start_date: start < yearBounds.start_date ? yearBounds.start_date : start,
        end_date: end > yearBounds.end_date ? yearBounds.end_date : end,
      };
    }

    if (range === "last-30") {
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 30);
      const start = startDate.toISOString().slice(0, 10);
      return {
        start_date: start < yearBounds.start_date ? yearBounds.start_date : start,
        end_date: todayIso > yearBounds.end_date ? yearBounds.end_date : todayIso,
      };
    }

    // quarter: current calendar quarter clipped to academic year
    const q = Math.floor(today.getMonth() / 3);
    const start = new Date(today.getFullYear(), q * 3, 1).toISOString().slice(0, 10);
    const end = new Date(today.getFullYear(), q * 3 + 3, 0).toISOString().slice(0, 10);
    return {
      start_date: start < yearBounds.start_date ? yearBounds.start_date : start,
      end_date: end > yearBounds.end_date ? yearBounds.end_date : end,
    };
  }, [range, yearBounds]);

  const loadData = useCallback(async () => {
    if (!schoolId || !academicYear) return;
    setLoading(true);
    setError(null);
    try {
      const payParams = new URLSearchParams({ schoolId, academicYear });
      const expParams = new URLSearchParams({ schoolId });
      const [payRes, expRes] = await Promise.all([
        adminFetch(`/api/admin/fee-payments?${payParams.toString()}`),
        adminFetch(`/api/admin/expenses?${expParams.toString()}`),
      ]);
      const payBody = await payRes.json().catch(() => ({}));
      const expBody = await expRes.json().catch(() => ({}));
      if (!payRes.ok) throw new Error(payBody.error || "Failed to load fee payments");

      const payRows = (Array.isArray(payBody.payments) ? payBody.payments : []).map(
        (p: Record<string, unknown>) => ({
          id: String(p.id ?? ""),
          amount: parseAmount(p.amount),
          mode: String(p.mode ?? "Other").trim() || "Other",
          status: String(p.status ?? "Completed"),
          chequeStatus: p.chequeStatus ? String(p.chequeStatus) : undefined,
          academicYear: p.academicYear ? String(p.academicYear) : academicYear,
          date: p.date ? String(p.date).slice(0, 10) : undefined,
          feeMonth: p.feeMonth ? String(p.feeMonth) : p.month ? String(p.month) : undefined,
          studentName: p.studentName ? String(p.studentName) : undefined,
          admissionNo: p.admissionNo ? String(p.admissionNo) : undefined,
          receiptNo: p.receiptNo ? String(p.receiptNo) : undefined,
          className: p.className ? String(p.className) : p.class ? String(p.class) : undefined,
        })
      ) as FeePaymentRow[];

      setPayments(payRows);
      setExpensesList(
        (Array.isArray(expBody.expenses) ? expBody.expenses : []).map((e: Record<string, unknown>) => ({
          id: String(e.id ?? ""),
          amount: parseAmount(e.amount),
          date: String(e.date ?? "").slice(0, 10),
          category: e.category ? String(e.category) : e.type ? String(e.type) : "Operating",
          title: e.title ? String(e.title) : e.description ? String(e.description) : undefined,
        }))
      );
    } catch (err) {
      console.error("Error loading financial data", err);
      setError(err instanceof Error ? err.message : "Failed to load financial data");
      setPayments([]);
      setExpensesList([]);
    } finally {
      setLoading(false);
    }
  }, [schoolId, academicYear]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const collectedPayments = useMemo(() => {
    if (!periodBounds) return [];
    return payments.filter(
      (p) =>
        isCollectedPayment(p) &&
        (range === "full" || inDateRange(p.date, periodBounds.start_date, periodBounds.end_date))
    );
  }, [payments, periodBounds, range]);

  const periodExpenses = useMemo(() => {
    if (!periodBounds) return [];
    return expensesList.filter((e) =>
      inDateRange(e.date, periodBounds.start_date, periodBounds.end_date)
    );
  }, [expensesList, periodBounds]);

  const pnl = useMemo(() => {
    const totalIncomeValue = collectedPayments.reduce((sum, p) => sum + p.amount, 0);
    const income = [{ label: "Fee Collections", value: totalIncomeValue }];

    const byCategory = new Map<string, number>();
    for (const e of periodExpenses) {
      const key = e.category || "Operating Expenses";
      byCategory.set(key, (byCategory.get(key) || 0) + e.amount);
    }
    const expenses =
      byCategory.size > 0
        ? [...byCategory.entries()].map(([label, value]) => ({ label, value }))
        : [
            { label: "Salaries", value: 0 },
            { label: "Operating Expenses", value: 0 },
          ];

    const totalIncome = totalIncomeValue;
    const totalExpense = expenses.reduce((s, e) => s + e.value, 0);
    const net = totalIncome - totalExpense;
    const margin = totalIncome === 0 ? 0 : Math.round((net / totalIncome) * 1000) / 10;
    return {
      income,
      expenses,
      totalIncome,
      totalExpense,
      net,
      margin,
      receiptCount: collectedPayments.length,
    };
  }, [collectedPayments, periodExpenses]);

  const balanceSheet = useMemo(() => {
    const cash = pnl.net;
    const assets = [
      { label: "Cash & Equivalents (from fee surplus)", value: Math.max(0, cash) },
      { label: "Accounts Receivable", value: 0 },
    ];
    const liabilities = [{ label: "Accounts Payable", value: 0 }];
    const totalAssets = assets.reduce((s, a) => s + a.value, 0);
    const totalLiabilities = liabilities.reduce((s, l) => s + l.value, 0);
    return {
      assets,
      liabilities,
      totalAssets,
      totalLiabilities,
      equity: totalAssets - totalLiabilities,
    };
  }, [pnl]);

  const cashFlow = useMemo(
    () => [
      {
        category: "Operating Activities (Fee Collections)",
        inflow: pnl.totalIncome,
        outflow: pnl.totalExpense,
        net: pnl.net,
      },
    ],
    [pnl]
  );

  const feeByMode = useMemo(() => {
    const map = new Map<string, { amount: number; count: number }>();
    for (const p of collectedPayments) {
      const mode = p.mode || "Other";
      const cur = map.get(mode) || { amount: 0, count: 0 };
      cur.amount += p.amount;
      cur.count += 1;
      map.set(mode, cur);
    }
    return [...map.entries()]
      .map(([mode, v]) => ({ mode, ...v }))
      .sort((a, b) => b.amount - a.amount);
  }, [collectedPayments]);

  const feeByMonth = useMemo(() => {
    const map = new Map<string, { amount: number; count: number }>();
    for (const p of collectedPayments) {
      const key = monthKeyFromPayment(p);
      const cur = map.get(key) || { amount: 0, count: 0 };
      cur.amount += p.amount;
      cur.count += 1;
      map.set(key, cur);
    }
    return [...map.entries()]
      .map(([month, v]) => ({ month, ...v }))
      .sort((a, b) => b.amount - a.amount);
  }, [collectedPayments]);

  const feeByClass = useMemo(() => {
    const map = new Map<string, { amount: number; count: number }>();
    for (const p of collectedPayments) {
      const key = String(p.className ?? "").trim() || "Unspecified";
      const cur = map.get(key) || { amount: 0, count: 0 };
      cur.amount += p.amount;
      cur.count += 1;
      map.set(key, cur);
    }
    return [...map.entries()]
      .map(([grade, v]) => ({ grade, ...v }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 12);
  }, [collectedPayments]);

  const expenseBreakdown = useMemo(() => {
    const total = pnl.totalExpense || 1;
    return pnl.expenses.map((eb) => ({
      category: eb.label,
      amount: eb.value,
      percentage: Math.round((eb.value / total) * 100),
    }));
  }, [pnl]);

  const exportRows = useMemo(
    () =>
      collectedPayments.map((p) => ({
        Receipt: p.receiptNo ?? "",
        Date: p.date ?? "",
        "Admission No": p.admissionNo ?? "",
        Student: p.studentName ?? "",
        Class: p.className ?? "",
        Month: p.feeMonth ?? "",
        Mode: p.mode,
        Amount: p.amount,
        Status: p.status,
        "Academic Year": academicYear ?? "",
      })),
    [collectedPayments, academicYear]
  );

  const yearLabel = academicYear ?? "—";
  const busy = loading || yearLoading;

  return (
    <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
      <AdminPageHeader
        title="Financial Reports"
        description={`Fee-collection based statements for academic year ${yearLabel}`}
      />

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 h-9 font-bold text-emerald-800">
            Academic Year: {yearLabel}
          </span>
          <span className="text-gray-500 font-medium">
            {busy
              ? "Loading fee payments…"
              : `${pnl.receiptCount.toLocaleString("en-IN")} receipts · ${formatInr(pnl.totalIncome)} collected`}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end">
          <div className="relative flex-1 sm:flex-none sm:min-w-[180px]">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as typeof range)}
              className="w-full h-9 appearance-none bg-gray-50/50 border border-gray-200 rounded-lg pl-3 pr-8 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
            >
              <option value="full">Full Academic Year</option>
              <option value="this-month">This Month</option>
              <option value="last-30">Last 30 Days</option>
              <option value="quarter">This Quarter</option>
            </select>
            <ChevronRight
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none"
              size={14}
            />
          </div>

          <div className="h-9 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-4 text-xs font-bold text-gray-700 shadow-sm">
            <CalendarRange size={14} className="text-gray-400" />
            {activeBranch.name}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <aside className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <p className="px-2 pt-1 pb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
              Report Modules
            </p>
            <div className="space-y-1">
              {reports.map((r) => {
                const active = r.key === activeReport;
                return (
                  <div
                    key={r.key}
                    className={cn(
                      "p-3 flex items-center justify-between rounded-lg cursor-pointer transition-colors border border-transparent",
                      active ? "bg-[#144835]/5 border-[#144835]/20" : "hover:bg-gray-50"
                    )}
                    onClick={() => setActiveReport(r.key)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center shadow-sm",
                          active
                            ? "bg-[#144835] text-white"
                            : "bg-white text-gray-400 border border-gray-200"
                        )}
                      >
                        <r.icon size={14} />
                      </div>
                      <div>
                        <p className={cn("text-xs font-bold", active ? "text-[#144835]" : "text-gray-700")}>
                          {r.label}
                        </p>
                        <p className="text-xs font-medium text-gray-400 mt-0.5">{r.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Actions</p>
            <ExportButton
              data={exportRows}
              filename={`fee-collections-${academicYear ?? "year"}`}
              className="w-full h-9 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
              iconSize={14}
            />
          </div>
        </aside>

        <div className="lg:col-span-3 space-y-4">
          {activeReport === "pnl" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="rounded-[16px] bg-[#144835] text-white p-4 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden shadow-md shadow-[#144835]/10">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl" />
                <div className="relative z-10">
                  <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider mb-1">
                    Net Surplus ({yearLabel})
                  </p>
                  <p className="text-xl sm:text-4xl font-bold tracking-tight">{formatInr(pnl.net)}</p>
                  <p className="text-xs text-emerald-100/80 mt-1">
                    Fee collections minus recorded expenses for the selected period
                  </p>
                </div>
                <div className="relative z-10 flex flex-wrap items-center gap-3">
                  <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/10 min-w-[120px]">
                    <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider mb-0.5">
                      Margin
                    </p>
                    <p className="text-xl font-bold text-amber-300">{pnl.margin}%</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/10 min-w-[120px]">
                    <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider mb-0.5">
                      Fee Revenue
                    </p>
                    <p className="text-xl font-bold text-white">{formatInr(pnl.totalIncome, { compact: true })}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-[16px] border border-gray-100 bg-white shadow-sm overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <TrendingUp size={14} />
                      </div>
                      <h3 className="text-xs font-bold text-gray-900">Operating Income</h3>
                    </div>
                  </div>
                  <div className="p-4 flex-1 space-y-3">
                    {pnl.income.map((i) => (
                      <div key={i.label} className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-600">{i.label}</span>
                        <span className="text-xs font-bold text-gray-900">{formatInr(i.value)}</span>
                      </div>
                    ))}
                    <p className="text-[11px] text-gray-400">
                      {pnl.receiptCount.toLocaleString("en-IN")} valid receipts (excludes cancelled /
                      bounced / corrupt amounts)
                    </p>
                  </div>
                  <div className="p-4 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Total Income
                    </span>
                    <span className="text-xs font-bold text-emerald-600">{formatInr(pnl.totalIncome)}</span>
                  </div>
                </div>

                <div className="rounded-[16px] border border-gray-100 bg-white shadow-sm overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center">
                        <TrendingDown size={14} />
                      </div>
                      <h3 className="text-xs font-bold text-gray-900">Operating Expenses</h3>
                    </div>
                  </div>
                  <div className="p-4 flex-1 space-y-3">
                    {pnl.expenses.map((e) => (
                      <div key={e.label} className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-600">{e.label}</span>
                        <span className="text-xs font-bold text-gray-900">{formatInr(e.value)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Total Expenses
                    </span>
                    <span className="text-xs font-bold text-rose-600">{formatInr(pnl.totalExpense)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeReport === "balance" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-[16px] border border-gray-100 bg-white shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-blue-50/30">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Landmark size={18} />
                    </div>
                    <h3 className="font-bold text-gray-900">Assets</h3>
                  </div>
                  <div className="p-4 space-y-4">
                    {balanceSheet.assets.map((a) => (
                      <div key={a.label} className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-600">{a.label}</span>
                        <span className="text-xs font-bold text-gray-900">{formatInr(a.value)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Total Assets
                    </span>
                    <span className="text-lg font-bold text-blue-600">
                      {formatInr(balanceSheet.totalAssets)}
                    </span>
                  </div>
                </div>

                <div className="rounded-[16px] border border-gray-100 bg-white shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-rose-50/30">
                    <div className="h-8 w-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                      <AlertCircle size={18} />
                    </div>
                    <h3 className="font-bold text-gray-900">Liabilities</h3>
                  </div>
                  <div className="p-4 space-y-4">
                    {balanceSheet.liabilities.map((l) => (
                      <div key={l.label} className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-600">{l.label}</span>
                        <span className="text-xs font-bold text-gray-900">{formatInr(l.value)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Total Liabilities
                    </span>
                    <span className="text-lg font-bold text-rose-600">
                      {formatInr(balanceSheet.totalLiabilities)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-[16px] border border-emerald-200 bg-emerald-50 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-900">Total Equity</p>
                    <p className="text-xs font-medium text-emerald-700">
                      Based on fee surplus for {yearLabel}
                    </p>
                  </div>
                </div>
                <p className="text-xl font-bold text-emerald-700">{formatInr(balanceSheet.equity)}</p>
              </div>
            </div>
          )}

          {activeReport === "cashflow" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="rounded-[16px] border border-gray-100 bg-white shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-4 py-2.5 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-4 py-2.5 text-xs font-extrabold text-gray-500 uppercase tracking-wider text-right">
                        Inflow
                      </th>
                      <th className="px-4 py-2.5 text-xs font-extrabold text-gray-500 uppercase tracking-wider text-right">
                        Outflow
                      </th>
                      <th className="px-4 py-2.5 text-xs font-extrabold text-gray-500 uppercase tracking-wider text-right">
                        Net
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {cashFlow.map((cf) => (
                      <tr key={cf.category} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-2.5 text-xs font-bold text-gray-900">{cf.category}</td>
                        <td className="px-4 py-2.5 text-xs font-semibold text-emerald-600 text-right">
                          {formatInr(cf.inflow)}
                        </td>
                        <td className="px-4 py-2.5 text-xs font-semibold text-rose-600 text-right">
                          {formatInr(cf.outflow)}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <span
                            className={cn(
                              "inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold",
                              cf.net >= 0
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-700"
                            )}
                          >
                            {cf.net >= 0 ? "+" : "-"}
                            {formatInr(Math.abs(cf.net))}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                  <span className="font-bold text-gray-700">Net Cash Flow</span>
                  <span className="text-xl font-bold text-[#144835]">{formatInr(pnl.net)}</span>
                </div>
              </div>
            </div>
          )}

          {activeReport === "fees" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Collected</p>
                  <p className="text-2xl font-bold text-emerald-700 mt-1">{formatInr(pnl.totalIncome)}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Receipts</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {pnl.receiptCount.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Academic Year
                  </p>
                  <p className="text-2xl font-bold text-[#144835] mt-1">{yearLabel}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                      By Payment Mode
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {feeByMode.length === 0 && (
                      <p className="p-4 text-xs text-gray-500">No fee collections for this period.</p>
                    )}
                    {feeByMode.map((row) => (
                      <div key={row.mode} className="px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-gray-900">{row.mode}</p>
                          <p className="text-[11px] text-gray-400">
                            {row.count.toLocaleString("en-IN")} receipts
                          </p>
                        </div>
                        <p className="text-xs font-bold text-emerald-700">{formatInr(row.amount)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                      By Fee Month
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-100 max-h-[360px] overflow-y-auto">
                    {feeByMonth.length === 0 && (
                      <p className="p-4 text-xs text-gray-500">No fee collections for this period.</p>
                    )}
                    {feeByMonth.map((row) => (
                      <div key={row.month} className="px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-gray-900">{row.month}</p>
                          <p className="text-[11px] text-gray-400">
                            {row.count.toLocaleString("en-IN")} receipts
                          </p>
                        </div>
                        <p className="text-xs font-bold text-gray-900">{formatInr(row.amount)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {feeByClass.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Top Classes by Collection
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0">
                    {feeByClass.map((fc) => {
                      const percent =
                        pnl.totalIncome > 0 ? Math.round((fc.amount / pnl.totalIncome) * 100) : 0;
                      return (
                        <div key={fc.grade} className="p-4 border-b border-gray-100 sm:border-r">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xs font-bold text-gray-900">{fc.grade}</h3>
                            <span className="text-xs font-extrabold text-[#144835]">{percent}%</span>
                          </div>
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-2">
                            <div
                              className="h-full bg-[#144835] rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">{fc.count} receipts</span>
                            <span className="font-bold text-emerald-600">{formatInr(fc.amount)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeReport === "expenses" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900">Expense Distribution ({yearLabel})</h3>
                </div>
                <div className="p-4">
                  <div className="space-y-6">
                    {expenseBreakdown.every((eb) => eb.amount === 0) && (
                      <p className="text-xs text-gray-500">
                        No expenses recorded for this academic-year period yet.
                      </p>
                    )}
                    {expenseBreakdown.map((eb) => (
                      <div key={eb.category}>
                        <div className="flex justify-between items-end mb-2">
                          <div>
                            <p className="text-xs font-bold text-gray-900">{eb.category}</p>
                            <p className="text-xs font-medium text-gray-500 mt-0.5">
                              {formatInr(eb.amount)}
                            </p>
                          </div>
                          <span className="text-xs font-extrabold text-gray-700">{eb.percentage}%</span>
                        </div>
                        <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${eb.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeReport === "tax" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white rounded-xl border border-gray-200 p-6 text-xs text-gray-600">
                Tax & compliance lines will appear here when TDS / GST postings are recorded. Fee
                collections for <span className="font-bold text-gray-900">{yearLabel}</span> are already
                included in Income Statement and Fee Collections.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
