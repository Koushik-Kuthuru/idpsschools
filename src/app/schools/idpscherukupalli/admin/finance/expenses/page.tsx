"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Filter, Download, Receipt, Wrench, Zap, Users, TrendingDown, Eye, CheckCircle2, ChevronRight } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ExportButton from "@/components/ui/ExportButton";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

type ExpenseStatus = "Paid" | "Pending";

type ExpenseRow = {
 id: string;
 title: string;
 category: string;
 amount: number;
 date: string;
 status: ExpenseStatus;
 vendor: string;
};

export default function AdminExpensesPage() {
 const schoolId = "idpscherukupalli";
 const [queryInput, setQueryInput] = useState("");
 const [categoryFilter, setCategoryFilter] = useState("All Categories");
 const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
 const [loading, setLoading] = useState(true);
 const [loadError, setLoadError] = useState<string | null>(null);

 useEffect(() => {
 setLoading(true);
 setLoadError(null);

 const qRef = query(collection(db, "schools", schoolId, "expenses"), orderBy("date", "desc"));
 const unsubscribe = onSnapshot(qRef, (snapshot) => {
 const list: ExpenseRow[] = snapshot.docs.map(doc => {
 const data = doc.data();
 return {
 id: doc.id,
 title: data.title || "Untitled Expense",
 category: data.category || "Other",
 amount: Number(data.amount || 0),
 date: data.date ? new Date(data.date).toLocaleDateString('en-IN') : "-",
 status: (data.status as ExpenseStatus) || "Pending",
 vendor: data.vendor || "-",
 };
 });
 setExpenses(list);
 setLoading(false);
 }, (err) => {
 console.error("Error loading expenses:", err);
 setLoadError("Failed to load expenses. Check permissions.");
 setLoading(false);
 });

 return () => unsubscribe();
 }, [schoolId]);

 const filteredExpenses = useMemo(() => {
 const q = queryInput.trim().toLowerCase();
 return expenses.filter((exp) => {
 const matchQ = !q || exp.title.toLowerCase().includes(q) || exp.vendor.toLowerCase().includes(q) || exp.id.toLowerCase().includes(q);
 const matchCategory = categoryFilter === "All Categories" || exp.category === categoryFilter;
 return matchQ && matchCategory;
 });
 }, [expenses, queryInput, categoryFilter]);

 const kpiData = useMemo(() => {
 const total = expenses.reduce((sum, e) => sum + (Number.isFinite(e.amount) ? e.amount : 0), 0);
 const paidTotal = expenses.filter((e) => e.status === "Paid").reduce((sum, e) => sum + (Number.isFinite(e.amount) ? e.amount : 0), 0);
 const pendingCount = expenses.filter((e) => e.status === "Pending").length;
 return [
 { title: "Total Expenses", value: `₹${total.toLocaleString("en-IN")}`, icon: TrendingDown, color: "bg-blue-500" },
 { title: "Paid Amount", value: `₹${paidTotal.toLocaleString("en-IN")}`, icon: CheckCircle2, color: "bg-emerald-500" },
 { title: "Pending Items", value: String(pendingCount), icon: Wrench, color: "bg-amber-500" },
 { title: "Categories", value: String(new Set(expenses.map((e) => e.category).filter(Boolean)).size), icon: Receipt, color: "bg-purple-500" },
 ];
 }, [expenses]);

 const getCategoryIcon = (category: string) => {
 switch(category) {
 case 'Supplies': return <Receipt className="w-4 h-4 text-blue-500" />;
 case 'Repairs': return <Wrench className="w-4 h-4 text-amber-500" />;
 case 'Utilities': return <Zap className="w-4 h-4 text-purple-500" />;
 case 'Salary': return <Users className="w-4 h-4 text-emerald-500" />;
 default: return <Receipt className="w-4 h-4 text-gray-500" />;
 }
 };

 return (
 <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
  {/* Top Header */}
 <AdminPageHeader
  title="Expenses"
  description="Track and approve school expenditures and vendor payments"
 />
 {/* Top Filter Bar */}
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
 <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
 <div className="relative flex-1 sm:w-[240px]">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
 <input
 className="w-full h-9 bg-gray-50/50 border border-gray-200 rounded-lg pl-9 pr-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all shadow-sm"
 placeholder="Search expenses, vendors..."
 value={queryInput}
 onChange={(e) => setQueryInput(e.target.value)}
 />
 </div>
 
 <div className="flex items-center gap-3 w-full sm:w-auto">
 <div className="relative flex-1 sm:flex-none sm:min-w-[140px]">
 <select 
 className="w-full h-9 appearance-none bg-gray-50/50 border border-gray-200 rounded-lg pl-3 pr-8 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
 value={categoryFilter}
 onChange={(e) => setCategoryFilter(e.target.value)}
 >
 <option value="All Categories">All Categories</option>
 <option value="Supplies">Supplies</option>
 <option value="Repairs">Repairs</option>
 <option value="Utilities">Utilities</option>
 <option value="Salary">Salary</option>
 </select>
 <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" size={14} />
 </div>
 </div>
 </div>

 <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end">
 <ExportButton data={filteredExpenses} filename="Export" className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 whitespace-nowrap transition-colors" iconSize={14} />
 <Link
 href="/schools/${schoolId}/admin/finance/expenses/new"
 className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#144835] px-4 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 whitespace-nowrap transition-all"
 >
 <Plus size={14} /> Add Expense
 </Link>
 </div>
 </div>

 {loadError && (
 <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
 {loadError}
 </div>
 )}

 {/* KPI Cards */}
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
 {kpiData.map((kpi, index) => (
 <div key={index} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
 <div className={`h-10 w-10 rounded-full ${kpi.color.replace('bg-', 'bg-').replace('500', '50')} ${kpi.color.replace('bg-', 'text-').replace('500', '600')} flex items-center justify-center shrink-0`}>
 <kpi.icon size={18} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{kpi.title}</p>
 <div className="flex items-baseline gap-2 mt-0.5">
 <p className="text-xl font-extrabold text-gray-900">{kpi.value}</p>
 </div>
 </div>
 </div>
 ))}
 </div>

 {/* Main Content */}
 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col overflow-hidden">
 <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
 <h2 className="text-sm font-bold text-gray-800">Expense History</h2>
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{loading ? "Loading..." : `${filteredExpenses.length} records`}</p>
 </div>

 {/* Table */}
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-gray-50/80 border-b border-gray-100">
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Expense ID</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Details</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {filteredExpenses.length > 0 ? (
 filteredExpenses.map((expense) => (
 <tr key={expense.id} className="hover:bg-gray-50/50 transition-colors group">
 <td className="px-4 py-2.5">
 <p className="text-xs font-bold text-gray-900">{expense.id}</p>
 <p className="text-xs font-medium text-gray-500 mt-0.5">{expense.date}</p>
 </td>
 <td className="px-4 py-2.5">
 <div>
 <p className="text-xs font-bold text-gray-900">{expense.title}</p>
 <p className="text-xs font-medium text-gray-500 mt-0.5">{expense.vendor}</p>
 </div>
 </td>
 <td className="px-4 py-2.5">
 <div className="flex items-center gap-1.5">
 {getCategoryIcon(expense.category)}
 <span className="text-xs font-bold text-gray-700">{expense.category}</span>
 </div>
 </td>
 <td className="px-4 py-2.5 text-xs font-bold text-[#144835]">
 ₹{expense.amount.toLocaleString("en-IN")}
 </td>
 <td className="px-4 py-2.5">
 <span className={cn(
 "inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border",
 expense.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
 'bg-amber-50 text-amber-700 border-amber-200'
 )}>
 {expense.status}
 </span>
 </td>
 <td className="px-4 py-2.5 text-right">
 <div className="flex items-center justify-end gap-1 transition-opacity">
 {expense.status === 'Pending' && (
 <button className="h-7 px-2.5 inline-flex items-center justify-center bg-[#144835]/10 text-[#144835] hover:bg-[#144835] hover:text-white rounded-md text-xs font-bold transition-colors">
 Approve
 </button>
 )}
 <button className="h-7 w-7 inline-flex items-center justify-center rounded-md text-gray-400 hover:text-[#144835] hover:bg-[#144835]/10 transition-colors" title="View Details">
 <Eye size={14} />
 </button>
 </div>
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
 <p className="text-xs text-gray-500 mt-1">Try adjusting your search query.</p>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 );
}
