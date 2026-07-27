"use client";

import { adminFetch } from "@/lib/adminApi";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BedDouble,
  BookOpen,
  Bus,
  CheckCircle2,
  ChevronRight,
  Eye,
  Plus,
  Receipt,
  Search,
  Trash2,
  TrendingDown,
  Users,
  UtensilsCrossed,
  Wrench,
  Zap,
} from "lucide-react";
import AdminPageHeader from "@/components/admin/PageHeader";
import ExportButton from "@/components/ui/ExportButton";
import TableRowActions from "@/components/ui/TableRowActions";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { useSchoolId } from "@/hooks/useSchoolId";
import { EXPENSE_CATEGORIES } from "@/lib/expenseStore";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const SafeLink = Link as any;

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ExpenseStatus = "Paid" | "Pending" | "Approved";

type ExpenseRow = {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  status: ExpenseStatus;
  vendor: string;
  notes?: string;
  department?: string;
};

function formatDisplayDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN");
}

function categoryIcon(category: string) {
  switch (category) {
    case "Mess":
      return <UtensilsCrossed className="w-4 h-4 text-orange-500" />;
    case "Hostel":
      return <BedDouble className="w-4 h-4 text-indigo-500" />;
    case "Staff":
      return <Users className="w-4 h-4 text-emerald-500" />;
    case "Academic":
      return <BookOpen className="w-4 h-4 text-blue-500" />;
    case "Transport":
      return <Bus className="w-4 h-4 text-cyan-500" />;
    case "Utilities":
      return <Zap className="w-4 h-4 text-purple-500" />;
    case "Maintenance":
      return <Wrench className="w-4 h-4 text-amber-500" />;
    case "Supplies":
      return <Receipt className="w-4 h-4 text-blue-500" />;
    default:
      return <Receipt className="w-4 h-4 text-gray-500" />;
  }
}

export default function AdminExpensesView() {
  const schoolId = useSchoolId();
  const [queryInput, setQueryInput] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await adminFetch(`/api/admin/expenses?schoolId=${encodeURIComponent(schoolId)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load expenses");
      setExpenses((data.expenses ?? []) as ExpenseRow[]);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load expenses");
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filteredExpenses = useMemo(() => {
    const q = queryInput.trim().toLowerCase();
    return expenses.filter((exp) => {
      const matchQ =
        !q ||
        exp.title.toLowerCase().includes(q) ||
        exp.vendor.toLowerCase().includes(q) ||
        exp.id.toLowerCase().includes(q) ||
        exp.category.toLowerCase().includes(q);
      const matchCategory =
        categoryFilter === "All Categories" || exp.category === categoryFilter;
      return matchQ && matchCategory;
    });
  }, [expenses, queryInput, categoryFilter]);

  const categoryTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const expense of expenses) {
      map.set(expense.category, (map.get(expense.category) ?? 0) + expense.amount);
    }
    return Array.from(map.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  const kpiData = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + (Number.isFinite(e.amount) ? e.amount : 0), 0);
    const paidTotal = expenses
      .filter((e) => e.status === "Paid")
      .reduce((sum, e) => sum + (Number.isFinite(e.amount) ? e.amount : 0), 0);
    const pendingCount = expenses.filter((e) => e.status === "Pending" || e.status === "Approved").length;
    return [
      {
        title: "Total Expenses",
        value: `₹${total.toLocaleString("en-IN")}`,
        icon: TrendingDown,
        color: "bg-blue-500",
      },
      {
        title: "Paid Amount",
        value: `₹${paidTotal.toLocaleString("en-IN")}`,
        icon: CheckCircle2,
        color: "bg-emerald-500",
      },
      {
        title: "Pending Items",
        value: String(pendingCount),
        icon: Wrench,
        color: "bg-amber-500",
      },
      {
        title: "Categories",
        value: String(new Set(expenses.map((e) => e.category).filter(Boolean)).size),
        icon: Receipt,
        color: "bg-purple-500",
      },
    ];
  }, [expenses]);

  const updateStatus = async (expense: ExpenseRow, status: ExpenseStatus) => {
    setMessage(null);
    try {
      const res = await adminFetch(`/api/admin/expenses/${encodeURIComponent(expense.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId, ...expense, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to update");
      setMessage(`Marked as ${status}`);
      await refresh();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const handleDelete = async (expenseId: string) => {
    const params = new URLSearchParams({ schoolId });
    const res = await fetch(
      `/api/admin/expenses/${encodeURIComponent(expenseId)}?${params.toString()}`,
      { method: "DELETE" }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLoadError(data.error || "Failed to delete");
      return;
    }
    await refresh();
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
      <AdminPageHeader
        title="Expenses"
        description="Track mess, hostel, staff, academic, transport and other school expenditures."
      />

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="relative flex-1 sm:w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              className="w-full h-9 bg-gray-50/50 border border-gray-200 rounded-lg pl-9 pr-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all shadow-sm"
              placeholder="Search expenses, vendors, categories..."
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
            />
          </div>

          <div className="relative flex-1 sm:flex-none sm:min-w-[160px]">
            <select
              className="w-full h-9 appearance-none bg-gray-50/50 border border-gray-200 rounded-lg pl-3 pr-8 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All Categories">All Categories</option>
              {EXPENSE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <ChevronRight
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none"
              size={14}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end">
          {message ? <span className="text-xs font-bold text-emerald-600">{message}</span> : null}
          <ExportButton
            data={filteredExpenses}
            filename="expenses"
            className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 whitespace-nowrap transition-colors"
            iconSize={14}
          />
          <SafeLink
            href={`/schools/${schoolId}/admin/finance/expenses/new`}
            className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#144835] px-4 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 whitespace-nowrap transition-all"
          >
            <Plus size={14} /> Add Expense
          </SafeLink>
        </div>
      </div>

      {loadError ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
          {loadError}
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiData.map((kpi) => (
          <div key={kpi.title} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-full ${kpi.color.replace("bg-", "bg-").replace("500", "50")} ${kpi.color.replace("bg-", "text-").replace("500", "600")} flex items-center justify-center shrink-0`}
            >
              <kpi.icon size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{kpi.title}</p>
              <p className="text-xl font-extrabold text-gray-900 mt-0.5">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {categoryTotals.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          {categoryTotals.map((item) => (
            <button
              key={item.category}
              type="button"
              onClick={() => setCategoryFilter(item.category)}
              className={cn(
                "rounded-xl border bg-white p-3 text-left hover:border-[#144835]/40 transition-colors",
                categoryFilter === item.category
                  ? "border-[#144835] bg-[#144835]/5"
                  : "border-gray-200"
              )}
            >
              <div className="flex items-center gap-2">
                {categoryIcon(item.category)}
                <p className="text-[11px] font-bold text-gray-600">{item.category}</p>
              </div>
              <p className="text-sm font-extrabold text-gray-900 mt-1">
                ₹{item.amount.toLocaleString("en-IN")}
              </p>
            </button>
          ))}
        </div>
      ) : null}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-sm font-bold text-gray-800">Expense History</h2>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            {loading ? "Loading..." : `${filteredExpenses.length} records`}
          </p>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <SkeletonTable rows={8} columns={6} showHeader={false} className="rounded-none border-0" />
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Expense ID
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="w-12 px-2 py-2.5 text-right" aria-label="Row actions" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredExpenses.length > 0 ? (
                  filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-4 py-2.5">
                        <p className="text-xs font-bold text-gray-900">{expense.id}</p>
                        <p className="text-xs font-medium text-gray-500 mt-0.5">
                          {formatDisplayDate(expense.date)}
                        </p>
                      </td>
                      <td className="px-4 py-2.5">
                        <div>
                          <p className="text-xs font-bold text-gray-900">{expense.title}</p>
                          <p className="text-xs font-medium text-gray-500 mt-0.5">{expense.vendor}</p>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          {categoryIcon(expense.category)}
                          <span className="text-xs font-bold text-gray-700">{expense.category}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs font-bold text-[#144835]">
                        ₹{expense.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border",
                            expense.status === "Paid"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : expense.status === "Approved"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                          )}
                        >
                          {expense.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <TableRowActions
                          items={[
                            ...(expense.status === "Pending"
                              ? [
                                  {
                                    label: "Approve",
                                    icon: CheckCircle2,
                                    onClick: () => updateStatus(expense, "Approved"),
                                  },
                                ]
                              : []),
                            ...(expense.status !== "Paid"
                              ? [
                                  {
                                    label: "Mark Paid",
                                    icon: CheckCircle2,
                                    onClick: () => updateStatus(expense, "Paid"),
                                  },
                                ]
                              : []),
                            {
                              label: "View Details",
                              icon: Eye,
                              onClick: () =>
                                alert(
                                  [
                                    expense.title,
                                    `Category: ${expense.category}`,
                                    `Vendor: ${expense.vendor}`,
                                    `Amount: ₹${expense.amount.toLocaleString("en-IN")}`,
                                    `Date: ${formatDisplayDate(expense.date)}`,
                                    `Status: ${expense.status}`,
                                    expense.notes ? `Notes: ${expense.notes}` : "",
                                  ]
                                    .filter(Boolean)
                                    .join("\n")
                                ),
                            },
                            {
                              label: "Delete",
                              icon: Trash2,
                              destructive: true,
                              dividerBefore: true,
                              confirmMessage: `Delete expense ${expense.id}? This cannot be undone.`,
                              onClick: () => handleDelete(expense.id),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 mb-2">
                        <Search size={16} className="text-gray-400" />
                      </div>
                      <p className="text-xs font-bold text-gray-900">No expense records found</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Add mess, hostel, staff, or other expenses to track spending.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
