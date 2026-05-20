"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Download, Search, Filter, Plus, FileText, ChevronRight, CheckCircle2, AlertCircle, Laptop, Projector, BookOpen, Sofa, CalendarDays, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import ExportButton from "@/components/ui/ExportButton";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

type AssetStatus = "Active" | "Maintenance" | "Disposed";

type AssetRow = {
 id: string;
 name: string;
 category: string;
 cost: string;
 depRate: string;
 status: AssetStatus;
 icon: "laptop" | "projector" | "books" | "furniture";
};

type AssetRecord = {
 id: string;
 name: string;
 category: string;
 location: string;
 status: string;
 purchaseDate: string;
 value: number;
};

function statusTone(status: AssetStatus) {
 if (status === "Active") return "text-emerald-700";
 if (status === "Maintenance") return "text-slate-600";
 return "text-rose-700";
}

function statusDot(status: AssetStatus) {
 if (status === "Active") return "bg-emerald-500";
 if (status === "Maintenance") return "bg-slate-400";
 return "bg-rose-500";
}

function categoryPill(category: string) {
 const key = category.toLowerCase();
 if (key.includes("it")) return "bg-blue-50 text-blue-700";
 if (key.includes("book")) return "bg-amber-50 text-amber-800";
 if (key.includes("furn")) return "bg-purple-50 text-purple-700";
 return "bg-slate-100 text-slate-700";
}

function AssetIcon({ kind }: { kind: AssetRow["icon"] }) {
 const base = "h-9 w-9 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600";
 if (kind === "laptop") return <div className={base}><Laptop size={14} /></div>;
 if (kind === "projector") return <div className={base}><Projector size={14} /></div>;
 if (kind === "books") return <div className={base}><BookOpen size={14} /></div>;
 return <div className={base}><Sofa size={14} /></div>;
}

export default function AdminAssetsPage() {
 const schoolId = "idpskalaburagi";
 const [records, setRecords] = useState<AssetRecord[]>([]);
 const [loading, setLoading] = useState(true);
 const [loadError, setLoadError] = useState<string | null>(null);
 const [queryInput, setQueryInput] = useState("");
 const [currentPage, setCurrentPage] = useState(1);
 const itemsPerPage = 10;
 const [categoryFilter, setCategoryFilter] = useState("All Categories");
 const [statusFilter, setStatusFilter] = useState<"All Status" | AssetStatus>("All Status");

 useEffect(() => {
 setLoading(true);
 setLoadError(null);
 const qRef = query(collection(db, "schools", schoolId, "assets"), orderBy("createdAt", "desc"));
 const unsubscribe = onSnapshot(qRef, (snapshot) => {
 const mapped: AssetRecord[] = snapshot.docs.map(doc => {
 const data = doc.data();
 return {
 id: doc.id,
 name: data.name || "Unknown",
 category: data.category || "Unknown",
 location: data.location || "-",
 status: data.status || "Active",
 purchaseDate: data.purchaseDate ? new Date(data.purchaseDate).toLocaleDateString('en-IN') : "-",
 value: Number(data.value || 0),
 };
 });
 setRecords(mapped);
 setLoading(false);
 }, (err) => {
 console.error("Error loading assets:", err);
 setLoadError("Failed to load assets.");
 setLoading(false);
 });
 return () => unsubscribe();
 }, [schoolId]);

 const assets = useMemo<AssetRow[]>(() => {
 return records.map((r) => {
 const cat = String(r.category || "");
 const lc = cat.toLowerCase();
 const icon: AssetRow["icon"] = lc.includes("book") ? "books" : lc.includes("furn") ? "furniture" : lc.includes("elect") ? "projector" : "laptop";
 const status: AssetStatus = String(r.status).toLowerCase().includes("repair") ? "Maintenance" : String(r.status).toLowerCase().includes("disposed") ? "Disposed" : "Active";
 return {
 id: r.id,
 name: r.name,
 category: r.category,
 cost: `₹${Number.isFinite(r.value) ? r.value.toLocaleString("en-IN") : "0"}`,
 depRate: "—",
 status,
 icon,
 };
 });
 }, [records]);

 const categoryOptions = useMemo(() => {
 const cats = Array.from(new Set(assets.map((a) => a.category).filter(Boolean)));
 cats.sort((a, b) => a.localeCompare(b));
 return ["All Categories", ...cats];
 }, [assets]);

 useEffect(() => {
 if (!categoryOptions.includes(categoryFilter)) setCategoryFilter("All Categories");
 }, [categoryOptions, categoryFilter]);

 const filteredAssets = useMemo(() => {
 const q = queryInput.trim().toLowerCase();
 return assets.filter((a) => {
 const matchQ = !q || a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q);
 const matchCategory = categoryFilter === "All Categories" || a.category === categoryFilter;
 const matchStatus = statusFilter === "All Status" || a.status === statusFilter;
 return matchQ && matchCategory && matchStatus;
 });
 }, [assets, queryInput, categoryFilter, statusFilter]);

 useEffect(() => {
 setCurrentPage(1);
 }, [queryInput, categoryFilter, statusFilter]);

 const paginatedItems = useMemo(() => {
 const start = (currentPage - 1) * itemsPerPage;
 return filteredAssets.slice(start, start + itemsPerPage);
 }, [filteredAssets, currentPage]);

 const totalPages = Math.max(1, Math.ceil(filteredAssets.length / itemsPerPage));

 const stats = useMemo(() => {
 const totalAssets = assets.length;
 const totalValue = assets.reduce((sum, a) => sum + Number(String(a.cost).replace(/[^\d.]/g, "") || 0), 0);
 const activeAssets = assets.filter((a) => a.status === "Active").length;
 const disposedAssets = assets.filter((a) => a.status === "Disposed").length;
 return {
 totalAssets,
 totalValue: `₹${totalValue.toLocaleString("en-IN")}`,
 activeAssets,
 depreciatedValue: "—",
 disposedAssets,
 ytdDepreciation: "—",
 };
 }, [assets]);

 return (
 <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
 {loadError && (
 <div className="rounded-[16px] border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
 {loadError}
 </div>
 )}
 {/* KPI Cards */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm p-4 flex items-start justify-between">
 <div>
 <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Inventory</p>
 <div className="mt-2">
 <p className="text-2xl font-extrabold text-gray-900">{stats.totalAssets}</p>
 <p className="text-[10px] font-bold text-gray-400 mt-1">{stats.totalValue} Total Value</p>
 </div>
 </div>
 <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
 <FileText size={18} />
 </div>
 </div>
 <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm p-4 flex items-start justify-between">
 <div>
 <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Active Assets</p>
 <div className="mt-2">
 <p className="text-2xl font-extrabold text-gray-900">{stats.activeAssets}</p>
 <div className="flex items-center gap-4 mt-2">
 <div className="flex items-center gap-1.5">
 <div className="h-2 w-2 rounded-full bg-emerald-500" />
 <span className="text-[10px] font-bold text-gray-500">Active</span>
 </div>
 <div className="flex items-center gap-1.5">
 <div className="h-2 w-2 rounded-full bg-slate-400" />
 <span className="text-[10px] font-bold text-gray-500">Maintenance</span>
 </div>
 </div>
 </div>
 </div>
 <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
 <CheckCircle2 size={18} />
 </div>
 </div>
 <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm p-4 flex items-start justify-between">
 <div>
 <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Disposed</p>
 <div className="mt-2">
 <p className="text-2xl font-extrabold text-gray-900">{stats.disposedAssets}</p>
 <p className="text-[10px] font-bold text-gray-400 mt-1">{stats.depreciatedValue} Depreciated</p>
 </div>
 </div>
 <div className="h-10 w-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
 <AlertCircle size={18} />
 </div>
 </div>
 </div>

 {/* Main Content */}
 <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
 {/* Header & Filters */}
 <div className="p-4 border-b border-gray-100 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between bg-gray-50/50">
 <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
 <div className="relative w-full sm:w-[260px]">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
 <input
 className="w-full h-9 bg-white border border-gray-200 rounded-lg pl-9 pr-4 text-[11px] font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 placeholder="Search assets..."
 value={queryInput}
 onChange={(e) => setQueryInput(e.target.value)}
 />
 </div>
 <div className="relative w-full sm:w-[160px]">
 <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
 <select
 className="w-full h-9 appearance-none bg-white border border-gray-200 rounded-lg pl-9 pr-8 text-[11px] font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm cursor-pointer"
 value={categoryFilter}
 onChange={(e) => setCategoryFilter(e.target.value)}
 >
 {categoryOptions.map((c) => (
 <option key={c} value={c}>{c}</option>
 ))}
 </select>
 <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" size={14} />
 </div>
 <div className="relative w-full sm:w-[140px]">
 <select
 className="w-full h-9 appearance-none bg-white border border-gray-200 rounded-lg px-3 pr-8 text-[11px] font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm cursor-pointer"
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value as any)}
 >
 <option value="All Status">All Status</option>
 <option value="Active">Active</option>
 <option value="Maintenance">Maintenance</option>
 <option value="Disposed">Disposed</option>
 </select>
 <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" size={14} />
 </div>
 </div>
 <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end">
 <ExportButton data={filteredAssets} filename="Export" className="h-9 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-[11px] font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors" iconSize={14} />
 <Link
 href={`/schools/${schoolId}/admin/inventory/assets/new`}
 className="h-9 inline-flex items-center gap-2 rounded-lg bg-[#144835] px-4 text-[11px] font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 transition-all"
 >
 <Plus size={14} /> Add Asset
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
 <div className="p-8 text-center text-gray-500 text-xs font-bold">No assets found.</div>
 ) : (
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-gray-50/80 border-b border-gray-100">
 <th className="px-4 py-3 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Asset Info</th>
 <th className="px-4 py-3 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Category</th>
 <th className="px-4 py-3 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Orig. Cost</th>
 <th className="px-4 py-3 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Status</th>
 <th className="px-4 py-3 text-right text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100 text-[11px]">
 {paginatedItems.map((a) => (
 <tr key={a.id} className="hover:bg-gray-50/50 transition-colors group">
 <td className="px-4 py-3">
 <div className="flex items-center gap-3">
 <AssetIcon kind={a.icon} />
 <div>
 <p className="font-extrabold text-gray-900">{a.name}</p>
 <p className="text-[10px] font-bold text-gray-400 mt-0.5">{a.id}</p>
 </div>
 </div>
 </td>
 <td className="px-4 py-3">
 <span className={cn("px-2 py-1 rounded-md text-[10px] font-bold", categoryPill(a.category))}>
 {a.category}
 </span>
 </td>
 <td className="px-4 py-3 font-extrabold text-gray-700">{a.cost}</td>
 <td className="px-4 py-3">
 <div className="flex items-center gap-1.5">
 <div className={cn("h-1.5 w-1.5 rounded-full", statusDot(a.status))} />
 <span className={cn("font-bold", statusTone(a.status))}>{a.status}</span>
 </div>
 </td>
 <td className="px-4 py-3 text-right">
 <button type="button" className="h-7 px-3 rounded-md bg-white border border-gray-200 text-[10px] font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm">
 View
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 )}
 </div>

 {/* Pagination Footer */}
 <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
 <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
 Showing <span className="font-extrabold text-gray-900">{filteredAssets.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to <span className="font-extrabold text-gray-900">{Math.min(currentPage * itemsPerPage, filteredAssets.length)}</span> of{" "}
 <span className="font-extrabold text-gray-900">{filteredAssets.length}</span> entries
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
 className={cn("h-8 w-8 rounded-lg text-[10px] font-extrabold transition-colors", currentPage === p ? "bg-[#144835] text-white shadow-md shadow-[#144835]/15" : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50")}
 >
 {p}
 </button>
 );
 }
 if (p === currentPage - 2 || p === currentPage + 2) {
 return <span key={p} className="px-1 text-gray-400 text-[10px] font-extrabold">…</span>;
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
