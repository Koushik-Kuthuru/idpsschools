"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Filter, Download, AlertCircle, CheckCircle2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ExportButton from "@/components/ui/ExportButton";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

export default function AuditLogsPage() {
 const [searchTerm, setSearchTerm] = useState("");
 const [auditLogs, setAuditLogs] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 setLoading(true);
 const unsub = onSnapshot(
 query(collection(db, "audit_logs"), orderBy("createdAt", "desc"), limit(200)),
 (snap) => {
 setAuditLogs(
 snap.docs.map((d) => {
 const data = d.data() as any;
 return {
 id: d.id,
 action: data.action ?? "-",
 entity: data.entity ?? "-",
 details: data.details ?? "-",
 status: data.status ?? "Success",
 schoolId: data.schoolId ?? null,
 user: {
 name: data.userName ?? data.user?.name ?? "Unknown",
 email: data.userEmail ?? data.user?.email ?? "-",
 role: data.role ?? data.user?.role ?? "-",
 },
 createdAt: data.createdAt,
 };
 })
 );
 setLoading(false);
 },
 (err) => {
 console.error("Error listening audit logs:", err);
 setAuditLogs([]);
 setLoading(false);
 }
 );
 return () => unsub();
 }, []);

 const filteredLogs = useMemo(() => {
 const q = searchTerm.trim().toLowerCase();
 if (!q) return auditLogs;
 return auditLogs.filter((log) => {
 const details = String(log.details ?? "").toLowerCase();
 const userName = String(log.user?.name ?? "").toLowerCase();
 const action = String(log.action ?? "").toLowerCase();
 const entity = String(log.entity ?? "").toLowerCase();
 const schoolId = String(log.schoolId ?? "").toLowerCase();
 return (
 details.includes(q) ||
 userName.includes(q) ||
 action.includes(q) ||
 entity.includes(q) ||
 schoolId.includes(q)
 );
 });
 }, [auditLogs, searchTerm]);

 if (loading) {
 return (
 <div className="flex h-96 items-center justify-center">
 <div className="w-10 h-10 border-4 border-[#144835]/30 border-t-[#144835] rounded-full animate-spin"></div>
 </div>
 );
 }

 return (
 <div className="space-y-8 animate-in fade-in duration-500 font-jost pb-10">

 {/* Premium Header */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h1 className="text-xl font-bold text-[#1A1A1A]">Audit Logs</h1>
 <p className="text-gray-500 text-xs mt-1">Monitor and track user activities, system events, and security logs across the ERP.</p>
 </div>
 <ExportButton data={filteredLogs} filename="Audit_Logs" className="px-4 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50 flex items-center gap-2 transition-colors shadow-sm" iconSize={18} />
 </div>

 {/* Controls: Search & Filter */}
 <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white/80 backdrop-blur-md p-4 rounded-[16px] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] sticky top-24 z-20">
 <div className="relative w-full md:w-[400px] group">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#144835] transition-colors" size={18} />
 <input
 type="text"
 placeholder="Search logs by user or details..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full bg-white border border-gray-200 rounded-lg py-2.5 pl-11 pr-4 text-xs text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 />
 </div>
 <button className="px-4 py-2 border border-gray-200 rounded-lg flex items-center gap-2 text-gray-600 font-medium hover:bg-gray-50 hover:text-gray-900 transition-all w-full md:w-auto text-xs shadow-sm">
 <Filter size={16} /> Advanced Filters
 </button>
 </div>

 {/* Logs Table */}
 <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-left">
 <thead className="bg-gray-50/80 border-b border-gray-100">
 <tr>
 <th className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">User</th>
 <th className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Action</th>
 <th className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Entity</th>
 <th className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Details</th>
 <th className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Timestamp</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {filteredLogs.length > 0 ? (
 filteredLogs.map((log) => (
 <tr key={log.id} className="hover:bg-gray-50/50 transition-colors group">
 <td className="px-4 py-2">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-[#144835] font-bold text-xs border-2 border-white shadow-sm ring-1 ring-gray-100">
 {log.user.name.charAt(0)}
 </div>
 <div>
 <div className="font-bold text-gray-900 group-hover:text-[#144835] transition-colors">{log.user.name}</div>
 <div className="text-xs text-gray-500 font-medium">{log.user.email}</div>
 </div>
 </div>
 </td>
 <td className="px-4 py-2">
 <span className={cn(
 "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest border",
 log.status === "Success" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
 log.status === "Warning" ? "bg-amber-50 text-amber-700 border-amber-200" :
 "bg-red-50 text-red-700 border-red-200"
 )}>
 {log.status === "Success" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
 {log.action}
 </span>
 </td>
 <td className="px-4 py-2">
 <span className="font-bold text-gray-700">{log.entity}</span>
 </td>
 <td className="px-4 py-2">
 <div className="flex items-start gap-3">
 <div className={cn(
 "mt-0.5 p-1.5 rounded-lg border",
 log.status === "Success" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
 log.status === "Warning" ? "bg-amber-50 text-amber-600 border-amber-100" :
 "bg-red-50 text-red-600 border-red-100"
 )}>
 {log.status === "Success" ? <CheckCircle2 size={14} /> : log.status === "Warning" ? <AlertCircle size={14} /> : <AlertCircle size={14} />}
 </div>
 <div>
 <p className="text-xs font-bold text-gray-900 group-hover:text-[#144835] transition-colors">{log.details}</p>
 <p className="text-[10px] text-gray-500 mt-0.5">ID: {log.id}</p>
 </div>
 </div>
 </td>
 <td className="px-4 py-2">
 <div className="flex flex-col gap-1">
 <span className="text-xs font-bold text-gray-700">
 {log.createdAt?.toDate ? log.createdAt.toDate().toLocaleDateString() : "-"}
 </span>
 <span className="text-xs text-gray-400 font-medium">
 {log.createdAt?.toDate ? log.createdAt.toDate().toLocaleTimeString() : "-"}
 </span>
 </div>
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={5} className="px-6 py-12 text-center">
 <div className="flex flex-col items-center justify-center space-y-3">
 <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
 <Search size={20} className="text-gray-400" />
 </div>
 <p className="text-gray-500 font-bold">No logs found matching your criteria</p>
 </div>
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
