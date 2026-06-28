"use client";

import { useSchoolId } from "@/hooks/useSchoolId";
import AdminPageHeader from "@/components/admin/PageHeader";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
const SafeLink = Link as any;
;
import { Plus, Search, Filter, Download, Eye, FileText, CheckCircle2, Clock, AlertCircle, ChevronRight, Users, Briefcase, Settings , Trash2} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";


import ExportButton from "@/components/ui/ExportButton";
import TableRowActions from "@/components/ui/TableRowActions";
import { deleteSchoolDocument } from "@/lib/deleteSchoolDocument";
import { buildPath, subscribeData, buildQuery, sortBy, db, auth } from "@/lib/db-client";


function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

type InvoiceStatus = "Paid" | "Pending" | "Overdue";

type InvoiceRow = {
 id: string;
 student: string;
 grade: string;
 section: string;
 amount: number;
 date: string;
 dueDate: string;
 status: InvoiceStatus;
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

export default function AdminInvoiceManagementPage() {
 const schoolId = useSchoolId();
 const [searchQuery, setSearchQuery] = useState("");
 const [statusFilter, setStatusFilter] = useState<"All" | InvoiceStatus>("All");
 const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
 const [loading, setLoading] = useState(true);
 const [loadError, setLoadError] = useState<string | null>(null);

 useEffect(() => {
 setLoading(true);
 setLoadError(null);

 const qRef = buildQuery(
 buildPath(db, "schools", schoolId, "invoices"),
 sortBy("dueDate", "desc")
 );

 const unsubscribe = subscribeData(qRef, (snapshot: any) => {
 const list: InvoiceRow[] = snapshot.docs.map((buildPath: any) => {
 const data = buildPath.data();
 
 // Determine status based on dates if it's pending
 let computedStatus = (data.status as InvoiceStatus) || "Pending";
 if (computedStatus === "Pending" && data.dueDate) {
 const due = new Date(data.dueDate);
 const now = new Date();
 if (due < now) computedStatus = "Overdue";
 }

 return {
 id: buildPath.id,
 student: data.studentName || "Unknown Student",
 grade: data.grade || "-",
 section: data.section || "-",
 amount: Number(data.amount || 0),
 date: data.date ? new Date(data.date).toLocaleDateString('en-IN') : "-",
 dueDate: data.dueDate ? new Date(data.dueDate).toLocaleDateString('en-IN') : "-",
 status: computedStatus,
 };
 });
 setInvoices(list);
 setLoading(false);
 }, (err: any) => {
 console.error("Error loading invoices:", err);
 setLoadError("Failed to load invoices. Check permissions.");
 setLoading(false);
 });

 return () => unsubscribe();
 }, [schoolId]);

 const filteredInvoices = useMemo(() => {
 const q = searchQuery.trim().toLowerCase();
 return invoices.filter((inv) => {
 const matchQ = !q || inv.student.toLowerCase().includes(q) || inv.id.toLowerCase().includes(q);
 const matchStatus = statusFilter === "All" || inv.status === statusFilter;
 return matchQ && matchStatus;
 });
 }, [invoices, searchQuery, statusFilter]);

 const stats = useMemo(() => {
 const paid = invoices.filter((i) => i.status === "Paid").length;
 const pending = invoices.filter((i) => i.status === "Pending").length;
 const overdue = invoices.filter((i) => i.status === "Overdue").length;
 const totalRevenue = invoices.reduce((sum, i) => sum + (Number.isFinite(i.amount) ? i.amount : 0), 0);
 return { paid, pending, overdue, totalRevenue };
 }, [invoices]);

 return (
 <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
  {/* Top Header */}
 <AdminPageHeader
  title="Invoices"
  description="Generate, review, and manage student fee invoices"
 />
 {/* Top Filter Bar */}
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
 <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
 <div className="relative flex-1 sm:w-[240px]">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
 <input
 className="w-full h-9 bg-gray-50/50 border border-gray-200 rounded-lg pl-9 pr-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all shadow-sm"
 placeholder="Search invoice, student..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>
 
 <div className="flex items-center gap-3 w-full sm:w-auto">
 <div className="relative flex-1 sm:flex-none sm:min-w-[140px]">
 <select 
 className="w-full h-9 appearance-none bg-gray-50/50 border border-gray-200 rounded-lg pl-3 pr-8 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value as any)}
 >
 <option value="All">All Status</option>
 <option value="Paid">Paid</option>
 <option value="Pending">Pending</option>
 <option value="Overdue">Overdue</option>
 </select>
 <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" size={14} />
 </div>
 </div>
 </div>

 <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end">
 <ExportButton data={filteredInvoices} filename="Export" className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 whitespace-nowrap transition-colors" iconSize={14} />
 <SafeLink
 href={`/schools/${schoolId}/admin/finance/invoices/new`}
 className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#144835] px-4 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 whitespace-nowrap transition-all"
 >
 <Plus size={14} /> New Invoice
 </SafeLink>
 </div>
 </div>

 {loadError && (
 <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
 {loadError}
 </div>
 )}

 {/* KPI Cards */}
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
 <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
 <FileText size={18} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Revenue</p>
 <div className="flex items-baseline gap-2 mt-0.5">
 <p className="text-xl font-extrabold text-gray-900">₹{stats.totalRevenue.toLocaleString("en-IN")}</p>
 </div>
 </div>
 </div>
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
 <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
 <CheckCircle2 size={18} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Paid Invoices</p>
 <div className="flex items-baseline gap-2 mt-0.5">
 <p className="text-xl font-extrabold text-gray-900">{stats.paid}</p>
 </div>
 </div>
 </div>
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
 <div className="h-10 w-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
 <Clock size={18} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pending</p>
 <div className="flex items-baseline gap-2 mt-0.5">
 <p className="text-xl font-extrabold text-gray-900">{stats.pending}</p>
 </div>
 </div>
 </div>
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
 <div className="h-10 w-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
 <AlertCircle size={18} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Overdue</p>
 <div className="flex items-baseline gap-2 mt-0.5">
 <p className="text-xl font-extrabold text-gray-900">{stats.overdue}</p>
 </div>
 </div>
 </div>
 </div>

 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col overflow-hidden">
 <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
 <h2 className="text-sm font-bold text-gray-800">Invoice Directory</h2>
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{filteredInvoices.length} records</p>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-gray-50/80 border-b border-gray-100">
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice Info</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Dates</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
 <th className="w-12 px-2 py-2.5 text-right" aria-label="Row actions"></th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {filteredInvoices.length > 0 ? (
 filteredInvoices.map((inv) => {
 const initials = inv.student.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
 const avatarColor = getAvatarColor(inv.student);

 return (
 <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors group">
 <td className="px-4 py-2.5">
 <p className="text-xs font-bold text-gray-900">{inv.id}</p>
 </td>
 <td className="px-4 py-2.5">
 <div className="flex items-center gap-2.5">
 <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border border-white/20", avatarColor)}>
 {initials}
 </div>
 <div>
 <p className="text-xs font-bold text-gray-900">{inv.student}</p>
 <p className="text-xs font-medium text-gray-500 mt-0.5">Grade {inv.grade} - {String(inv.section).toUpperCase()}</p>
 </div>
 </div>
 </td>
 <td className="px-4 py-2.5 text-xs font-bold text-[#144835]">₹{inv.amount.toLocaleString("en-IN")}</td>
 <td className="px-4 py-2.5">
 <p className="text-xs font-bold text-gray-700">{inv.date}</p>
 <p className="text-xs font-medium text-gray-500 mt-0.5">Due: {inv.dueDate}</p>
 </td>
 <td className="px-4 py-2.5">
 <span className={cn(
 "inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border",
 inv.status === "Paid" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
 inv.status === "Overdue" ? "bg-rose-50 text-rose-700 border-rose-200" :
 "bg-amber-50 text-amber-700 border-amber-200"
 )}>
 {inv.status}
 </span>
 </td>
 <td className="px-4 py-2.5 text-right">
 <TableRowActions
 items={[
 { label: "View Details", icon: Eye, onClick: () => {} },
 { label: "Download PDF", icon: Download, onClick: () => {} },
 {
 label: "Delete",
 icon: Trash2,
 destructive: true,
 dividerBefore: true,
 confirmMessage: `Delete invoice ${inv.id}? This cannot be undone.`,
 onClick: () => deleteSchoolDocument(schoolId, "invoices", inv.id),
 },
 ]}
 />
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
 <p className="text-xs font-bold text-gray-900">No invoice records found</p>
 <p className="text-xs text-gray-500 mt-1">Try adjusting your search buildQuery.</p>
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
