"use client";

import { useSchoolId } from "@/hooks/useSchoolId";
import AdminPageHeader from "@/components/admin/PageHeader";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { clsx, type ClassValue } from "clsx";
import Link from "next/link";
const SafeLink = Link as any;
;
import { twMerge } from "tailwind-merge";
import { Download, Eye, Pencil, Search, UserCheck, UserMinus, UserPlus, UserX, Phone, Mail, Users, ChevronRight, CalendarCheck2 , Trash2} from "lucide-react";
import ExportButton from "@/components/ui/ExportButton";
import TableRowActions from "@/components/ui/TableRowActions";
import { deleteSchoolDocument } from "@/lib/deleteSchoolDocument";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

type LeadStatus = "Qualified" | "Converted" | "Pending" | "Lost";
type LeadSource = "Website" | "Referral" | "Phone";

type LeadRow = {
 id: string;
 studentName: string;
 parentName: string;
 email: string;
 phone: string;
 source: LeadSource;
 status: LeadStatus;
};

function statusTone(status: LeadStatus) {
 if (status === "Qualified") return "bg-blue-50 text-blue-800 border-blue-100";
 if (status === "Converted") return "bg-emerald-50 text-emerald-800 border-emerald-100";
 if (status === "Pending") return "bg-amber-50 text-amber-900 border-amber-100";
 return "bg-rose-50 text-rose-800 border-rose-100";
}

function sourceTone(source: LeadSource) {
 if (source === "Website") return "bg-slate-100 text-slate-700 border-slate-200";
 if (source === "Referral") return "bg-slate-100 text-slate-700 border-slate-200";
 return "bg-slate-100 text-slate-700 border-slate-200";
}

export default function AdminAdmissionLeadsPage() {
 const schoolId = useSchoolId();
 const [leads, setLeads] = useState<LeadRow[]>([]);
 const [loading, setLoading] = useState(true);
 const [loadError, setLoadError] = useState<string | null>(null);

 const [queryInput, setQueryInput] = useState("");
 const [sourceFilter, setSourceFilter] = useState("All Sources");
 const [statusFilter, setStatusFilter] = useState<"All Status" | LeadStatus>("All Status");
 const [currentPage, setCurrentPage] = useState(1);
 const itemsPerPage = 10;

 useEffect(() => {
 setLoading(true);
 setLoadError(null);
 const qRef = query(collection(db, "schools", schoolId, "leads"), orderBy("createdAt", "desc"));
 const unsubscribe = onSnapshot(qRef, (snapshot) => {
 const list: LeadRow[] = snapshot.docs.map(doc => {
 const data = doc.data();
 return {
 id: doc.id,
 studentName: data.studentName || data.name || "Unknown",
 parentName: data.parentName || "Unknown",
 phone: data.phone || "-",
 email: data.email || "-",
 source: (data.source as LeadSource) || "Website",
 status: (data.status as LeadStatus) || "Pending",
 };
 });
 setLeads(list);
 setLoading(false);
 }, (err) => {
 console.error("Error loading leads:", err);
 setLoadError("Failed to load leads.");
 setLoading(false);
 });
 return () => unsubscribe();
 }, [schoolId]);

 const stats = useMemo(() => {
 const totalLeads = leads.length;
 const qualified = leads.filter((l) => l.status === "Qualified").length;
 const converted = leads.filter((l) => l.status === "Converted").length;
 const pending = leads.filter((l) => l.status === "Pending").length;
 const lost = leads.filter((l) => l.status === "Lost").length;
 const pct = (n: number) => (totalLeads ? Math.round((n / totalLeads) * 100) : 0);
 return {
 totalLeads,
 qualified,
 qualifiedPct: pct(qualified),
 converted,
 convertedPct: pct(converted),
 pending,
 pendingPct: pct(pending),
 lost,
 lostPct: pct(lost),
 session: "2024-25",
 };
 }, [leads]);

 const sourceOptions = useMemo(() => {
 const sources = Array.from(new Set(leads.map((l) => l.source).filter(Boolean)));
 sources.sort((a, b) => a.localeCompare(b));
 return ["All Sources", ...sources];
 }, [leads]);

 useEffect(() => {
 if (!sourceOptions.includes(sourceFilter)) setSourceFilter("All Sources");
 }, [sourceOptions, sourceFilter]);

 const filteredLeads = useMemo(() => {
 const q = queryInput.trim().toLowerCase();
 return leads.filter((l) => {
 const matchQ = !q || l.studentName.toLowerCase().includes(q) || l.parentName.toLowerCase().includes(q);
 const matchSource = sourceFilter === "All Sources" || l.source === sourceFilter;
 const matchStatus = statusFilter === "All Status" || l.status === statusFilter;
 return matchQ && matchSource && matchStatus;
 });
 }, [leads, queryInput, sourceFilter, statusFilter]);

 useEffect(() => {
 setCurrentPage(1);
 }, [queryInput, sourceFilter, statusFilter]);

 const paginatedItems = useMemo(() => {
 const start = (currentPage - 1) * itemsPerPage;
 return filteredLeads.slice(start, start + itemsPerPage);
 }, [filteredLeads, currentPage]);

 const totalPages = Math.max(1, Math.ceil(filteredLeads.length / itemsPerPage));

 return (
 <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
 {loadError && (
 <div className="rounded-[16px] border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
 {loadError}
 </div>
 )}
 <AdminPageHeader
  title="Leads"
  description="Manage prospective student leads through the admissions pipeline"
  actions={
   <>
 <SafeLink
 href={`/schools/${schoolId}/admin/admission/leads/new`}
 className="h-9 inline-flex items-center gap-2 rounded-lg bg-[#144835] px-4 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 transition-all"
 >
 <UserPlus size={14} /> New Lead
 </SafeLink>
 <ExportButton data={filteredLeads} filename="Export" className="h-9 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors" iconSize={14} />
   </>
  }
 />

 {/* KPI Stats Grid */}
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
 {/* KPI 1 */}
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col relative overflow-hidden group">
 <div className="flex items-center justify-between mb-3">
 <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
 <Users size={18} />
 </div>
 <span className="text-xs font-extrabold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{stats.session}</span>
 </div>
 <div>
 <p className="text-2xl font-bold text-gray-900 tracking-tight">{stats.totalLeads}</p>
 <p className="text-xs font-bold text-gray-500 mt-0.5 uppercase tracking-wider">Total Leads</p>
 </div>
 <div className="absolute -bottom-6 -right-6 text-blue-50 opacity-50 group-hover:scale-150 transition-transform duration-500">
 <Users size={80} />
 </div>
 </div>

 {/* KPI 2 */}
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col relative overflow-hidden group">
 <div className="flex items-center justify-between mb-3">
 <div className="h-10 w-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
 <UserCheck size={18} />
 </div>
 <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{stats.qualifiedPct}%</span>
 </div>
 <div>
 <p className="text-2xl font-bold text-gray-900 tracking-tight">{stats.qualified}</p>
 <p className="text-xs font-bold text-gray-500 mt-0.5 uppercase tracking-wider">Qualified</p>
 </div>
 <div className="absolute -bottom-6 -right-6 text-indigo-50 opacity-50 group-hover:scale-150 transition-transform duration-500">
 <UserCheck size={80} />
 </div>
 </div>

 {/* KPI 3 */}
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col relative overflow-hidden group">
 <div className="flex items-center justify-between mb-3">
 <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
 <CalendarCheck2 size={18} />
 </div>
 <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{stats.convertedPct}%</span>
 </div>
 <div>
 <p className="text-2xl font-bold text-gray-900 tracking-tight">{stats.converted}</p>
 <p className="text-xs font-bold text-gray-500 mt-0.5 uppercase tracking-wider">Converted</p>
 </div>
 <div className="absolute -bottom-6 -right-6 text-emerald-50 opacity-50 group-hover:scale-150 transition-transform duration-500">
 <CalendarCheck2 size={80} />
 </div>
 </div>

 {/* KPI 4 */}
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col relative overflow-hidden group">
 <div className="flex items-center justify-between mb-3">
 <div className="h-10 w-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
 <UserMinus size={18} />
 </div>
 <span className="text-xs font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{stats.pendingPct}%</span>
 </div>
 <div>
 <p className="text-2xl font-bold text-gray-900 tracking-tight">{stats.pending}</p>
 <p className="text-xs font-bold text-gray-500 mt-0.5 uppercase tracking-wider">Pending</p>
 </div>
 <div className="absolute -bottom-6 -right-6 text-amber-50 opacity-50 group-hover:scale-150 transition-transform duration-500">
 <UserMinus size={80} />
 </div>
 </div>

 {/* KPI 5 */}
 <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col relative overflow-hidden group">
 <div className="flex items-center justify-between mb-3">
 <div className="h-10 w-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
 <UserX size={18} />
 </div>
 <span className="text-xs font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">{stats.lostPct}%</span>
 </div>
 <div>
 <p className="text-2xl font-bold text-gray-900 tracking-tight">{stats.lost}</p>
 <p className="text-xs font-bold text-gray-500 mt-0.5 uppercase tracking-wider">Lost</p>
 </div>
 <div className="absolute -bottom-6 -right-6 text-rose-50 opacity-50 group-hover:scale-150 transition-transform duration-500">
 <UserX size={80} />
 </div>
 </div>
 </div>

 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
 {/* Filters */}
 <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-gray-50/50">
 <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
 <div className="relative w-full sm:w-[260px]">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
 <input
 className="w-full h-9 bg-white border border-gray-200 rounded-lg pl-9 pr-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 placeholder="Search leads..."
 value={queryInput}
 onChange={(e) => setQueryInput(e.target.value)}
 />
 </div>
 <div className="relative w-full sm:w-[160px]">
 <select
 className="w-full h-9 appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-8 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm cursor-pointer"
 value={sourceFilter}
 onChange={(e) => setSourceFilter(e.target.value)}
 >
 {sourceOptions.map((so) => (
 <option key={so} value={so}>{so}</option>
 ))}
 </select>
 <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" size={14} />
 </div>
 <div className="relative w-full sm:w-[140px]">
 <select
 className="w-full h-9 appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-8 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm cursor-pointer"
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value as any)}
 >
 <option value="All Status">All Status</option>
 <option value="Pending">Pending</option>
 <option value="Qualified">Qualified</option>
 <option value="Converted">Converted</option>
 <option value="Lost">Lost</option>
 </select>
 <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" size={14} />
 </div>
 </div>
 </div>

 {/* Table */}
 <div className="overflow-x-auto min-h-[400px]">
 {loading ? (
 <div className="p-8 flex items-center justify-center">
 <div className="w-6 h-6 border-2 border-[#144835] border-t-transparent rounded-full animate-spin" />
 </div>
 ) : paginatedItems.length === 0 ? (
 <div className="p-8 text-center text-gray-500 text-xs font-bold">No leads found matching your criteria.</div>
 ) : (
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-gray-50/80 border-b border-gray-100">
 <th className="px-4 py-3 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Lead Info</th>
 <th className="px-4 py-3 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Contact</th>
 <th className="px-4 py-3 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Source</th>
 <th className="px-4 py-3 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Status</th>
 <th className="w-12 px-2 py-2.5 text-right" aria-label="Row actions"></th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {paginatedItems.map((l) => (
 <tr key={l.id} className="hover:bg-gray-50/50 transition-colors group">
 <td className="px-4 py-2.5">
 <p className="text-xs font-bold text-gray-900">{l.studentName}</p>
 <div className="flex items-center gap-1.5 mt-0.5">
 <span className="text-xs font-bold text-[#144835]">#{l.id}</span>
 <span className="text-xs font-medium text-gray-500">Parent: {l.parentName}</span>
 </div>
 </td>
 <td className="px-4 py-2.5">
 <div className="space-y-0.5">
 <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
 <Phone size={12} className="text-gray-400" />
 <span>{l.phone}</span>
 </div>
 <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
 <Mail size={12} className="text-gray-400" />
 <span>{l.email}</span>
 </div>
 </div>
 </td>
 <td className="px-4 py-2.5">
 <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border", sourceTone(l.source))}>
 {l.source}
 </span>
 </td>
 <td className="px-4 py-2.5">
 <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border", statusTone(l.status))}>
 {l.status}
 </span>
 </td>
 <td className="px-4 py-2.5 text-right">
 <TableRowActions
 items={[
 { label: "View", icon: Eye, onClick: () => {} },
 { label: "Call", icon: Phone, onClick: () => { if (l.phone) window.location.href = `tel:${l.phone}`; } },
 { label: "Edit", icon: Pencil, onClick: () => {} },
 {
 label: "Delete",
 icon: Trash2,
 destructive: true,
 dividerBefore: true,
 confirmMessage: `Delete lead ${l.studentName}? This cannot be undone.`,
 onClick: () => deleteSchoolDocument(schoolId, "leads", l.id),
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
 <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs font-semibold text-gray-500">
 <p>
 Showing <span className="font-extrabold text-gray-900">{filteredLeads.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to <span className="font-extrabold text-gray-900">{Math.min(currentPage * itemsPerPage, filteredLeads.length)}</span> of{" "}
 <span className="font-extrabold text-gray-900">{filteredLeads.length}</span> leads
 </p>
 <div className="flex items-center gap-1.5">
 <button 
 type="button" 
 onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
 disabled={currentPage === 1}
 className="h-8 px-2.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
 Previous
 </button>
 
 {Array.from({ length: totalPages }).map((_, i) => {
 const p = i + 1;
 if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
 return (
 <button 
 key={p}
 type="button" 
 onClick={() => setCurrentPage(p)}
 className={currentPage === p ? "h-8 w-8 rounded-lg bg-[#144835] text-white text-xs font-bold shadow-md shadow-[#144835]/20" : "h-8 w-8 rounded-lg border border-gray-200 bg-white text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors shadow-sm"}
 >
 {p}
 </button>
 );
 }
 if (p === currentPage - 2 || p === currentPage + 2) {
 return <span key={p} className="px-1 text-gray-400 text-xs font-bold">…</span>;
 }
 return null;
 })}

 <button 
 type="button" 
 onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
 disabled={currentPage === totalPages}
 className="h-8 px-2.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
 Next
 </button>
 </div>
 </div>
 </div>
 </div>
 );
}
