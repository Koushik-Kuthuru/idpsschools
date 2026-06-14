"use client";

import { useSchoolId } from "@/hooks/useSchoolId";
import AdminPageHeader from "@/components/admin/PageHeader";

import { useMemo, useState, useEffect } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { CalendarRange, ChevronRight, Download, Mail, Printer, TrendingDown, TrendingUp, Wallet, FileText, Landmark, Receipt, ShieldCheck, type LucideIcon, FileSpreadsheet, PieChart, BarChart3, AlertCircle, CheckCircle2, ArrowRightLeft } from "lucide-react";
import { useBranch } from "@/components/admin/BranchContext";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ExportButton from "@/components/ui/ExportButton";

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

export default function AdminFinancialReportsPage() {
 const { activeBranch } = useBranch();
 const schoolId = useSchoolId();
 const [activeReport, setActiveReport] = useState<ReportKey>("pnl");
 const [range, setRange] = useState("This Month");

 const [payments, setPayments] = useState<any[]>([]);
 const [expensesList, setExpensesList] = useState<any[]>([]);
 const [payrollList, setPayrollList] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 async function loadData() {
 setLoading(true);
 try {
 const [paySnap, expSnap, prSnap] = await Promise.all([
 getDocs(query(collection(db, "schools", schoolId, "payments"))),
 getDocs(query(collection(db, "schools", schoolId, "expenses"))),
 getDocs(query(collection(db, "schools", schoolId, "payroll"))),
 ]);
 setPayments(paySnap.docs.map(d => d.data()));
 setExpensesList(expSnap.docs.map(d => d.data()));
 setPayrollList(prSnap.docs.map(d => d.data()));
 } catch (err) {
 console.error("Error loading financial data", err);
 } finally {
 setLoading(false);
 }
 }
 loadData();
 }, [schoolId]);

 // Derived Data
 const pnl = useMemo(() => {
 const totalIncomeValue = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
 const income = [{ label: "Fee Collections", value: totalIncomeValue }];
 
 const opsExpenses = expensesList.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
 const salaries = payrollList.reduce((sum, p) => sum + (Number(p.net) || 0), 0);
 const expenses = [
 { label: "Salaries", value: salaries },
 { label: "Operating Expenses", value: opsExpenses },
 ];
 
 const totalIncome = totalIncomeValue;
 const totalExpense = opsExpenses + salaries;
 const net = totalIncome - totalExpense;
 const margin = totalIncome === 0 ? 0 : Math.round((net / totalIncome) * 1000) / 10;
 return { income, expenses, totalIncome, totalExpense, net, margin };
 }, [payments, expensesList, payrollList]);

 const balanceSheet = useMemo(() => {
 const cash = pnl.net; // simplistic assumption
 const assets = [
 { label: "Cash & Equivalents", value: Math.max(0, cash) },
 { label: "Accounts Receivable", value: 0 },
 ];
 const liabilities = [
 { label: "Accounts Payable", value: 0 },
 ];
 const totalAssets = assets.reduce((s, a) => s + a.value, 0);
 const totalLiabilities = liabilities.reduce((s, l) => s + l.value, 0);
 const equity = totalAssets - totalLiabilities;
 return { assets, liabilities, totalAssets, totalLiabilities, equity };
 }, [pnl]);

 const cashFlow = useMemo(() => {
 return [
 { category: "Operating Activities", inflow: pnl.totalIncome, outflow: pnl.totalExpense, net: pnl.net },
 ];
 }, [pnl]);

 const feeCollections = useMemo(() => {
 return [
 { grade: "All Grades", expected: 0, collected: pnl.totalIncome },
 ];
 }, [pnl]);

 const expenseBreakdown = useMemo(() => {
 const total = pnl.totalExpense || 1;
 return [
 { category: "Salaries", amount: pnl.expenses[0].value, percentage: Math.round((pnl.expenses[0].value / total) * 100) },
 { category: "Operating", amount: pnl.expenses[1].value, percentage: Math.round((pnl.expenses[1].value / total) * 100) },
 ];
 }, [pnl]);

 const taxes = useMemo(() => {
 return [
 { type: "TDS Deducted", amount: payrollList.reduce((sum, p) => sum + (Number(p.tds) || 0), 0), status: "Pending", dueDate: "N/A" },
 ];
 }, [payrollList]);

 return (
 <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
  {/* Top Header */}
 <AdminPageHeader
  title="Financial Reports"
  description="Generate and review financial statements and compliance"
 />
 {/* Top Filter Bar */}
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
<div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end">
 <div className="relative flex-1 sm:flex-none sm:min-w-[150px]">
 <select
 value={range}
 onChange={(e) => setRange(e.target.value)}
 className="w-full h-9 appearance-none bg-gray-50/50 border border-gray-200 rounded-lg pl-3 pr-8 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
 >
 <option>Last 30 Days</option>
 <option>This Month</option>
 <option>Last Quarter</option>
 <option>Year to Date</option>
 </select>
 <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" size={14} />
 </div>

 <div className="h-9 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-4 text-xs font-bold text-gray-700 shadow-sm">
 <CalendarRange size={14} className="text-gray-400" /> 
 {activeBranch.name}
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
 {/* Sidebar */}
 <aside className="lg:col-span-1 space-y-4">
 <div className="bg-white rounded-xl border border-gray-200 p-3">
 <p className="px-2 pt-1 pb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Report Modules</p>
 <div className="space-y-1">
 {reports.map((r) => {
 const active = r.key === activeReport;
 return (
 <div key={r.key} className={cn("p-3 flex items-center justify-between rounded-lg cursor-pointer transition-colors border border-transparent", active ? "bg-[#144835]/5 border-[#144835]/20" : "hover:bg-gray-50")} onClick={() => setActiveReport(r.key)}>
 <div className="flex items-center gap-3">
 <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shadow-sm", active ? "bg-[#144835] text-white" : "bg-white text-gray-400 border border-gray-200")}>
 <r.icon size={14} />
 </div>
 <div>
 <p className={cn("text-xs font-bold", active ? "text-[#144835]" : "text-gray-700")}>{r.label}</p>
 <p className="text-xs font-medium text-gray-400 mt-0.5">{r.desc}</p>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 </div>

 {/* Export Actions */}
 <div className="bg-white rounded-xl border border-gray-200 p-4">
 <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Actions</p>
 <div className="flex gap-2">
 <ExportButton data={[]} filename="Export" className="flex-1 min-w-0 h-9 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors" iconSize={14} />
 </div>
 </div>
 </aside>

 {/* Dynamic Report Content */}
 <div className="lg:col-span-3 space-y-4">
 
 {/* 1. P&L Statement */}
 {activeReport === "pnl" && (
 <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
 <div className="rounded-[16px] bg-[#144835] text-white p-4 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden shadow-md shadow-[#144835]/10">
 <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>
 <div className="relative z-10">
 <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider mb-1">Net Profit</p>
 <p className="text-xl sm:text-4xl font-bold tracking-tight">
 {pnl.net.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}
 </p>
 </div>
 <div className="relative z-10 flex flex-wrap items-center gap-3">
 <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/10 min-w-[120px]">
 <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider mb-0.5">Margin</p>
 <p className="text-xl font-bold text-amber-300">{pnl.margin}%</p>
 </div>
 <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/10 min-w-[120px]">
 <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider mb-0.5">Total Revenue</p>
 <p className="text-xl font-bold text-white">
 {pnl.totalIncome.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0, notation: "compact" })}
 </p>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
 {/* Income */}
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
 <span className="text-xs font-bold text-gray-900">
 {i.value.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}
 </span>
 </div>
 ))}
 </div>
 <div className="p-4 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between">
 <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Total Income</span>
 <span className="text-xs font-bold text-emerald-600">
 {pnl.totalIncome.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}
 </span>
 </div>
 </div>

 {/* Expenses */}
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
 <span className="text-xs font-bold text-gray-900">
 {e.value.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}
 </span>
 </div>
 ))}
 </div>
 <div className="p-4 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between">
 <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Total Expenses</span>
 <span className="text-xs font-bold text-rose-600">
 {pnl.totalExpense.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}
 </span>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* 2. Balance Sheet */}
 {activeReport === "balance" && (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
 {/* Assets */}
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
 <span className="text-xs font-bold text-gray-900">
 ₹{a.value.toLocaleString("en-IN")}
 </span>
 </div>
 ))}
 </div>
 <div className="p-4 border-t border-gray-100 flex items-center justify-between">
 <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Total Assets</span>
 <span className="text-lg font-bold text-blue-600">
 ₹{balanceSheet.totalAssets.toLocaleString("en-IN")}
 </span>
 </div>
 </div>

 {/* Liabilities */}
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
 <span className="text-xs font-bold text-gray-900">
 ₹{l.value.toLocaleString("en-IN")}
 </span>
 </div>
 ))}
 </div>
 <div className="p-4 border-t border-gray-100 flex items-center justify-between">
 <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Total Liabilities</span>
 <span className="text-lg font-bold text-rose-600">
 ₹{balanceSheet.totalLiabilities.toLocaleString("en-IN")}
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
 <p className="text-xs font-medium text-emerald-700">Assets minus Liabilities</p>
 </div>
 </div>
 <p className="text-xl font-bold text-emerald-700">
 ₹{balanceSheet.equity.toLocaleString("en-IN")}
 </p>
 </div>
 </div>
 )}

 {/* 3. Cash Flow */}
 {activeReport === "cashflow" && (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
 <div className="rounded-[16px] border border-gray-100 bg-white shadow-sm overflow-hidden">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-gray-50 border-b border-gray-100">
 <th className="px-4 py-2.5 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Category</th>
 <th className="px-4 py-2.5 text-xs font-extrabold text-gray-500 uppercase tracking-wider text-right">Inflow</th>
 <th className="px-4 py-2.5 text-xs font-extrabold text-gray-500 uppercase tracking-wider text-right">Outflow</th>
 <th className="px-4 py-2.5 text-xs font-extrabold text-gray-500 uppercase tracking-wider text-right">Net</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {cashFlow.map((cf) => (
 <tr key={cf.category} className="hover:bg-gray-50/50 transition-colors">
 <td className="px-4 py-2.5 text-xs font-bold text-gray-900">{cf.category}</td>
 <td className="px-4 py-2.5 text-xs font-semibold text-emerald-600 text-right">₹{cf.inflow.toLocaleString("en-IN")}</td>
 <td className="px-4 py-2.5 text-xs font-semibold text-rose-600 text-right">₹{cf.outflow.toLocaleString("en-IN")}</td>
 <td className="px-4 py-2.5 text-right">
 <span className={cn(
 "inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold",
 cf.net >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
 )}>
 {cf.net >= 0 ? "+" : ""}₹{Math.abs(cf.net).toLocaleString("en-IN")}
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
 <span className="font-bold text-gray-700">Net Cash Flow</span>
 <span className="text-xl font-bold text-[#144835]">
 ₹{cashFlow.reduce((s, cf) => s + cf.net, 0).toLocaleString("en-IN")}
 </span>
 </div>
 </div>
 </div>
 )}

 {/* 4. Fee Collections */}
 {activeReport === "fees" && (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 {feeCollections.map((fc) => {
 const percent = Math.round((fc.collected / fc.expected) * 100);
 return (
 <div key={fc.grade} className="bg-white rounded-xl border border-gray-200 p-4">
 <div className="flex justify-between items-center mb-4">
 <h3 className="font-bold text-gray-900">{fc.grade}</h3>
 <span className="text-xs font-extrabold text-[#144835]">{percent}% Collected</span>
 </div>
 <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-4">
 <div className="h-full bg-[#144835] rounded-full" style={{ width: `${percent}%` }}></div>
 </div>
 <div className="flex justify-between text-xs">
 <div>
 <p className="text-gray-500 font-medium">Expected</p>
 <p className="font-bold text-gray-900">₹{fc.expected.toLocaleString("en-IN")}</p>
 </div>
 <div className="text-right">
 <p className="text-gray-500 font-medium">Collected</p>
 <p className="font-bold text-emerald-600">₹{fc.collected.toLocaleString("en-IN")}</p>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 )}

 {/* 5. Expense Report */}
 {activeReport === "expenses" && (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
 <div className="p-4 border-b border-gray-100">
 <h3 className="font-bold text-gray-900">Expense Distribution</h3>
 </div>
 <div className="p-4">
 <div className="space-y-6">
 {expenseBreakdown.map((eb) => (
 <div key={eb.category}>
 <div className="flex justify-between items-end mb-2">
 <div>
 <p className="text-xs font-bold text-gray-900">{eb.category}</p>
 <p className="text-xs font-medium text-gray-500 mt-0.5">₹{eb.amount.toLocaleString("en-IN")}</p>
 </div>
 <span className="text-xs font-extrabold text-gray-700">{eb.percentage}%</span>
 </div>
 <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
 <div className="h-full bg-blue-500 rounded-full" style={{ width: `${eb.percentage}%` }}></div>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 )}

 {/* 6. Tax Reports */}
 {activeReport === "tax" && (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-gray-50 border-b border-gray-100">
 <th className="px-4 py-2.5 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Tax Type</th>
 <th className="px-4 py-2.5 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Amount</th>
 <th className="px-4 py-2.5 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Due Date</th>
 <th className="px-4 py-2.5 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Status</th>
 <th className="px-4 py-2.5 text-xs font-extrabold text-gray-500 uppercase tracking-wider text-right">Action</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {taxes.map((t) => (
 <tr key={t.type} className="hover:bg-gray-50/50 transition-colors">
 <td className="px-4 py-2.5 text-xs font-bold text-gray-900">{t.type}</td>
 <td className="px-4 py-2.5 text-xs font-bold text-gray-700">₹{t.amount.toLocaleString("en-IN")}</td>
 <td className="px-4 py-2.5 text-xs font-semibold text-gray-600">{t.dueDate}</td>
 <td className="px-4 py-2.5">
 <span className={cn(
 "inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border",
 t.status === "Paid" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
 )}>
 {t.status}
 </span>
 </td>
 <td className="px-4 py-2.5 text-right">
 {t.status === "Pending" && (
 <button className="text-xs font-bold text-[#144835] hover:text-[#144835]/80 transition-colors">
 Mark Paid
 </button>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}
 
 </div>
 </div>
 </div>
 );
}
