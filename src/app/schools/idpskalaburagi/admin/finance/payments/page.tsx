"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Filter, Download, CreditCard, Banknote, History, CheckCircle2, TrendingUp, IndianRupee, ChevronRight } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ExportButton from "@/components/ui/ExportButton";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

type PaymentStatus = "Completed" | "Pending" | "Processing" | "Failed";

type PaymentRow = {
 id: string;
 date: string;
 student: string;
 invoiceId: string;
 amount: number;
 mode: string;
 status: PaymentStatus;
};

function getAvatarColor(name: string) {
 const colors = [
 "bg-red-100 text-red-700", "bg-orange-100 text-orange-700", 
 "bg-amber-100 text-amber-700", "bg-green-100 text-green-700", 
 "bg-emerald-100 text-emerald-700", "bg-teal-100 text-teal-700", 
 "bg-cyan-100 text-cyan-700", "bg-blue-100 text-blue-700", 
 "bg-indigo-100 text-indigo-700", "bg-violet-100 text-violet-700", 
 ];
 const index = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
 return colors[index];
}

export default function AdminPaymentsPage() {
 const schoolId = "idpskalaburagi";
 const [queryInput, setQueryInput] = useState("");
 const [payments, setPayments] = useState<PaymentRow[]>([]);
 const [loading, setLoading] = useState(true);
 const [loadError, setLoadError] = useState<string | null>(null);

 useEffect(() => {
 setLoading(true);
 setLoadError(null);

 const qRef = query(collection(db, "schools", schoolId, "payments"), orderBy("createdAt", "desc"));
 const unsubscribe = onSnapshot(qRef, (snapshot) => {
 const list: PaymentRow[] = snapshot.docs.map(doc => {
 const data = doc.data();
 return {
 id: doc.id,
 date: data.date ? new Date(data.date).toLocaleDateString('en-IN') : "-",
 student: data.studentName || "Unknown Student",
 invoiceId: data.invoiceId || "-",
 amount: Number(data.amount || 0),
 mode: data.mode || "Cash",
 status: (data.status as PaymentStatus) || "Completed",
 };
 });
 setPayments(list);
 setLoading(false);
 }, (err) => {
 console.error("Error loading payments:", err);
 setLoadError("Failed to load payments. Check permissions.");
 setLoading(false);
 });

 return () => unsubscribe();
 }, [schoolId]);

 const filteredPayments = useMemo(() => {
 const q = queryInput.trim().toLowerCase();
 return payments.filter((p) => !q || p.student.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.invoiceId.toLowerCase().includes(q));
 }, [payments, queryInput]);

 const kpiData = useMemo(() => {
 const total = payments.reduce((sum, p) => sum + (Number.isFinite(p.amount) ? p.amount : 0), 0);
 const online = payments.filter((p) => String(p.mode).toLowerCase().includes("online") || String(p.mode).toLowerCase().includes("upi")).length;
 const pending = payments.filter((p) => p.status === "Pending" || p.status === "Processing").reduce((sum, p) => sum + (Number.isFinite(p.amount) ? p.amount : 0), 0);
 return [
 { title: "Total Collected", value: `₹${total.toLocaleString("en-IN")}`, icon: IndianRupee, color: "bg-emerald-500" },
 { title: "Payments", value: String(payments.length), icon: TrendingUp, color: "bg-blue-500" },
 { title: "Online Payments", value: payments.length ? `${Math.round((online / payments.length) * 100)}%` : "0%", icon: CreditCard, color: "bg-purple-500" },
 { title: "Pending Clearance", value: `₹${pending.toLocaleString("en-IN")}`, icon: History, color: "bg-amber-500" },
 ];
 }, [payments]);

 return (
 <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
 {/* Top Filter Bar */}
 <div className="bg-white rounded-[16px] border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-4 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
 <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
 <div className="relative flex-1 sm:w-[240px]">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
 <input
 className="w-full h-9 bg-gray-50/50 border border-gray-200 rounded-lg pl-9 pr-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all shadow-sm"
 placeholder="Search payment, student..."
 value={queryInput}
 onChange={(e) => setQueryInput(e.target.value)}
 />
 </div>
 
 <div className="flex items-center gap-3 w-full sm:w-auto">
 <div className="relative flex-1 sm:flex-none sm:min-w-[140px]">
 <select 
 className="w-full h-9 appearance-none bg-gray-50/50 border border-gray-200 rounded-lg pl-3 pr-8 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
 defaultValue="All Modes"
 >
 <option value="All Modes">All Modes</option>
 <option value="Online">Online</option>
 <option value="Cash">Cash</option>
 <option value="Bank Transfer">Bank Transfer</option>
 </select>
 <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" size={14} />
 </div>
 </div>
 </div>

 <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end">
 <ExportButton data={filteredPayments} filename="Export" className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 whitespace-nowrap transition-colors" iconSize={14} />
 <Link
 href="/idpskalaburagi/finance/payments/new"
 className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#144835] px-4 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 whitespace-nowrap transition-all"
 >
 <Plus size={14} /> Record Payment
 </Link>
 </div>
 </div>

 {/* KPI Cards */}
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
 {kpiData.map((kpi, index) => (
 <div key={index} className="bg-white rounded-[16px] border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-4 flex items-center gap-3">
 <div className={`h-10 w-10 rounded-full ${kpi.color.replace('bg-', 'bg-').replace('500', '50')} ${kpi.color.replace('bg-', 'text-').replace('500', '600')} flex items-center justify-center shrink-0`}>
 <kpi.icon size={18} />
 </div>
 <div>
 <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{kpi.title}</p>
 <div className="flex items-baseline gap-2 mt-0.5">
 <p className="text-xl font-extrabold text-gray-900">{kpi.value}</p>
 </div>
 </div>
 </div>
 ))}
 </div>

 {/* Main Content */}
 <div className="bg-white rounded-[16px] border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col overflow-hidden">
 <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
 <h2 className="text-sm font-black text-gray-800">Payment History</h2>
 <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{filteredPayments.length} records</p>
 </div>

 {/* Table */}
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-gray-50/80 border-b border-gray-100">
 <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">Payment ID</th>
 <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">Student</th>
 <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">Invoice Info</th>
 <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">Amount</th>
 <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">Mode</th>
 <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {filteredPayments.length > 0 ? (
 filteredPayments.map((payment) => {
 const initials = payment.student.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
 const avatarColor = getAvatarColor(payment.student);

 return (
 <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors group">
 <td className="px-4 py-2.5">
 <p className="text-xs font-bold text-gray-900">{payment.id}</p>
 <p className="text-[10px] font-medium text-gray-500 mt-0.5">{payment.date}</p>
 </td>
 <td className="px-4 py-2.5">
 <div className="flex items-center gap-2.5">
 <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border border-white/20", avatarColor)}>
 {initials}
 </div>
 <div>
 <p className="text-xs font-bold text-gray-900">{payment.student}</p>
 <p className="text-[10px] font-medium text-gray-500 mt-0.5">{payment.invoiceId}</p>
 </div>
 </div>
 </td>
 <td className="px-4 py-2.5">
 <p className="text-xs font-bold text-gray-700">{payment.invoiceId}</p>
 </td>
 <td className="px-4 py-2.5">
 <p className="text-xs font-bold text-[#144835]">₹{payment.amount.toLocaleString("en-IN")}</p>
 </td>
 <td className="px-4 py-2.5">
 <div className="flex items-center gap-1.5">
 {payment.mode === 'Online' && <CreditCard className="w-3.5 h-3.5 text-blue-500" />}
 {payment.mode === 'Cash' && <Banknote className="w-3.5 h-3.5 text-emerald-500" />}
 {payment.mode === 'Bank Transfer' && <History className="w-3.5 h-3.5 text-purple-500" />}
 <span className="text-xs font-bold text-gray-700">{payment.mode}</span>
 </div>
 </td>
 <td className="px-4 py-2.5">
 <span className={cn(
 "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border",
 payment.status === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
 payment.status === "Failed" ? "bg-rose-50 text-rose-700 border-rose-200" :
 "bg-amber-50 text-amber-700 border-amber-200"
 )}>
 {payment.status}
 </span>
 </td>
 </tr>
 )
 })
 ) : (
 <tr>
 <td colSpan={6} className="px-4 py-8 text-center">
 <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 mb-2">
 <Search size={16} className="text-gray-400" />
 </div>
 <p className="text-xs font-bold text-gray-900">No payment records found</p>
 <p className="text-[10px] text-gray-500 mt-1">Try adjusting your search query.</p>
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
