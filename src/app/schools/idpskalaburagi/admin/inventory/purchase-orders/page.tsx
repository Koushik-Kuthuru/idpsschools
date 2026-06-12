"use client";

import AdminPageHeader from "@/components/admin/PageHeader";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Link from "next/link";
import { Download, Plus, Search, Filter, ChevronRight, FileText, IndianRupee, Clock , Trash2, Eye} from "lucide-react";
import ExportButton from "@/components/ui/ExportButton";
import TableRowActions from "@/components/ui/TableRowActions";
import { deleteSchoolDocument } from "@/lib/deleteSchoolDocument";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

type POStatus = "Pending" | "Approved" | "Received" | "Closed";

type PORow = {
 no: string;
 vendorName: string;
 vendorInitials: string;
 orderDate: string;
 amount: string;
 status: POStatus;
};

type OrderRecord = {
 id: string;
 vendor: string;
 date: string;
 amount: number;
 status: string;
};

function statusTone(status: POStatus) {
 if (status === "Approved") return "bg-blue-50 text-blue-700 border-blue-100";
 if (status === "Received") return "bg-emerald-50 text-emerald-700 border-emerald-100";
 if (status === "Closed") return "bg-slate-50 text-slate-700 border-slate-200";
 return "bg-amber-50 text-amber-700 border-amber-100";
}

const TABS = ["All Orders", "Pending", "Approved", "Received", "Closed"] as const;
type Tab = typeof TABS[number];

export default function AdminPurchaseOrdersPage() {
 const schoolId = "idpskalaburagi";
 const [records, setRecords] = useState<OrderRecord[]>([]);
 const [loading, setLoading] = useState(true);
 const [loadError, setLoadError] = useState<string | null>(null);
 const [queryInput, setQueryInput] = useState("");
 const [tab, setTab] = useState<Tab>("All Orders");
 const [currentPage, setCurrentPage] = useState(1);
 const itemsPerPage = 10;

 useEffect(() => {
 setLoading(true);
 setLoadError(null);
 const qRef = query(collection(db, "schools", schoolId, "purchase_orders"), orderBy("createdAt", "desc"));
 const unsubscribe = onSnapshot(qRef, (snapshot) => {
 const mapped: OrderRecord[] = snapshot.docs.map(doc => {
 const data = doc.data();
 return {
 id: doc.id,
 vendor: data.vendor || "Unknown",
 date: data.date ? new Date(data.date).toLocaleDateString('en-IN') : "-",
 amount: Number(data.amount || data.total || 0),
 status: data.status || "Pending",
 };
 });
 setRecords(mapped);
 setLoading(false);
 }, (err) => {
 console.error("Error loading orders:", err);
 setLoadError("Failed to load orders.");
 setLoading(false);
 });
 return () => unsubscribe();
 }, [schoolId]);

 const pos = useMemo<PORow[]>(() => {
 return records.map((r) => {
 const vendorInitials = r.vendor
 .split(" ")
 .slice(0, 2)
 .map((w) => w[0]?.toUpperCase())
 .join("");
 const mappedStatus: POStatus =
 r.status === "Delivered" ? "Received" : r.status === "Cancelled" ? "Closed" : (r.status as POStatus);
 return {
 no: r.id,
 vendorName: r.vendor,
 vendorInitials: vendorInitials || "PO",
 orderDate: r.date,
 amount: `₹${Number.isFinite(r.amount) ? r.amount.toLocaleString("en-IN") : "0"}`,
 status: mappedStatus,
 };
 });
 }, [records]);

 const filteredPos = useMemo(() => {
 let list = pos;
 if (tab !== "All Orders") {
 list = list.filter((p) => p.status === tab);
 }
 const q = queryInput.trim().toLowerCase();
 if (q) {
 list = list.filter((p) => p.no.toLowerCase().includes(q) || p.vendorName.toLowerCase().includes(q));
 }
 return list;
 }, [pos, tab, queryInput]);

 useEffect(() => {
 setCurrentPage(1);
 }, [queryInput, tab]);

 const paginatedItems = useMemo(() => {
 const start = (currentPage - 1) * itemsPerPage;
 return filteredPos.slice(start, start + itemsPerPage);
 }, [filteredPos, currentPage]);

 const totalPages = Math.max(1, Math.ceil(filteredPos.length / itemsPerPage));

 const stats = useMemo(() => {
 const totalAmount = pos.reduce((sum, p) => {
 const n = Number(String(p.amount).replace(/[^\d.]/g, ""));
 return sum + (Number.isFinite(n) ? n : 0);
 }, 0);
 const pendingApprovals = pos.filter((p) => p.status === "Pending").length;
 return {
 pendingApprovals,
 totalPoAmount: `₹${totalAmount.toLocaleString("en-IN")}`,
 };
 }, [pos]);

 return (
 <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
 {loadError && (
 <div className="rounded-[16px] border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
 {loadError}
 </div>
 )}
  {/* Top Header */}
 <AdminPageHeader
  title="Purchase Orders"
  description="Manage procurement requests and vendor orders"
 />

 {/* KPI Cards */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
 <div>
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pending Approvals</p>
 <div className="mt-2">
 <p className="text-2xl font-extrabold text-gray-900">{stats.pendingApprovals}</p>
 </div>
 </div>
 <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
 <FileText size={18} />
 </div>
 </div>
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
 <div>
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total PO Amount</p>
 <div className="mt-2">
 <p className="text-2xl font-extrabold text-gray-900">{stats.totalPoAmount}</p>
 </div>
 </div>
 <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
 <IndianRupee size={18} />
 </div>
 </div>
 </div>

 {/* Main Content */}
 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
 {/* Tabs */}
 <div className="border-b border-gray-100 bg-gray-50/50 px-4">
 <div className="flex gap-6 overflow-x-auto hide-scrollbar">
 {TABS.map((t) => {
 const active = tab === t;
 return (
 <button
 key={t}
 onClick={() => setTab(t)}
 className={cn(
 "px-1 py-4 text-xs font-bold transition-all whitespace-nowrap border-b-2 relative -mb-px",
 active ? "text-[#144835] border-[#144835]" : "text-gray-500 border-transparent hover:text-gray-900"
 )}
 >
 {t}
 {t === "Pending" && stats.pendingApprovals > 0 && (
 <span className="ml-2 inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
 {stats.pendingApprovals}
 </span>
 )}
 </button>
 );
 })}
 </div>
 </div>

 {/* Controls */}
 <div className="p-4 border-b border-gray-100 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between bg-white">
 <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
 <div className="relative flex-1 min-w-[240px]">
 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
 <input
 value={queryInput}
 onChange={(e) => setQueryInput(e.target.value)}
 className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 pl-9 pr-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all placeholder:text-gray-400"
 placeholder="Search purchase orders..."
 />
 </div>
 </div>
 <div className="flex items-center gap-2 w-full xl:w-auto">
 <ExportButton data={filteredPos} filename="Purchase_Orders" className="h-9 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors" iconSize={14} />
 <Link
 href={`/schools/${schoolId}/admin/inventory/purchase-orders/new`}
 className="h-9 inline-flex items-center gap-2 rounded-lg bg-[#144835] px-4 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 transition-all"
 >
 <Plus size={14} /> New PO
 </Link>
 </div>
 </div>

 {/* Table */}
 <div className="overflow-x-auto min-h-[400px]">
 {loading ? (
 <div className="p-8 flex items-center justify-center">
 <div className="w-6 h-6 border-2 border-[#144835] border-t-transparent rounded-full animate-spin" />
 </div>
 ) : paginatedItems.length === 0 ? (
 <div className="p-8 text-center text-gray-500 text-xs font-bold">No purchase orders found.</div>
 ) : (
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-gray-50/80 border-b border-gray-100">
 <th className="px-4 py-3 text-xs font-extrabold text-gray-500 uppercase tracking-wider">PO Number</th>
 <th className="px-4 py-3 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Vendor</th>
 <th className="px-4 py-3 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Order Date</th>
 <th className="px-4 py-3 text-xs font-extrabold text-gray-500 uppercase tracking-wider text-right">Amount</th>
 <th className="px-4 py-3 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Status</th>
 <th className="w-12 px-2 py-2.5 text-right" aria-label="Row actions"></th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100 text-xs">
 {paginatedItems.map((p) => (
 <tr key={p.no} className="hover:bg-gray-50/50 transition-colors group">
 <td className="px-4 py-3">
 <span className="font-extrabold text-gray-900">{p.no}</span>
 </td>
 <td className="px-4 py-3">
 <div className="flex items-center gap-3">
 <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-600">
 {p.vendorInitials}
 </div>
 <span className="font-bold text-gray-700">{p.vendorName}</span>
 </div>
 </td>
 <td className="px-4 py-3 font-bold text-gray-600">{p.orderDate}</td>
 <td className="px-4 py-3 text-right font-extrabold text-gray-900">{p.amount}</td>
 <td className="px-4 py-3">
 <span className={cn("px-2 py-1 rounded-md text-xs font-bold border", statusTone(p.status))}>
 {p.status}
 </span>
 </td>
 <td className="px-4 py-3 text-right">
 <TableRowActions
 items={[
 { label: "View", icon: Eye, onClick: () => {} },
 {
 label: "Delete",
 icon: Trash2,
 destructive: true,
 dividerBefore: true,
 confirmMessage: `Delete purchase order ${p.no}? This cannot be undone.`,
 onClick: () => deleteSchoolDocument(schoolId, "purchase_orders", p.no),
 },
 ]}
 />
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 )}
 </div>

 {/* Pagination Footer */}
 <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
 Showing <span className="font-extrabold text-gray-900">{filteredPos.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to <span className="font-extrabold text-gray-900">{Math.min(currentPage * itemsPerPage, filteredPos.length)}</span> of{" "}
 <span className="font-extrabold text-gray-900">{filteredPos.length}</span> entries
 </p>
 <div className="flex items-center gap-2">
 <button 
 type="button" 
 onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
 disabled={currentPage === 1}
 className="h-8 w-8 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Previous">
 ‹
 </button>
 
 {Array.from({ length: totalPages }).map((_, i) => {
 const p = i + 1;
 if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
 return (
 <button 
 key={p}
 type="button" 
 onClick={() => setCurrentPage(p)}
 className={cn("h-8 w-8 rounded-lg text-xs font-extrabold transition-colors", currentPage === p ? "bg-[#144835] text-white shadow-md shadow-[#144835]/15" : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50")}
 >
 {p}
 </button>
 );
 }
 if (p === currentPage - 2 || p === currentPage + 2) {
 return <span key={p} className="px-1 text-gray-400 text-xs font-extrabold">…</span>;
 }
 return null;
 })}

 <button 
 type="button" 
 onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
 disabled={currentPage === totalPages}
 className="h-8 w-8 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Next">
 ›
 </button>
 </div>
 </div>
 </div>
 </div>
 );
}
