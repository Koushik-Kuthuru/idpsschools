"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Link from "next/link";
import { Download, Pencil, Plus, Search, Trash2, ChevronRight, Package, AlertTriangle, Ban, Filter } from "lucide-react";
import ExportButton from "@/components/ui/ExportButton";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

type StockStatus = "Available" | "Low Stock" | "Out of Stock";

type StockRow = {
 code: string;
 name: string;
 subtitle: string;
 category: string;
 qty: number;
 reorder: number;
 status: StockStatus;
};

type StockItem = {
 id: string;
 item: string;
 category: string;
 quantity: number;
 unit: string;
 reorderLevel: number;
};

function statusTone(status: StockStatus) {
 if (status === "Available") return "bg-emerald-50 text-emerald-800 border-emerald-100";
 if (status === "Low Stock") return "bg-amber-50 text-amber-900 border-amber-100";
 return "bg-rose-50 text-rose-700 border-rose-100";
}

export default function AdminStockPage() {
 const schoolId = "idpskalaburagi";
 const [items, setItems] = useState<StockItem[]>([]);
 const [loading, setLoading] = useState(true);
 const [loadError, setLoadError] = useState<string | null>(null);
 const [queryInput, setQueryInput] = useState("");
 const [currentPage, setCurrentPage] = useState(1);
 const itemsPerPage = 10;
 const [categoryFilter, setCategoryFilter] = useState("All Categories");
 const [statusFilter, setStatusFilter] = useState<"Stock Status" | StockStatus>("Stock Status");

 useEffect(() => {
 setLoading(true);
 setLoadError(null);
 const qRef = query(collection(db, "schools", schoolId, "stock"), orderBy("createdAt", "desc"));
 const unsubscribe = onSnapshot(qRef, (snapshot) => {
 const mapped: StockItem[] = snapshot.docs.map(doc => {
 const data = doc.data();
 return {
 id: doc.id,
 item: data.item || data.name || "Unknown",
 category: data.category || "Unknown",
 quantity: Number(data.quantity || 0),
 unit: data.unit || "pcs",
 reorderLevel: Number(data.reorderLevel || data.minLevel || 10),
 };
 });
 setItems(mapped);
 setLoading(false);
 }, (err) => {
 console.error("Error loading stock:", err);
 setLoadError("Failed to load stock.");
 setLoading(false);
 });
 return () => unsubscribe();
 }, [schoolId]);

 const stock = useMemo<StockRow[]>(() => {
 return items.map((i) => {
 const qty = Number.isFinite(i.quantity) ? i.quantity : 0;
 const reorder = Number.isFinite(i.reorderLevel) ? i.reorderLevel : 0;
 const status: StockStatus = qty <= 0 ? "Out of Stock" : qty <= reorder ? "Low Stock" : "Available";
 return {
 code: i.id,
 name: i.item,
 subtitle: i.unit ? `(${i.unit})` : "",
 category: i.category,
 qty,
 reorder,
 status,
 };
 });
 }, [items]);

 const categoryOptions = useMemo(() => {
 const cats = Array.from(new Set(stock.map((s) => s.category).filter(Boolean)));
 cats.sort((a, b) => a.localeCompare(b));
 return ["All Categories", ...cats];
 }, [stock]);

 useEffect(() => {
 if (!categoryOptions.includes(categoryFilter)) setCategoryFilter("All Categories");
 }, [categoryOptions, categoryFilter]);

 const filteredStock = useMemo(() => {
 const q = queryInput.trim().toLowerCase();
 return stock.filter((s) => {
 const matchQ = !q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
 const matchCategory = categoryFilter === "All Categories" || s.category === categoryFilter;
 const matchStatus = statusFilter === "Stock Status" || s.status === statusFilter;
 return matchQ && matchCategory && matchStatus;
 });
 }, [stock, queryInput, categoryFilter, statusFilter]);

 useEffect(() => {
 setCurrentPage(1);
 }, [queryInput, categoryFilter, statusFilter]);

 const paginatedItems = useMemo(() => {
 const start = (currentPage - 1) * itemsPerPage;
 return filteredStock.slice(start, start + itemsPerPage);
 }, [filteredStock, currentPage]);

 const totalPages = Math.max(1, Math.ceil(filteredStock.length / itemsPerPage));

 const stats = useMemo(() => {
 const totalItems = stock.length;
 const lowStock = stock.filter((s) => s.status === "Low Stock").length;
 const outOfStock = stock.filter((s) => s.status === "Out of Stock").length;
 return { totalItems, lowStock, outOfStock };
 }, [stock]);

 return (
 <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
 {loadError && (
 <div className="rounded-[16px] border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
 {loadError}
 </div>
 )}
 {/* KPI Cards */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm p-4 flex items-center justify-between">
 <div>
 <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Items</p>
 <div className="mt-2">
 <p className="text-2xl font-extrabold text-gray-900">{stats.totalItems}</p>
 </div>
 </div>
 <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
 <Package size={18} />
 </div>
 </div>
 <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm p-4 flex items-center justify-between">
 <div>
 <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Low Stock</p>
 <div className="mt-2">
 <p className="text-2xl font-extrabold text-gray-900">{stats.lowStock}</p>
 </div>
 </div>
 <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
 <AlertTriangle size={18} />
 </div>
 </div>
 <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm p-4 flex items-center justify-between">
 <div>
 <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Out of Stock</p>
 <div className="mt-2">
 <p className="text-2xl font-extrabold text-gray-900">{stats.outOfStock}</p>
 </div>
 </div>
 <div className="h-10 w-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
 <Ban size={18} />
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
 placeholder="Search items by name or code..."
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
 <option value="Stock Status">Stock Status</option>
 <option value="Available">Available</option>
 <option value="Low Stock">Low Stock</option>
 <option value="Out of Stock">Out of Stock</option>
 </select>
 <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" size={14} />
 </div>
 </div>
 <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end">
 <ExportButton data={filteredStock} filename="Export" className="h-9 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-[11px] font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors" iconSize={14} />
 <Link
 href={`/schools/${schoolId}/admin/inventory/stock/new`}
 className="h-9 inline-flex items-center gap-2 rounded-lg bg-[#144835] px-4 text-[11px] font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 transition-all"
 >
 <Plus size={14} /> Add Stock
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
 <div className="p-8 text-center text-gray-500 text-xs font-bold">No stock items found.</div>
 ) : (
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-gray-50/80 border-b border-gray-100">
 <th className="px-4 py-3 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Item Details</th>
 <th className="px-4 py-3 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Category</th>
 <th className="px-4 py-3 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider text-right">In Stock</th>
 <th className="px-4 py-3 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider text-right">Reorder At</th>
 <th className="px-4 py-3 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Status</th>
 <th className="px-4 py-3 text-right text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100 text-[11px]">
 {paginatedItems.map((s) => (
 <tr key={s.code} className="hover:bg-gray-50/50 transition-colors group">
 <td className="px-4 py-3">
 <div>
 <p className="font-extrabold text-gray-900">{s.name}</p>
 <p className="text-[10px] font-bold text-gray-400 mt-0.5">{s.code}</p>
 </div>
 </td>
 <td className="px-4 py-3">
 <span className="font-bold text-gray-600">{s.category}</span>
 </td>
 <td className="px-4 py-3 text-right font-extrabold text-gray-900">
 {s.qty} <span className="text-[10px] text-gray-400 font-medium">{s.subtitle}</span>
 </td>
 <td className="px-4 py-3 text-right font-bold text-gray-500">
 {s.reorder}
 </td>
 <td className="px-4 py-3">
 <span className={cn("px-2 py-1 rounded-md text-[10px] font-bold border", statusTone(s.status))}>
 {s.status}
 </span>
 </td>
 <td className="px-4 py-3 text-right">
 <button type="button" className="h-7 px-3 rounded-md bg-white border border-gray-200 text-[10px] font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm">
 Edit
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
 Showing <span className="font-extrabold text-gray-900">{filteredStock.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to <span className="font-extrabold text-gray-900">{Math.min(currentPage * itemsPerPage, filteredStock.length)}</span> of{" "}
 <span className="font-extrabold text-gray-900">{filteredStock.length}</span> entries
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